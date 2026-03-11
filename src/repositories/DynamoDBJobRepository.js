import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { JobRepository } from './JobRepository.js';
import { Job } from '../models/Job.js';

export class DynamoDBJobRepository extends JobRepository {

    /**
     * @param {DynamoDBDocumentClient} docClient
     * @param {string} tableName
     */
    constructor(docClient, tableName) {
        super(docClient);
        this.tableName = tableName;
    }

    /**
     * @param {Job} job
     * @returns {Promise<void>}
     */
    async save(job) {
        await this.docClient.send(new PutCommand({
            TableName: this.tableName,
            Item: job.toItem(),
        }));
    }

    /**
     * @param {string} jobId
     * @returns {Promise<Job>}
     */
    async retrieve(jobId) {
        const response = await this.docClient.send(new GetCommand({
            TableName: this.tableName,
            Key: {
                PK: 'Jobs',
                SK: jobId,
            },
            ConsistentRead: true,
        }));

        if (!response.Item) {
            return null;
        }

        return Job.fromItem(response.Item);
    }
}

