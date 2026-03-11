import { Job } from '../models/Job.js';

export class JobInitializationUseCase {

    /**
     * @param {import('../repositories/JobRepository.js').JobRepository} jobRepository
     * @param {import('../utils/S3Utils.js').S3Utils} s3Utils
     */
    constructor(jobRepository, s3Utils) {
        this.jobRepository = jobRepository;
        this.s3Utils = s3Utils;
    }

    /**
     * Creates and persists a new Job from an S3 object event
     * @param {{ bucket: { name: string }, object: { key: string } }} objectDetails
     * @returns {Promise<Job>}
     */
    async execute(objectDetails) {
        const metadata = await this.s3Utils.getObjectMetadata(objectDetails);
        const jobId = metadata?.jobid;

        if (!jobId) throw new Error('jobid not found in object metadata');

        const job = new Job({
            id: jobId,
            sourceFilePath: `s3://${objectDetails.bucket.name}/${objectDetails.object.key}`,
        });

        await this.jobRepository.save(job);

        return job;
    }
}
