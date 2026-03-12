import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoDBJobRepository } from '../repositories/DynamoDBJobRepository.js';
import { DynamoDBCsvResultRepository } from '../repositories/DynamoDBCsvResultRepository.js';
import { DynamoDBIdempotencyRepository } from '../repositories/DynamoDBIdempotencyRepository.js';
import { ReduceJobUseCase } from '../usecases/ReduceJobUseCase.js';

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient());
const jobRepository = new DynamoDBJobRepository(docClient, process.env.TABLE_NAME);
const csvResultRepository = new DynamoDBCsvResultRepository(docClient, process.env.TABLE_NAME);
const idempotencyRepository = new DynamoDBIdempotencyRepository(docClient, process.env.TABLE_NAME);
const reduceJobUseCase = new ReduceJobUseCase(jobRepository, csvResultRepository, idempotencyRepository);

export const handler = async (event) => {
    for (const record of event.Records) {
        const message = JSON.parse(record.body);
        console.log(`Processing message key=${message.key}`);
        await reduceJobUseCase.execute(message);
    }
};
