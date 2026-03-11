import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
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
});
