import { randomUUID } from 'crypto';

export class GenerateUploadUrlUseCase {

    /**
     * @param {import('../utils/S3Utils.js').S3Utils} s3Utils
     */
    constructor(s3Utils) {
        this.s3Utils = s3Utils;
    }

    /**
     * @returns {Promise<{ jobId: string, url: string }>}
     */
    async execute(correlationId) {
        console.log(`CorId#${correlationId}: Generating upload URL`);

        const jobId = randomUUID();
        const url = await this.s3Utils.getJobUploadSignedUrl(jobId, correlationId);
        return { jobId, url };
    }
}

