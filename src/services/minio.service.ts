import { readFile } from "node:fs/promises";
import { S3Client, GetObjectCommand, GetObjectCommandOutput, PutObjectCommand } from '@aws-sdk/client-s3'
import { getAllFiles } from "../utils/utils";

const s3Client = new S3Client({
    region: process.env.MINIO_REGION || 'nothing',
    endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
    },
    forcePathStyle: true
})

// print environment variables for debugging
console.log("S3 Client Configuration:");
console.log("Region:", process.env.MINIO_REGION || 'nothing');
console.log("Endpoint:", process.env.MINIO_ENDPOINT || 'http://localhost:9000');
console.log("Access Key ID:", process.env.MINIO_ACCESS_KEY ? "****" : "Not Set");
console.log("Secret Access Key:", process.env.MINIO_SECRET_KEY ? "****" : "Not Set");

export async function getObject(objectKey: string, bucketName: string): Promise<GetObjectCommandOutput> {
    try {
        const objectData = await s3Client.send(new GetObjectCommand({
            Bucket: bucketName,
            Key: objectKey
        }))
        return objectData;
    } catch (err) {
        return Promise.reject(err);
    }
}

export async function uploadFileToS3(bucketName: string, objectKey: string, filePath: string): Promise<void> {
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: await readFile(filePath)
    });

    try {
        await s3Client.send(command);
    } catch (err) {
        console.error("Error uploading file to S3:", err);
        return Promise.reject(err);
    }
}

export async function uploadFolderS3(
    subdomainName: string, 
    localFolderPath: string,
    onProgress?: (msg: string) => void
): Promise<any> {
    
    const files = await getAllFiles(localFolderPath);

    const uploadPromises = files.map(file => {
        const relativePath = file.relativePath.replace(/\\/g, "/");
        const s3Key = `${subdomainName}/${relativePath}`;
        
        onProgress?.("Uploading: " + relativePath);

        return uploadFileToS3("outputs", s3Key, file.absolutePath);
    });

    return Promise.all(uploadPromises);
}