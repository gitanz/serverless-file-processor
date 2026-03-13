import { Idempotency } from '../models/Idempotency.js';
import { JobStatus } from '../models/Job.js';

export class ReduceJobUseCase {

    /**
     * @param {import('../repositories/JobRepository.js').JobRepository} jobRepository
     * @param fileProcessingStrategy
     * @param {import('../repositories/IdempotencyRepository.js').IdempotencyRepository} idempotencyRepository
     */
    constructor(jobRepository, fileProcessingStrategy, idempotencyRepository) {
        this.jobRepository = jobRepository;
        this.fileProcessingStrategy = fileProcessingStrategy;
        this.idempotencyRepository = idempotencyRepository;
    }

    /**
     * @param {object} message - { jobId, key, payloadType, payload: { rowNumber, data } }
     * @returns {Promise<void>}
     */
    async execute(message) {
        const { jobId, key, payloadType:contentType } = message;

        const resultRepository = this.fileProcessingStrategy.getFactory(contentType);
        const saved = await this.idempotencyRepository.save(new Idempotency({ key }));
        if (!saved) {
            console.log(`Duplicate message, skipping key=${key}`);
            return;
        }

        try {
            const { data } = message.payload;
            await resultRepository.reduce(jobId, data);

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
