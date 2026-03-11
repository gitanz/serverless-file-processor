import {HeadObjectCommand, S3Client} from "@aws-sdk/client-s3";

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
}