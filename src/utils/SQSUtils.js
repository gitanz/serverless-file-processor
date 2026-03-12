import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

export class SQSUtils {

    constructor() {
        this.sqsClient = new SQSClient();
    }

    /**
     * Pushes a message to SQS queue
     * @param {string} queueUrl
     * @param {object} message
     * @param {number} delaySeconds
     * @returns {Promise<void>}
     */
    async pushMessage(queueUrl, message, delaySeconds = 0) {
        await this.sqsClient.send(new SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify(message),
            DelaySeconds: delaySeconds,
        }));
    }
}

