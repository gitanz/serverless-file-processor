import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
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

    /**
     * Atomically adds sales to TotalSales
     * @param {string} jobId
     * @param {number} sales
     */
    async reduce(jobId, data) {
        const response = await this.docClient.send(new UpdateCommand({
            TableName: this.tableName,
            Key: { PK: 'Results', SK: jobId },
            UpdateExpression: 'ADD TotalSales :sales, ProcessedCount :one SET UpdatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':sales': Number(data.sales),
                ':one': 1,
                ':updatedAt': new Date().toISOString(),
            },
            ReturnValues: 'ALL_NEW',
        }));

        const { TotalSales, ProcessedCount } = response.Attributes;

        await this.docClient.send(new UpdateCommand({
            TableName: this.tableName,
            Key: { PK: 'Results', SK: jobId },
            UpdateExpression: 'SET AverageSales = :averageSales',
            ExpressionAttributeValues: {
                ':averageSales': TotalSales / ProcessedCount,
            },
        }));
    }
}

