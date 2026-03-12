export class GetJobsUseCase {

    /**
     * @param {import('../repositories/JobRepository.js').JobRepository} jobRepository
     */
    constructor(jobRepository) {
        this.jobRepository = jobRepository;
    }

    /**
     * @returns {Promise<import('../models/Job.js').Job[]>}
     */
    async execute() {
        return this.jobRepository.list();
    }
}

