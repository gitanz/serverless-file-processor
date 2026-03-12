import { Idempotency } from '../models/Idempotency.js';
import { JobStatus } from '../models/Job.js';

export class ReduceJobUseCase {

    /**
     * @param {import('../repositories/JobRepository.js').JobRepository} jobRepository
     * @param {import('../repositories/CsvResultRepository.js').CsvResultRepository} csvResultRepository
     * @param {import('../repositories/IdempotencyRepository.js').IdempotencyRepository} idempotencyRepository
     */
    constructor(jobRepository, csvResultRepository, idempotencyRepository) {
        this.jobRepository = jobRepository;
        this.csvResultRepository = csvResultRepository;
        this.idempotencyRepository = idempotencyRepository;
    }

    /**
     * @param {object} message - { jobId, key, payloadType, payload: { rowNumber, data } }
     * @returns {Promise<void>}
     */
    async execute(message) {
        const { key, jobId } = message;

        const saved = await this.idempotencyRepository.save(new Idempotency({ key }));
        if (!saved) {
            console.log(`Duplicate message, skipping key=${key}`);
            return;
        }

        try {
            const { data } = message.payload;
            await this.csvResultRepository.reduce(jobId, data);

            const totalCompleted = await this.jobRepository.incrementTotalCompleted(jobId);
            const job = await this.jobRepository.retrieve(jobId);

            if (totalCompleted === job.totalRows) {
                job.setStatus(JobStatus.COMPLETED);
                await this.jobRepository.save(job);
            }

        } catch (err) {
            await this.idempotencyRepository.delete(key);
            throw err;
        }
    }
}
