const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const mime = require('mime-types');

const s3Client = new S3Client({
    region: process.env.MINIO_REGION || 'nothing',
    endpoint: process.env.MINIO_ENDPOINT, // e.g., http://192.168.1.10:9000
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY,
        secretAccessKey: process.env.MINIO_SECRET_KEY,
    },
    forcePathStyle: true,
});

const PROJECT_ID = process.env.PROJECT_ID;
const GIT_URL = process.env.GIT_REPOSITORY_URL;
const BUCKET_NAME = process.env.BUCKET_NAME || 'outputs';

async function init() {
    console.log('Build process started...');

    // print environment variables for debugging
    console.log('Environment Variables:');
    console.log('GIT_REPOSITORY_URL:', GIT_URL);
    // console.log('BUCKET_NAME:', BUCKET_NAME);
    console.log('PROJECT_ID:', PROJECT_ID);
    // console.log('MINIO_REGION:', process.env.MINIO_REGION);
    // console.log('MINIO_ENDPOINT:', process.env.MINIO_ENDPOINT);
    // console.log('MINIO_ACCESS_KEY:', process.env.MINIO_ACCESS_KEY);
    // console.log('MINIO_SECRET_KEY:', process.env.MINIO_SECRET_KEY);

    const outDirPath = path.join(__dirname, 'output');

    // 2. Run Shell Commands
    const command =
        `git clone ${GIT_URL} ${outDirPath} && `
        + `cd ${outDirPath} && `
        + `npm install --engine-strict=false && `
        + `npm run build`;

    const p = exec(command);

    p.stdout.on('data', (data) => console.log(data.toString()));
    p.stderr.on('data', (data) => console.error(data.toString()));

    p.on('close', async () => {
        console.log('Build Complete. Starting upload...');

        // 3. Identify build folder (dist, build, or root)
        console.log('Build Complete. Checking for output directory...');

        // Define possible output folders in order of priority
        const foldersToTry = ['dist', 'build', 'out', '.next', 'public'];
        let distPath = '';

        for (const folder of foldersToTry) {
            const checkPath = path.join(outDirPath, folder);
            if (fs.existsSync(checkPath)) {
                distPath = checkPath;
                break;
            }
        }

        // Fallback: If no build folder exists, the user might just have an index.html in the root
        if (!distPath) {
            console.log("No standard build folder found. Defaulting to project root.");
            distPath = outDirPath;
        }

        console.log(`Uploading from: ${distPath}`);

        // Now run your readdirSync on the found path
        const files = fs.readdirSync(distPath, { recursive: true });

        for (const file of files) {
            const filePath = path.join(distPath, file);
            if (fs.lstatSync(filePath).isDirectory()) continue;

            console.log('Uploading', filePath);

            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: `${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath) || 'application/octet-stream'
            });

            await s3Client.send(command);
        }
        console.log('All files uploaded successfully!');
    });
}

init();