import {HeadObjectCommand, GetObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {createInterface} from "readline";

export class S3Utils {
    s3Client;
    constructor() {
        this.s3Client = new S3Client();
    }

    async getObjectMetadata(objectDetail) {
        const response = await this.s3Client.send(
            new HeadObjectCommand({
                Bucket: objectDetail.bucket.name,
                Key: objectDetail.object.key,
            })
        );

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
}
