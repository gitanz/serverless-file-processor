import { jest } from '@jest/globals';
import { ReduceJobUseCase } from './ReduceJobUseCase.js';
import { Job, JobStatus } from '../models/Job.js';

const makeMessage = () => ({
    jobId: 'test-job-id',
    key: 'test-job-id#1',
    payloadType: 'csv-row',
    payload: { rowNumber: 1, data: { country: 'ireland', sales: '1000' } },
});

const makeJob = (totalRows, totalCompleted) => new Job({
    id: 'test-job-id',
    sourceFilePath: 's3://my-test-bucket/test.csv',
    totalRows,
    totalCompleted,
});

describe('ReduceJobUseCase', () => {

    let mockJobRepository;
    let mockCsvResultRepository;
    let mockFileProcessingStrategy;
    let mockIdempotencyRepository;
    let useCase;

    beforeEach(() => {
        mockJobRepository = {
            retrieve: jest.fn(),
            save: jest.fn().mockResolvedValue(),
            incrementTotalCompleted: jest.fn(),
        };
        mockCsvResultRepository = {
            reduce: jest.fn().mockResolvedValue(),
        };
        mockFileProcessingStrategy = {
            getFactory: jest.fn().mockReturnValue({
                getResultRepository: jest.fn().mockReturnValue(mockCsvResultRepository),
            }),
        };
        mockIdempotencyRepository = {
            save: jest.fn(),
            delete: jest.fn().mockResolvedValue(),
        };
        useCase = new ReduceJobUseCase(mockJobRepository, mockFileProcessingStrategy, mockIdempotencyRepository);
    });

    it('skips processing if idempotency key already exists', async () => {
        mockIdempotencyRepository.save.mockResolvedValue(false);

        await useCase.execute(makeMessage());

        expect(mockCsvResultRepository.reduce).not.toHaveBeenCalled();
        expect(mockJobRepository.incrementTotalCompleted).not.toHaveBeenCalled();
    });

    it('reduces result and increments totalCompleted', async () => {
        mockIdempotencyRepository.save.mockResolvedValue(true);
        mockJobRepository.incrementTotalCompleted.mockResolvedValue(1);
        mockJobRepository.retrieve.mockResolvedValue(makeJob(2, 1));

        await useCase.execute(makeMessage());

        expect(mockCsvResultRepository.reduce).toHaveBeenCalledWith('test-job-id', { country: 'ireland', sales: '1000' });
        expect(mockJobRepository.incrementTotalCompleted).toHaveBeenCalledWith('test-job-id');
        expect(mockJobRepository.save).not.toHaveBeenCalled();
    });

    it('marks job as COMPLETED when totalCompleted equals totalRows', async () => {
        mockIdempotencyRepository.save.mockResolvedValue(true);
        mockJobRepository.incrementTotalCompleted.mockResolvedValue(2);
        mockJobRepository.retrieve.mockResolvedValue(makeJob(2, 1));

        await useCase.execute(makeMessage());

        const savedJob = mockJobRepository.save.mock.calls[0][0];
        expect(savedJob.status).toEqual(JobStatus.COMPLETED);
    });

    it('deletes idempotency key and rethrows if an error occurs', async () => {
        mockIdempotencyRepository.save.mockResolvedValue(true);
        mockCsvResultRepository.reduce.mockRejectedValue(new Error('DynamoDB error'));

        await expect(useCase.execute(makeMessage())).rejects.toThrow('DynamoDB error');

        expect(mockIdempotencyRepository.delete).toHaveBeenCalledWith(
            expect.objectContaining({ key: 'test-job-id#1' })
        );
    });
});
