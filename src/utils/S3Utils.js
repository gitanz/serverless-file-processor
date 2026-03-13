import {GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {createInterface} from "readline";

export class S3Utils {
    s3Client;
    constructor() {
        this.s3Client = new S3Client({ region: process.env.AWS_REGION ?? 'eu-west-1' });
    }

    async getObjectHeaders(objectDetail) {
        return await this.s3Client.send(
            new HeadObjectCommand({
                Bucket: objectDetail.bucket.name,
                Key: objectDetail.object.key,
            })
        );
    }

    async getObjectMetadata(objectDetail) {
        const response = await this.getObjectHeaders(objectDetail);
        return response.Metadata;
    }

    async *streamObject(bucket, key) {
        const response = await this.s3Client.send(
            new GetObjectCommand({Bucket: bucket, Key: key})
        );

        const rl = createInterface({
            input: response.Body,
            crlfDelay: Infinity,
        });

        for await (const line of rl) {
            yield line;
        }
    }

    async getJobUploadSignedUrl(jobId, correlationId) {
        const command = new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: `${jobId}`,
            Metadata: {
                jobid: jobId,
                corid: correlationId,
            },
        });

        return getSignedUrl(this.s3Client, command, { expiresIn: 600 });
    }
}
