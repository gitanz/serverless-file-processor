import { jest } from '@jest/globals';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { JobInitializationUseCase } from './JobInitializationUseCase.js';
import { Job, JobStatus } from '../models/Job.js';
import { S3Utils } from '../utils/S3Utils.js';

const s3Mock = mockClient(S3Client);

const objectDetails = {
    bucket: { name: 'my-test-bucket' },
    object: { key: 'uploads/test-file.csv' },
};

describe('JobInitializationUseCase', () => {

    beforeEach(() => s3Mock.reset());

    it('creates and saves a job with the jobId from S3 metadata', async () => {
        s3Mock.on(HeadObjectCommand).resolves({
            Metadata: { jobid: 'test-job-id' },
        });

        const mockRepository = { save: jest.fn().mockResolvedValue() };
        const useCase = new JobInitializationUseCase(mockRepository, new S3Utils());

        const job = await useCase.execute(objectDetails);

        expect(job).toBeInstanceOf(Job);
        expect(job.id).toEqual('test-job-id');
        expect(job.sourceFilePath).toEqual('s3://my-test-bucket/uploads/test-file.csv');
        expect(job.status).toEqual(JobStatus.PENDING);
        expect(mockRepository.save).toHaveBeenCalledWith(job);
    });

    it('throws if jobid is missing from S3 metadata', async () => {
        s3Mock.on(HeadObjectCommand).resolves({
            Metadata: {},
        });

        const mockRepository = { save: jest.fn() };
        const useCase = new JobInitializationUseCase(mockRepository, new S3Utils());

        await expect(useCase.execute(objectDetails))
            .rejects.toThrow('jobid not found in object metadata');

        expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('throws if metadata is not present on the S3 object', async () => {
        s3Mock.on(HeadObjectCommand).resolves({});

        const mockRepository = { save: jest.fn() };
        const useCase = new JobInitializationUseCase(mockRepository, new S3Utils());

        await expect(useCase.execute(objectDetails))
            .rejects.toThrow('jobid not found in object metadata');

        expect(mockRepository.save).not.toHaveBeenCalled();
    });
});

