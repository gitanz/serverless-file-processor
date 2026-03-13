export class IdempotencyRepository {

    /**
     * @param {import('@aws-sdk/lib-dynamodb').DynamoDBDocumentClient} docClient
     */
    constructor(docClient) {
        this.docClient = docClient;
    }

    /**
     * Saves idempotency key using a conditional write.
     * Returns true if saved successfully, false if key already exists.
     * @param {import('../models/Idempotency.js').Idempotency} idempotency
     * @returns {Promise<boolean>}
     */
    async save(idempotency) {
        throw new Error('save() not implemented');
    }

    async delete(key) {
        throw new Error('delete() not implemented');
    }
}

