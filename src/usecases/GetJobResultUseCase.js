import {JobNotFound} from "../errors/JobNotFound.js";

export class GetJobResultUseCase {

    /**
     * @param jobsRepository
     * @param fileProcessingStrategy
     */
    constructor(jobsRepository, fileProcessingStrategy) {
        this.jobsRepository = jobsRepository;
        this.fileProcessingStrategy = fileProcessingStrategy;
    }

    /**
     * @param {string} jobId
     * @returns {Promise<import('../models/CsvResult.js').CsvResult|null>}
     */
    async execute(jobId) {
        const job = await this.jobsRepository.retrieve(jobId)
        if (!job) {
            throw new JobNotFound(jobId);
        }

        const resultRepository = this.fileProcessingStrategy.getFactory(job.contentType).getResultRepository();

        return resultRepository.retrieve(jobId);
    }
}
