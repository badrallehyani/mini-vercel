import express, { Request, Response } from 'express';
import cors from "cors";
import { data } from './database/database';
import mime from "mime-types";

const app = express();
app.use(cors());
app.use(express.json());


app.get(/(.*)/, (req: Request, res: Response) => {
    const host = req.headers.host || 'Unknown';

    const filePath = req.path === "/" ? "index.html" : req.path.substring(1); // Remove leading slash

    const [subdomain, ...rest] = host.split('.');
    if(!subdomain || rest.length === 0) {
        return res.status(400).send('Invalid host header');
    }

    const subdomainData = data.find(d => d.name === subdomain);
    if(!subdomainData) {
        return res.status(404).send('Subdomain not found');
    }

    const filePathOnDisk = subdomainData.getFilePath(filePath);
    if(!filePathOnDisk) {
        return res.status(404).send('File not found');
    }

    console.log(`Serving file from disk: ${filePathOnDisk}`);

    res.sendFile(filePathOnDisk);

});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});