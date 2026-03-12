import { DynamoDBClient, ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBIdempotencyRepository } from './DynamoDBIdempotencyRepository.js';
import { Idempotency } from '../models/Idempotency.js';

const docClientMock = mockClient(DynamoDBDocumentClient);
const TABLE_NAME = 'test-table';
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

const makeIdempotency = () => new Idempotency({ key: 'test-job-id#1' });

describe('DynamoDBIdempotencyRepository', () => {

    beforeEach(() => docClientMock.reset());

    describe('save', () => {
        it('returns true when key is saved successfully', async () => {
            docClientMock.on(PutCommand).resolves({});

            const repo = new DynamoDBIdempotencyRepository(docClient, TABLE_NAME);
            const result = await repo.save(makeIdempotency());

            expect(result).toBe(true);
            const calls = docClientMock.commandCalls(PutCommand);
            expect(calls).toHaveLength(1);
            expect(calls[0].args[0].input).toMatchObject({
                TableName: TABLE_NAME,
                Item: { PK: 'Idempotency', SK: 'test-job-id#1' },
                ConditionExpression: 'attribute_not_exists(SK)',
            });
        });

        it('returns false when key already exists', async () => {
            docClientMock.on(PutCommand).rejects(new ConditionalCheckFailedException({ message: 'key exists', $metadata: {} }));

            const repo = new DynamoDBIdempotencyRepository(docClient, TABLE_NAME);
            const result = await repo.save(makeIdempotency());

            expect(result).toBe(false);
        });

        it('rethrows unexpected errors', async () => {
            docClientMock.on(PutCommand).rejects(new Error('Service unavailable'));

            const repo = new DynamoDBIdempotencyRepository(docClient, TABLE_NAME);

            await expect(repo.save(makeIdempotency())).rejects.toThrow('Service unavailable');
        });
    });
});

