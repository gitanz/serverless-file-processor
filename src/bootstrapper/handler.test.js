import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from './index.js';

const s3Mock = mockClient(S3Client);
const dynamoMock = mockClient(DynamoDBDocumentClient);

const event = {
    detail: {
        bucket: { name: 'my-test-bucket' },
        object: { key: 'uploads/test-file.csv' },
    },
};

describe('Bootstrapper handler', () => {

    beforeEach(() => {
        s3Mock.reset();
        dynamoMock.reset();
    });

    it('initializes a job when called with a valid event', async () => {
        s3Mock.on(HeadObjectCommand).resolves({ Metadata: { jobid: 'test-job-id' } });
        dynamoMock.on(PutCommand).resolves({});

        await handler(event);

        expect(s3Mock.commandCalls(HeadObjectCommand)).toHaveLength(1);
        expect(dynamoMock.commandCalls(PutCommand)).toHaveLength(1);
        expect(dynamoMock.commandCalls(PutCommand)[0].args[0].input.Item).toMatchObject({
            PK: 'Jobs',
            SK: 'test-job-id',
            SourceFilePath: 's3://my-test-bucket/uploads/test-file.csv',
        });
    });

    it('propagates error if jobid is missing from metadata', async () => {
        s3Mock.on(HeadObjectCommand).resolves({ Metadata: {} });

        await expect(handler(event)).rejects.toThrow('jobid not found in object metadata');

        expect(dynamoMock.commandCalls(PutCommand)).toHaveLength(0);
    });
});
