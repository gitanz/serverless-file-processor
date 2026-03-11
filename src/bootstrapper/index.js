import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Utils } from '../utils/S3Utils.js';
import { DynamoDBJobRepository } from '../repositories/DynamoDBJobRepository.js';
import { JobInitializationUseCase } from '../usecases/JobInitializationUseCase.js';

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient());
const jobRepository = new DynamoDBJobRepository(docClient, process.env.TABLE_NAME);
const s3Utils = new S3Utils();
const jobInitializationUseCase = new JobInitializationUseCase(jobRepository, s3Utils);

export const handler = async (event) => {
    const job = await jobInitializationUseCase.execute(event.detail);

    console.log(`Job initialized: id=${job.id} status=${job.status}`);
};
