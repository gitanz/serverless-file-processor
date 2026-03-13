import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Utils } from './utils/S3Utils.js';
import { SQSUtils } from './utils/SQSUtils.js';
import { DynamoDBJobRepository } from './repositories/DynamoDBJobRepository.js';
import { DynamoDBIdempotencyRepository } from './repositories/DynamoDBIdempotencyRepository.js';
import { MapJobUseCase } from './usecases/MapJobUseCase.js';
import { ReduceJobUseCase } from './usecases/ReduceJobUseCase.js';
import { GenerateUploadUrlUseCase } from './usecases/GenerateUploadUrlUseCase.js';
import { GetJobsUseCase } from './usecases/GetJobsUseCase.js';
import { GetJobResultUseCase } from './usecases/GetJobResultUseCase.js';
import { FileProcessingStrategy } from './factories/FileProcessingStrategy.js';
import { FileValidationError } from './errors/FileValidationError.js';
import { JobNotFound } from './errors/JobNotFound.js';

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient());
const jobRepository = new DynamoDBJobRepository(docClient, process.env.TABLE_NAME);
const idempotencyRepository = new DynamoDBIdempotencyRepository(docClient, process.env.TABLE_NAME);
const s3Utils = new S3Utils();
const sqsUtils = new SQSUtils();
const fileProcessingStrategy = new FileProcessingStrategy();

const mapJobUseCase = new MapJobUseCase(jobRepository, fileProcessingStrategy, s3Utils, sqsUtils);
const reduceJobUseCase = new ReduceJobUseCase(jobRepository, fileProcessingStrategy, idempotencyRepository);
const generateUploadUrlUseCase = new GenerateUploadUrlUseCase(s3Utils);
const getJobsUseCase = new GetJobsUseCase(jobRepository);
const getJobResultsUseCase = new GetJobResultUseCase(jobRepository, fileProcessingStrategy);

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'http://localhost:4200',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
};

export const upload = async (event) => {
    const correlationId = event?.headers?.['x-cor-id'];
    const { jobId, url } = await generateUploadUrlUseCase.execute(correlationId);

    return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ jobId, url }),
    };
};

export const getJobs = async () => {
    const jobs = await getJobsUseCase.execute();

    return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(jobs),
    };
};

export const getJobResults = async (event) => {
    try {
        const jobId = event.pathParameters?.id;
        const result = await getJobResultsUseCase.execute(jobId);

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify(result),
        };

    } catch (err) {
        console.error(`CorrelationID#: ${err.message}`);

        if (err instanceof JobNotFound) {
            return {
                statusCode: 404,
                headers: CORS_HEADERS,
                body: JSON.stringify({ message: err.message }),
            };
        }

        return {
            statusCode: 503,
            headers: CORS_HEADERS,
            body: JSON.stringify({ message: err.message }),
        };
    }
};

export const map = async (event) => {
    try {
        const job = await mapJobUseCase.execute(event.detail, process.env.QUEUE_URL);
        console.log(`Job mapped: id=${job.id} status=${job.status}`);
    } catch (err) {
        console.error(`CorrelationID#: ${err.message}`);

        if (err instanceof JobNotFound) {
            return {
                statusCode: 404,
                headers: CORS_HEADERS,
                body: JSON.stringify({ message: err.message }),
            };
        }

        if (err instanceof FileValidationError) {
            return {
                statusCode: 403,
                headers: CORS_HEADERS,
                body: JSON.stringify({ message: err.message }),
            };
        }

        return {
            statusCode: 503,
            headers: CORS_HEADERS,
            body: JSON.stringify({ message: err.message }),
        };
    }
};

export const reduce = async (event) => {
    try {
        for (const record of event.Records) {
            const message = JSON.parse(record.body);
            console.log(`Processing message key=${message.key}`);
            await reduceJobUseCase.execute(message);
        }
    } catch (err) {
        console.error(`CorrelationID#: ${err.message}`);
        return {
            statusCode: 503,
            headers: CORS_HEADERS,
            body: JSON.stringify({ message: err.message }),
        };
    }

};

