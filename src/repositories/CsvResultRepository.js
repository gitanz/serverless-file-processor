export class CsvResultRepository {

    /**
     * @param {import('@aws-sdk/lib-dynamodb').DynamoDBDocumentClient} docClient
     */
    constructor(docClient) {
        this.docClient = docClient;
    }

    /**
     * @param {import('../models/CsvResult.js').CsvResult} csvResult
     * @returns {Promise<void>}
     */
    async save(csvResult) {
        throw new Error('save() not implemented');
    }

    /**
     * @param {string} jobId
     * @returns {Promise<import('../models/CsvResult.js').CsvResult>}
     */
    async retrieve(jobId) {
        throw new Error('retrieve() not implemented');
    }
}

