import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Utils } from '../utils/S3Utils.js';
import { SQSUtils } from '../utils/SQSUtils.js';
import { DynamoDBJobRepository } from '../repositories/DynamoDBJobRepository.js';
import { DynamoDBCsvResultRepository } from '../repositories/DynamoDBCsvResultRepository.js';
import { BootstrapJobUseCase } from '../usecases/BootstrapJobUseCase.js';

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient());
const jobRepository = new DynamoDBJobRepository(docClient, process.env.TABLE_NAME);
const csvResultRepository = new DynamoDBCsvResultRepository(docClient, process.env.TABLE_NAME);
const s3Utils = new S3Utils();
const sqsUtils = new SQSUtils();
const bootstrapJobUseCase = new BootstrapJobUseCase(jobRepository, csvResultRepository, s3Utils, sqsUtils);

export const handler = async (event) => {
    const job = await bootstrapJobUseCase.execute(event.detail, process.env.QUEUE_URL);

    console.log(`Job bootstrapped: id=${job.id} status=${job.status}`);
};
