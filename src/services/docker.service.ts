import Docker from 'dockerode';
import { createWriteStream } from 'node:fs';
import { PassThrough } from 'node:stream';
import { uploadFileToS3 } from './minio.service';

import fs from 'node:fs/promises';
import { getLogFilePath } from '../utils/utils';

const docker = new Docker();

export async function buildAndRunDockerImage(gitURL: string, projectID: string) {

    try {
        // Inside your docker.service.ts
        const container = await docker.createContainer({
            Image: 'mini-vercel-worker',
            Env: [
                `GIT_REPOSITORY_URL=${gitURL}`,
                `PROJECT_ID=${projectID}`,
                `MINIO_ENDPOINT=http://host.docker.internal:9000`, // Special Docker DNS to reach host
                `MINIO_ACCESS_KEY=${process.env.MINIO_ACCESS_KEY}`,
                `MINIO_SECRET_KEY=${process.env.MINIO_SECRET_KEY}`,
                `MINIO_REGION=${process.env.MINIO_REGION}`
            ],
        });

        await container.start();

        const logs = await container.logs({
            follow: true,
            stdout: true,
            stderr: true,
            timestamps: false
        });

        const cleanTextStream = new PassThrough();
        container.modem.demuxStream(logs, cleanTextStream, cleanTextStream);

        const logPath = getLogFilePath(projectID);
        const fileWriteStream = createWriteStream(logPath);
        cleanTextStream.pipe(fileWriteStream);

        container.wait( async ()=>{
            fileWriteStream.end();
            await uploadFileToS3("logs", `${projectID}.log`, logPath);
            await fs.rm(logPath);
        })

        return container;
    } catch (err) {
        console.error("Error building/running Docker image:", err);
        throw err;

    }

}