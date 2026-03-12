import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { CsvResultRepository } from './CsvResultRepository.js';
import { CsvResult } from '../models/CsvResult.js';

export class DynamoDBCsvResultRepository extends CsvResultRepository {

    /**
     * @param {DynamoDBDocumentClient} docClient
     * @param {string} tableName
     */
    constructor(docClient, tableName) {
        super(docClient);
        this.tableName = tableName;
    }

    /**
     * @param {CsvResult} csvResult
     * @returns {Promise<void>}
     */
    async save(csvResult) {
        await this.docClient.send(new PutCommand({
            TableName: this.tableName,
            Item: csvResult.toItem(),
        }));
    }

    /**
     * @param {string} jobId
     * @returns {Promise<CsvResult|null>}
     */
    async retrieve(jobId) {
        const response = await this.docClient.send(new GetCommand({
            TableName: this.tableName,
            Key: {
                PK: 'Results',
                SK: jobId,
            },
            ConsistentRead: true,
        }));

        if (!response.Item) {
            return null;
        }

        return CsvResult.fromItem(response.Item);
    }
}

