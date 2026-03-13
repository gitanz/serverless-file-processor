import {Job, JobStatus} from '../models/Job.js';
import { CsvResult } from '../models/CsvResult.js';
import { CSVRowDTO } from '../dtos/RowDTOs.js';

const SUPPORTED_CONTENT_TYPES = ['text/csv', 'application/jsonl', 'text/plain'];
const MAX_CONTENT_LENGTH_MB = 10;
export class MapJobUseCase {

    constructor(jobRepository, csvResultRepository, s3Utils, sqsUtils) {
        this.jobRepository = jobRepository;
        this.csvResultRepository = csvResultRepository;
        this.s3Utils = s3Utils;
        this.sqsUtils = sqsUtils;
    }

    /**
     * Creates and persists a new Job from an S3 object event
     * @param {{ bucket: { name: string }, object: { key: string } }} objectDetails
     * @returns {Promise<Job>}
     */
    async execute(objectDetails, queueUrl) {
        const objectHeaders = await this.s3Utils.getObjectHeaders(objectDetails);
        const metadata = objectHeaders.Metadata;
        const jobId = metadata?.jobid;

        if (!jobId) {
            throw new Error('jobid not found in object metadata');
        }

        const job = new Job({
            id: jobId,
            sourceFilePath: `s3://${objectDetails.bucket.name}/${objectDetails.object.key}`,
        });

        const contentType = objectHeaders.ContentType;
        if (!SUPPORTED_CONTENT_TYPES.includes(contentType)) {
            job.setError(`Unsupported content type: ${contentType}`);
            job.setStatus(JobStatus.FAILED);
            this.jobRepository.save(job);
            throw new Error(`Unsupported content type: ${contentType}.`);
        }

        const contentLengthMB = objectHeaders.ContentLength / 1024 / 1024;
        if (contentLengthMB > MAX_CONTENT_LENGTH_MB) {
            job.setError(`Exceeds max file size: ${contentLengthMB.toFixed(2)}MB`);
            job.setStatus(JobStatus.FAILED);
            this.jobRepository.save(job);
            throw new Error(`Exceeds max file size`);
        }

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
        const csvResult = new CsvResult({ jobId: job.id });

        await Promise.all([
            this.jobRepository.save(job),
            this.csvResultRepository.save(csvResult),
        ]);

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


