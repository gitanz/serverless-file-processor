import {Job, JobStatus} from '../models/Job.js';
import { CsvResult } from '../models/CsvResult.js';
import { CSVRowDTO } from '../dtos/CsvRowDTO.js';
import {JobNotFound} from "../errors/JobNotFound.js";
import {FileValidationError} from "../errors/FileValidationError.js";

const SUPPORTED_CONTENT_TYPES = ['text/csv', 'application/jsonl', 'text/plain'];
const MAX_CONTENT_LENGTH_MB = 10;
export class MapJobUseCase {

    constructor(jobRepository, fileProcessingStrategy, s3Utils, sqsUtils) {
        this.jobRepository = jobRepository;
        this.fileProcessingStrategy = fileProcessingStrategy;
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
        const corId = metadata?.corid;
        const jobId = metadata?.jobid;

        console.log(`CorId#${corId}: Received S3 event for bucket=${objectDetails.bucket.name}, key=${objectDetails.object.key}`);

        if (!jobId) {
            throw new JobNotFound(jobId);
        }

        const job = new Job({
            id: jobId,
            sourceFilePath: `s3://${objectDetails.bucket.name}/${objectDetails.object.key}`,
            contentType: objectHeaders.ContentType,
        });

        const contentType = objectHeaders.ContentType;
        if (!SUPPORTED_CONTENT_TYPES.includes(contentType)) {
            job.setError(`Unsupported content type: ${contentType}`);
            job.setStatus(JobStatus.FAILED);
            this.jobRepository.save(job);
            throw new FileValidationError(`Unsupported content type: ${contentType}.`, corId);
        }

        const contentLengthMB = objectHeaders.ContentLength / 1024 / 1024;
        if (contentLengthMB > MAX_CONTENT_LENGTH_MB) {
            job.setError(`Exceeds max file size: ${contentLengthMB.toFixed(2)}MB`);
            job.setStatus(JobStatus.FAILED);
            this.jobRepository.save(job);
            throw new FileValidationError(`Exceeds max file size`, corId);
        }

        const fileTypeFactory = this.fileProcessingStrategy.getFactory(contentType);

        let rowNumber = 0;
        let countInvalidRows = 0;
        for await (const data of fileTypeFactory.getStreamer(objectDetails).streamRows(objectDetails)) {
            rowNumber++;

            if (!fileTypeFactory.validate(data)) {
                countInvalidRows++;
                console.warn(`CorId#${corId}: Invalid row ${rowNumber} - ${JSON.stringify(data)}`);
                continue;
            }

            const message = {
                corId: corId,
                jobId: job.id,
                key: `${job.id}#${rowNumber}`,
                payloadType: contentType,
                payload: { rowNumber, data: fileTypeFactory.createDto(data) },
            };

            await this.sqsUtils.pushMessage(queueUrl, message, 30);
        }

        job.setTotalRows(rowNumber);
        job.setTotalInvalid(countInvalidRows);

        const result =  fileTypeFactory.createResult(job)

        await Promise.all([
            this.jobRepository.save(job),
            fileTypeFactory.getResultRepository().save(result),
        ]);

        return job;
    }
}


