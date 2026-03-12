import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Utils } from './utils/S3Utils.js';
import { SQSUtils } from './utils/SQSUtils.js';
import { DynamoDBJobRepository } from './repositories/DynamoDBJobRepository.js';
import { DynamoDBCsvResultRepository } from './repositories/DynamoDBCsvResultRepository.js';
import { DynamoDBIdempotencyRepository } from './repositories/DynamoDBIdempotencyRepository.js';
import { MapJobUseCase } from './usecases/MapJobUseCase.js';
import { ReduceJobUseCase } from './usecases/ReduceJobUseCase.js';
import { GenerateUploadUrlUseCase } from './usecases/GenerateUploadUrlUseCase.js';

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient());
const jobRepository = new DynamoDBJobRepository(docClient, process.env.TABLE_NAME);
const csvResultRepository = new DynamoDBCsvResultRepository(docClient, process.env.TABLE_NAME);
const idempotencyRepository = new DynamoDBIdempotencyRepository(docClient, process.env.TABLE_NAME);
const s3Utils = new S3Utils();
const sqsUtils = new SQSUtils();

const mapJobUseCase = new MapJobUseCase(jobRepository, csvResultRepository, s3Utils, sqsUtils);
const reduceJobUseCase = new ReduceJobUseCase(jobRepository, csvResultRepository, idempotencyRepository);
const generateUploadUrlUseCase = new GenerateUploadUrlUseCase(s3Utils);

export const upload = async () => {
    const { jobId, url } = await generateUploadUrlUseCase.execute();

    return {
        statusCode: 200,
        body: JSON.stringify({ jobId, url }),
    };
};

export const map = async (event) => {
    const job = await mapJobUseCase.execute(event.detail, process.env.QUEUE_URL);

    console.log(`Job mapped: id=${job.id} status=${job.status}`);
};

export const reduce = async (event) => {
    for (const record of event.Records) {
        const message = JSON.parse(record.body);
        console.log(`Processing message key=${message.key}`);
        await reduceJobUseCase.execute(message);
    }
};

