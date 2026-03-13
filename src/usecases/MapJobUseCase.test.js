import { jest } from '@jest/globals';
import { S3Client, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { mockClient } from 'aws-sdk-client-mock';
import { Readable } from 'stream';
import { MapJobUseCase } from './MapJobUseCase.js';
import { Job, JobStatus } from '../models/Job.js';
import { S3Utils } from '../utils/S3Utils.js';
import { SQSUtils } from '../utils/SQSUtils.js';

const s3Mock = mockClient(S3Client);
const sqsMock = mockClient(SQSClient);
const csvContent = "country, sales\nireland, 1000\nuk, 2000";

const objectDetails = {
    bucket: { name: 'my-test-bucket' },
    object: { key: 'uploads/test-file.csv' },
};

const makeMockStrategy = () => {
    const mockResultRepository = { save: jest.fn().mockResolvedValue() };
    const mockFactory = {
        getStreamer: jest.fn().mockReturnValue({
            streamRows: jest.fn().mockImplementation(async function* () {
                yield { country: 'ireland', sales: '1000' };
                yield { country: 'uk', sales: '2000' };
            }),
        }),
        createDto: jest.fn().mockImplementation((data) => data),
        createResult: jest.fn().mockReturnValue({}),
        getResultRepository: jest.fn().mockReturnValue(mockResultRepository),
    };

    return {
        strategy: { getFactory: jest.fn().mockReturnValue(mockFactory) },
        mockFactory,
        mockResultRepository,
    };
};

describe('MapJobUseCase', () => {

    beforeEach(() => {
        s3Mock.reset();
        sqsMock.reset();
    });

    it('creates and saves a job with the jobId from S3 metadata', async () => {
        s3Mock.on(HeadObjectCommand).resolves({ ContentType: 'text/csv', Metadata: { jobid: 'test-job-id' } });
        s3Mock.on(GetObjectCommand).resolves({ Body: Readable.from(csvContent) });
        sqsMock.on(SendMessageCommand).resolves({});

        const mockJobRepository = { save: jest.fn().mockResolvedValue() };
        const { strategy, mockResultRepository } = makeMockStrategy();
        const useCase = new MapJobUseCase(mockJobRepository, strategy, new S3Utils(), new SQSUtils());

        const job = await useCase.execute(objectDetails, 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue');

        expect(job).toBeInstanceOf(Job);
        expect(job.id).toEqual('test-job-id');
        expect(job.sourceFilePath).toEqual('s3://my-test-bucket/uploads/test-file.csv');
        expect(job.status).toEqual(JobStatus.PENDING);
        expect(job.totalRows).toEqual(2);
        expect(mockJobRepository.save).toHaveBeenCalledTimes(1);
        expect(mockResultRepository.save).toHaveBeenCalledTimes(1);
        expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(2);
        const firstMessage = JSON.parse(sqsMock.commandCalls(SendMessageCommand)[0].args[0].input.MessageBody);
        expect(firstMessage.key).toEqual('test-job-id#1');
        const secondMessage = JSON.parse(sqsMock.commandCalls(SendMessageCommand)[1].args[0].input.MessageBody);
        expect(secondMessage.key).toEqual('test-job-id#2');
    });

    it('throws if jobid is missing from S3 metadata', async () => {
        s3Mock.on(HeadObjectCommand).resolves({ ContentType: 'text/csv', Metadata: {} });

        const mockJobRepository = { save: jest.fn() };
        const { strategy } = makeMockStrategy();
        const useCase = new MapJobUseCase(mockJobRepository, strategy, new S3Utils(), new SQSUtils());

        await expect(useCase.execute(objectDetails))
            .rejects.toThrow('Job not found');

        expect(mockJobRepository.save).not.toHaveBeenCalled();
    });

    it('throws if metadata is not present on the S3 object', async () => {
        s3Mock.on(HeadObjectCommand).resolves({ ContentType: 'text/csv' });

        const mockJobRepository = { save: jest.fn() };
        const { strategy } = makeMockStrategy();
        const useCase = new MapJobUseCase(mockJobRepository, strategy, new S3Utils(), new SQSUtils());

        await expect(useCase.execute(objectDetails))
            .rejects.toThrow('Job not found');

        expect(mockJobRepository.save).not.toHaveBeenCalled();
    });

    it('throws if content type is not supported', async () => {
        s3Mock.on(HeadObjectCommand).resolves({ ContentType: 'application/json', Metadata: { jobid: 'test-job-id' } });

        const mockJobRepository = { save: jest.fn() };
        const { strategy } = makeMockStrategy();
        const useCase = new MapJobUseCase(mockJobRepository, strategy, new S3Utils(), new SQSUtils());

        await expect(useCase.execute(objectDetails))
            .rejects.toThrow('Unsupported content type: application/json');

        expect(mockJobRepository.save).toHaveBeenCalled();
    });

    it('throws if file size is greater than max limit', async () => {
        s3Mock.on(HeadObjectCommand).resolves({ ContentType: 'text/csv', ContentLength: 11 * 1024 * 1024, Metadata: { jobid: 'test-job-id' } });

        const mockJobRepository = { save: jest.fn() };
        const { strategy } = makeMockStrategy();
        const useCase = new MapJobUseCase(mockJobRepository, strategy, new S3Utils(), new SQSUtils());

        await expect(useCase.execute(objectDetails))
            .rejects.toThrow('Exceeds max file size');

        expect(mockJobRepository.save).toHaveBeenCalled();
    });
});

