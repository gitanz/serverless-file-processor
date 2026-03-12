import { jest } from '@jest/globals';
import { S3Client, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { mockClient } from 'aws-sdk-client-mock';
import { Readable } from 'stream';
import { JobInitializationUseCase } from './JobInitializationUseCase.js';
import { Job, JobStatus } from '../models/Job.js';
import { S3Utils } from '../utils/S3Utils.js';
import { SQSUtils } from '../utils/SQSUtils.js';
import { CSVRowDTO } from '../dtos/RowDTOs.js';

const s3Mock = mockClient(S3Client);
const sqsMock = mockClient(SQSClient);
const csvContent = "country, sales\nireland, 1000\nuk, 2000";

const objectDetails = {
    bucket: { name: 'my-test-bucket' },
    object: { key: 'uploads/test-file.csv' },
};

describe('JobInitializationUseCase', () => {

    beforeEach(() => {
        s3Mock.reset();
        sqsMock.reset();
    });

    it('creates and saves a job with the jobId from S3 metadata', async () => {
        s3Mock.on(HeadObjectCommand).resolves({ Metadata: { jobid: 'test-job-id' } });
        s3Mock.on(GetObjectCommand).resolves({ Body: Readable.from(csvContent) });
        sqsMock.on(SendMessageCommand).resolves({});

        const mockRepository = { save: jest.fn().mockResolvedValue() };
        const useCase = new JobInitializationUseCase(mockRepository, new S3Utils(), new SQSUtils());

        const job = await useCase.execute(objectDetails, 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue');

        expect(job).toBeInstanceOf(Job);
        expect(job.id).toEqual('test-job-id');
        expect(job.sourceFilePath).toEqual('s3://my-test-bucket/uploads/test-file.csv');
        expect(job.status).toEqual(JobStatus.PENDING);
        expect(job.totalRows).toEqual(2);
        expect(mockRepository.save).toHaveBeenCalledTimes(1);
        expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(2);
        const firstMessage = JSON.parse(sqsMock.commandCalls(SendMessageCommand)[0].args[0].input.MessageBody);
        expect(firstMessage.key).toEqual('test-job-id#1');
        const secondMessage = JSON.parse(sqsMock.commandCalls(SendMessageCommand)[1].args[0].input.MessageBody);
        expect(secondMessage.key).toEqual('test-job-id#2');
    });

    it('throws if jobid is missing from S3 metadata', async () => {
        s3Mock.on(HeadObjectCommand).resolves({
            Metadata: {},
        });

        const mockRepository = { save: jest.fn() };
        const useCase = new JobInitializationUseCase(mockRepository, new S3Utils(), new SQSUtils());

        await expect(useCase.execute(objectDetails))
            .rejects.toThrow('jobid not found in object metadata');

        expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('throws if metadata is not present on the S3 object', async () => {
        s3Mock.on(HeadObjectCommand).resolves({});

        const mockRepository = { save: jest.fn() };
        const useCase = new JobInitializationUseCase(mockRepository, new S3Utils(), new SQSUtils());

        await expect(useCase.execute(objectDetails))
            .rejects.toThrow('jobid not found in object metadata');

        expect(mockRepository.save).not.toHaveBeenCalled();
    });
});

