export class JobRepository {

    /**
     * @param {import('@aws-sdk/lib-dynamodb').DynamoDBDocumentClient} docClient
     */
    constructor(docClient) {
        this.docClient = docClient;
    }

    /**
     * @param {Job} job
     * @returns {Promise<void>}
     */
    async save(job) {
        throw new Error('save() not implemented');
    }

    /**
     * Retrieves a Job from DynamoDB by JobID
     * @param {string} jobId
     * @returns {Promise<Job>}
     */
    async retrieve(jobId) {
        throw new Error('retrieve() not implemented');
    }

    /**
     * Atomically increments TotalCompleted and returns the updated value
     * @param {string} jobId
     * @returns {Promise<number>} updated TotalCompleted
     */
    async incrementTotalCompleted(jobId) {
        throw new Error('incrementTotalCompleted() not implemented');
    }
}

