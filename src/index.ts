import { config } from 'dotenv';
config();

import express, { Request, Response } from 'express';
import cors from "cors";
import mime from "mime-types";

import { getObject, uploadFileToS3, uploadFolderS3 } from './services/minio.service';
import { sdkStreamMixin } from '@aws-sdk/util-stream-node';

import clone from "git-clone/promise";
import { getLogFilePath, getProjectType, PROJECTS_TYPES } from './utils/utils';
import { buildAndRunDockerImage } from './services/docker.service';

import fs from 'node:fs/promises';

const app = express();
app.use(cors());
app.use(express.json());

app.get(/(.*)/, async (req: Request, res: Response, next: Function) => {
    const host = req.headers.host || 'Unknown';

    var filePath = req.path.endsWith("/") ? `${req.path}index.html` : req.path;
    filePath = filePath.startsWith("/") ? filePath.substring(1) : filePath; // Remove leading slash if exists

    const [subdomain, ...rest] = host.split('.');
    if (!subdomain || rest.length === 0) {
        next();
        return;
    }

    const fullPath = `${subdomain}/${filePath}`;

    var objectData;

    try {
        objectData = await getObject(fullPath, "outputs");
    } catch (err) {
        return res.status(404).send(err);
    }

    const nodeStream = sdkStreamMixin(objectData.Body as any);

    res.setHeader('Content-Type', mime.lookup(filePath) || 'application/octet-stream');
    nodeStream.pipe(res);
})

app.get("/upload-github", async (req: Request, res: Response) => {
    // const repoURL = req.query.repoURL as string || "https://github.com/badrallehyani/photobooth";
    // const projectID = req.query.subdomainName as string || "photobooth";
    
    const repoURL = req.query.repoURL as string || "https://github.com/nediry/todo-react";
    const projectID = req.query.subdomainName as string || "todo-react";

    const tmpFolderName = `./tmp/${Date.now()}`;

    try {
        await clone(repoURL, tmpFolderName);
    } catch (err) {
        res.status(500).send("Error cloning repository: " + err);
        return;
    }

    const type = await getProjectType(tmpFolderName);

    if (type === PROJECTS_TYPES.NPM) {
        await fs.rm(tmpFolderName, { recursive: true, force: true });

        const container = await buildAndRunDockerImage(repoURL, projectID)
        res.send("Building Docker image. Check logs for progress.");
    }

    else if (type === PROJECTS_TYPES.VANILLA) {
        try {

            const logPath = getLogFilePath(projectID);

            const logger = async (msg: string) => {
                const logMsg = `[${new Date().toISOString()}] ${msg}`;
                console.log(logMsg);
                await fs.appendFile(logPath, logMsg + "\n");
            }

            uploadFolderS3(projectID, tmpFolderName, logger)
            .then(async ()=>{
                logger("Upload Completed");
                
                await uploadFileToS3("logs", `${projectID}.log`, logPath);

                await fs.rm(tmpFolderName, { recursive: true, force: true });
                await fs.rm(logPath);
            })
            .catch((err)=>{
                logger("Error uploading to S3: " + err);
            });


            res.send("Repository uploading");

        } catch (err) {
            res.status(500).send("Error uploading repository: " + err);
        }
    }
});

app.get("/logs/:projectID", async (req: Request, res: Response) => {
    const projectID = req.params.projectID;
    const objectKey = `${projectID}.log`;

    try {
        const objectData = await getObject(objectKey, "logs");
        const nodeStream = sdkStreamMixin(objectData.Body as any);
        res.setHeader('Content-Type', 'text/plain');
        nodeStream.pipe(res);
    } catch (err) {
        res.status(404).send("Log not found: " + err);
    }
})


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});