import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Readable } from 'stream';
import { handler } from './index.js';

const s3Mock = mockClient(S3Client);
const sqsMock = mockClient(SQSClient);
const dynamoMock = mockClient(DynamoDBDocumentClient);

const csvContent = "country, sales\nireland, 1000\nuk, 2000";

const event = {
    detail: {
        bucket: { name: 'my-test-bucket' },
        object: { key: 'uploads/test-file.csv' },
    },
};

describe('Bootstrapper handler', () => {

    beforeEach(() => {
        s3Mock.reset();
        sqsMock.reset();
        dynamoMock.reset();
    });

    it('initializes a job when called with a valid event', async () => {
        s3Mock.on(HeadObjectCommand).resolves({ Metadata: { jobid: 'test-job-id' } });
        s3Mock.on(GetObjectCommand).resolves({ Body: Readable.from(csvContent) });
        sqsMock.on(SendMessageCommand).resolves({});
        dynamoMock.on(PutCommand).resolves({});

        await handler(event);

        expect(s3Mock.commandCalls(HeadObjectCommand)).toHaveLength(1);
        expect(dynamoMock.commandCalls(PutCommand)).toHaveLength(2);
        expect(dynamoMock.commandCalls(PutCommand)[0].args[0].input.Item).toMatchObject({
            PK: 'Jobs',
            SK: 'test-job-id',
            SourceFilePath: 's3://my-test-bucket/uploads/test-file.csv',
            TotalRows: 2,
        });
        expect(dynamoMock.commandCalls(PutCommand)[1].args[0].input.Item).toMatchObject({
            PK: 'Results',
            SK: 'test-job-id',
            TotalSales: 0,
            AverageSales: 0,
        });
    });

    it('propagates error if jobid is missing from metadata', async () => {
        s3Mock.on(HeadObjectCommand).resolves({ Metadata: {} });

        await expect(handler(event)).rejects.toThrow('jobid not found in object metadata');

        expect(dynamoMock.commandCalls(PutCommand)).toHaveLength(0);
    });
});
