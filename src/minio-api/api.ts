import { S3Client, ListBucketsCommand, ListObjectsCommand, GetObjectCommand, GetObjectCommandOutput } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
    region: 'placeholder',
    endpoint: 'http://localhost:9000',
    credentials: {
        accessKeyId: 'minioadmin',
        secretAccessKey: 'minioadmin'
    },
    forcePathStyle: true
})

export async function getObject(objectKey: string): Promise<GetObjectCommandOutput> {
    try {
        const objectData = await s3Client.send(new GetObjectCommand({
            Bucket: 'outputs',
            Key: objectKey
        }))
        return objectData;
    } catch (err) {
        return Promise.reject(err);
    }
}