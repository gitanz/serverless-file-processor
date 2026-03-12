import { S3Client, HeadObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { Readable } from "stream";
import {S3Utils} from "./S3Utils.js";

const s3Mock = mockClient(S3Client);

describe("S3Utils Unit Tests", () => {

    beforeEach(() => s3Mock.reset());

    it("retrieves custom metadata from S3", async () => {

        const s3Utils = new S3Utils();

        s3Mock.on(HeadObjectCommand).resolves({
            Metadata: { JobId: "thisisauniquejobid" },
        });

        const result = await s3Utils.getObjectMetadata({
            bucket: {
                name: "my-test-bucket",
            },
            object: {
                key: "uploads/test-file.csv",
                size: 1024,
            },
        },);

        expect(result).toEqual({ JobId: "thisisauniquejobid" });
        expect(s3Mock.calls()).toHaveLength(1);
    });

    it("streams object contents from S3", async () => {
        const s3Utils = new S3Utils();
        const fileContent = "country, sales\nireland, 1000\nuk, 2000";

        s3Mock.on(GetObjectCommand).resolves({
            Body: Readable.from(fileContent),
        });

        const lines = [];
        for await (const line of s3Utils.streamObject("my-test-bucket", "uploads/test-file.csv")) {
            lines.push(line);
        }

        expect(lines).toEqual(["country, sales", "ireland, 1000", "uk, 2000"]);
        expect(s3Mock.commandCalls(GetObjectCommand)[0].args[0].input).toMatchObject({
            Bucket: "my-test-bucket",
            Key: "uploads/test-file.csv",
        });
    })

    it("returns a presigned URL for job upload", async () => {
        process.env.BUCKET_NAME = 'my-test-bucket';

        const s3Utils = new S3Utils();
        const url = await s3Utils.getJobUploadSignedUrl('test-job-id');

        expect(url).toContain('my-test-bucket');
        expect(url).toContain('test-job-id');
        expect(url).toContain('X-Amz-Expires=600');
    });
});
