import { Job } from '../models/Job.js';
import { CSVRowDTO } from '../dtos/RowDTOs.js';

export class JobInitializationUseCase {

    /**
     * @param {import('../repositories/JobRepository.js').JobRepository} jobRepository
     * @param {import('../utils/S3Utils.js').S3Utils} s3Utils
     */
    constructor(jobRepository, s3Utils, sqsUtils) {
        this.jobRepository = jobRepository;
        this.s3Utils = s3Utils;
        this.sqsUtils = sqsUtils;
    }

    /**
     * Creates and persists a new Job from an S3 object event
     * @param {{ bucket: { name: string }, object: { key: string } }} objectDetails
     * @returns {Promise<Job>}
     */
    async execute(objectDetails, queueUrl) {
        const metadata = await this.s3Utils.getObjectMetadata(objectDetails);
        const jobId = metadata?.jobid;

        if (!jobId) throw new Error('jobid not found in object metadata');

        const job = new Job({
            id: jobId,
            sourceFilePath: `s3://${objectDetails.bucket.name}/${objectDetails.object.key}`,
        });

        let rowNumber = 0;

        for await (const data of this.#streamRows(objectDetails)) {
            rowNumber++;
            const message = {
                jobId: job.id,
                key: `${job.id}#${rowNumber}`,
                payloadType: 'csv-row',
                payload: { rowNumber, data: new CSVRowDTO(data.country, data.sales) },
            };

            await this.sqsUtils.pushMessage(queueUrl, message, 30);
        }

        job.setTotalRows(rowNumber);
        await this.jobRepository.save(job);

        return job;
    }

    async *#streamRows(objectDetails) {
        let headers = null;

        for await (const line of this.s3Utils.streamObject(objectDetails.bucket.name, objectDetails.object.key)) {
            if (!line.trim()) continue;

            if (!headers) {
                headers = line.split(',').map(h => h.trim());
                continue;
            }

            const values = line.split(',').map(v => v.trim());
            yield Object.fromEntries(headers.map((h, i) => [h, values[i]]));
        }
    }
}
