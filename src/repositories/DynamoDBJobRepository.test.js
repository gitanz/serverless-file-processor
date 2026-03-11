import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBJobRepository } from './DynamoDBJobRepository.js';
import { Job, JobStatus } from '../models/Job.js';

const docClientMock = mockClient(DynamoDBDocumentClient);
const TABLE_NAME = 'test-table';
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient());

const makeJob = () => new Job({
    id: 'test-job-id',
    sourceFilePath: '/uploads/test.csv',
});

describe('DynamoDBJobRepository', () => {

    beforeEach(() => {
        docClientMock.reset();
    });

    describe('save', () => {
        it('saves a job to DynamoDB', async () => {
            docClientMock.on(PutCommand).resolves({});

            const repo = new DynamoDBJobRepository(docClient, TABLE_NAME);
            await repo.save(makeJob());

            const calls = docClientMock.commandCalls(PutCommand);
            expect(calls).toHaveLength(1);
            expect(calls[0].args[0].input).toMatchObject({
                TableName: TABLE_NAME,
                Item: {
                    PK: 'Jobs',
                    SK: 'test-job-id',
                    SourceFilePath: '/uploads/test.csv',
                    JobStatus: JobStatus.PENDING,
                    TotalRows: 0,
                    TotalCompleted: 0,
                },
            });
        });
    });

    describe('retrieve', () => {
        it('retrieves a job from DynamoDB and returns a Job object', async () => {
            const now = new Date().toISOString();
            docClientMock.on(GetCommand).resolves({
                Item: {
                    PK: 'Jobs',
                    SK: 'test-job-id',
                    SourceFilePath: '/uploads/test.csv',
                    JobStatus: JobStatus.PENDING,
                    TotalRows: 10,
                    TotalCompleted: 5,
                    CreatedAt: now,
                    UpdatedAt: now,
                },
            });

            const repo = new DynamoDBJobRepository(docClient, TABLE_NAME);
            const job = await repo.retrieve('test-job-id');

            expect(job).toBeInstanceOf(Job);
            expect(job.id).toEqual('test-job-id');
            expect(job.sourceFilePath).toEqual('/uploads/test.csv');
            expect(job.status).toEqual(JobStatus.PENDING);
            expect(job.totalRows).toEqual(10);
            expect(job.totalCompleted).toEqual(5);

            const calls = docClientMock.commandCalls(GetCommand);
            expect(calls).toHaveLength(1);
            expect(calls[0].args[0].input).toMatchObject({
                TableName: TABLE_NAME,
                Key: { PK: 'Jobs', SK: 'test-job-id' },
                ConsistentRead: true,
            });
        });

        it('returns null if job does not exist', async () => {
            docClientMock.on(GetCommand).resolves({});

            const repo = new DynamoDBJobRepository(docClient, TABLE_NAME);
            const job = await repo.retrieve('non-existent-id');

            expect(job).toBeNull();
        });
    });
});

