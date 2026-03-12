import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { IdempotencyRepository } from './IdempotencyRepository.js';

export class DynamoDBIdempotencyRepository extends IdempotencyRepository {

    /**
     * @param {import('@aws-sdk/lib-dynamodb').DynamoDBDocumentClient} docClient
     * @param {string} tableName
     */
    constructor(docClient, tableName) {
        super(docClient);
        this.tableName = tableName;
    }

    /**
     * Conditional write — returns true if saved, false if key already exists
     * @param {import('../models/Idempotency.js').Idempotency} idempotency
     * @returns {Promise<boolean>}
     */
    async save(idempotency) {
        try {
            await this.docClient.send(new PutCommand({
                TableName: this.tableName,
                Item: idempotency.toItem(),
                ConditionExpression: 'attribute_not_exists(SK)',
            }));
            return true;
        } catch (err) {
            if (err instanceof ConditionalCheckFailedException) {
                return false;
            }
            throw err;
        }
    }
}

