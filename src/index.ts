import express, { Request, Response } from 'express';
import cors from "cors";
import mime from "mime-types";
import { getObject } from './minio-api/api';
import { sdkStreamMixin } from '@aws-sdk/util-stream-node';

const app = express();
app.use(cors());
app.use(express.json());

app.get(/(.*)/, async (req: Request, res: Response) => {
    const host = req.headers.host || 'Unknown';
    const filePath = req.path === "/" ? "index.html" : req.path.substring(1); // Remove leading slash

    const [subdomain, ...rest] = host.split('.');
    if (!subdomain || rest.length === 0) {
        return res.status(400).send('Invalid host header');
    }

    const fullPath = `${subdomain}/${filePath}`;

    var objectData;

    try{
        objectData = await getObject(fullPath);
    } catch (err) {
        return res.status(404).send('File not found');
    }

    const nodeStream = sdkStreamMixin(objectData.Body as any);

    res.setHeader('Content-Type', mime.lookup(filePath) || 'application/octet-stream');
    nodeStream.pipe(res);
}
)


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});