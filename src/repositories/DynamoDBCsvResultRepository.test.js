import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBCsvResultRepository } from './DynamoDBCsvResultRepository.js';
import { CsvResult } from '../models/CsvResult.js';

const docClientMock = mockClient(DynamoDBDocumentClient);
const TABLE_NAME = 'test-table';
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

const makeCsvResult = () => new CsvResult({ jobId: 'test-job-id' });

describe('DynamoDBCsvResultRepository', () => {

    beforeEach(() => docClientMock.reset());

    describe('save', () => {
        it('saves a CsvResult to DynamoDB', async () => {
            docClientMock.on(PutCommand).resolves({});

            const repo = new DynamoDBCsvResultRepository(docClient, TABLE_NAME);
            await repo.save(makeCsvResult());

            const calls = docClientMock.commandCalls(PutCommand);
            expect(calls).toHaveLength(1);
            expect(calls[0].args[0].input).toMatchObject({
                TableName: TABLE_NAME,
                Item: {
                    PK: 'Results',
                    SK: 'test-job-id',
                    TotalSales: 0,
                    AverageSales: 0,
                },
            });
        });
    });

    describe('retrieve', () => {
        it('retrieves a CsvResult from DynamoDB and returns a CsvResult object', async () => {
            const now = new Date().toISOString();
            docClientMock.on(GetCommand).resolves({
                Item: {
                    PK: 'Results',
                    SK: 'test-job-id',
                    TotalSales: 5000,
                    AverageSales: 2500,
                    CreatedAt: now,
                    UpdatedAt: now,
                },
            });

            const repo = new DynamoDBCsvResultRepository(docClient, TABLE_NAME);
            const result = await repo.retrieve('test-job-id');

            expect(result).toBeInstanceOf(CsvResult);
            expect(result.jobId).toEqual('test-job-id');
            expect(result.totalSales).toEqual(5000);
            expect(result.averageSales).toEqual(2500);

            const calls = docClientMock.commandCalls(GetCommand);
            expect(calls).toHaveLength(1);
            expect(calls[0].args[0].input).toMatchObject({
                TableName: TABLE_NAME,
                Key: { PK: 'Results', SK: 'test-job-id' },
                ConsistentRead: true,
            });
        });

        it('returns null if CsvResult does not exist', async () => {
            docClientMock.on(GetCommand).resolves({});

            const repo = new DynamoDBCsvResultRepository(docClient, TABLE_NAME);
            const result = await repo.retrieve('non-existent-id');

            expect(result).toBeNull();
        });
    });
});

