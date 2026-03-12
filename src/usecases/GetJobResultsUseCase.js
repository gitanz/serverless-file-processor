export class GetJobResultsUseCase {

    /**
     * @param {import('../repositories/CsvResultRepository.js').CsvResultRepository} csvResultRepository
     */
    constructor(csvResultRepository) {
        this.csvResultRepository = csvResultRepository;
    }

    /**
     * @param {string} jobId
     * @returns {Promise<import('../models/CsvResult.js').CsvResult|null>}
     */
    async execute(jobId) {
        return this.csvResultRepository.retrieve(jobId);
    }
}

