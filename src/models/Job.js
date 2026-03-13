import { BaseModel } from './BaseModel.js';

export const JobStatus = Object.freeze({
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
});

export class Job extends BaseModel {
    constructor({
                    id,
                    sourceFilePath,
                    status = JobStatus.PENDING,
                    totalRows = 0,
                    totalCompleted = 0,
                    totalInvalid = 0,
                    error = null,
                    contentType = null,
                    createdAt = new Date().toISOString(),
                    updatedAt = new Date().toISOString()
                }) {

        if (!id) throw new Error('Job id is required');
        if (!sourceFilePath) throw new Error('Job sourceFilePath is required');

        super();
        this.id = id;
        this.sourceFilePath = sourceFilePath;
        this.status = status;
        this.totalRows = totalRows;
        this.totalCompleted = totalCompleted;
        this.totalInvalid = totalInvalid;
        this.error = error;
        this.contentType = contentType;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    setTotalRows(totalRows) {
        this.totalRows = totalRows;
        this.updatedAt = new Date().toISOString();
    }

    setTotalCompleted(totalCompleted) {
        this.totalCompleted = totalCompleted;
        this.updatedAt = new Date().toISOString();
    }

    setTotalInvalid(totalInvalid) {
        this.totalInvalid = totalInvalid;
        this.updatedAt = new Date().toISOString();
    }

    setStatus(status) {
        this.status = status;
        this.updatedAt = new Date().toISOString();
    }

    setError(error) {
        this.error = error;
        this.updatedAt = new Date().toISOString();
    }

    setContentType(contentType) {
        this.contentType = contentType;
        this.updatedAt = new Date().toISOString();
    }

    toItem() {
        return {
            PK: 'Jobs',
            SK: this.id,
            SourceFilePath: this.sourceFilePath,
            JobStatus: this.status,
            TotalRows: this.totalRows,
            TotalCompleted: this.totalCompleted,
            TotalInvalid: this.totalInvalid,
            Error: this.error,
            ContentType: this.contentType,
            CreatedAt: this.createdAt,
            UpdatedAt: this.updatedAt,
        };
    }

    static fromItem(item) {
        return new Job({
            id: item.SK,
            sourceFilePath: item.SourceFilePath,
            status: item.JobStatus,
            totalRows: item.TotalRows,
            totalInvalid: item.TotalInvalid,
            totalCompleted: item.TotalCompleted,
            error: item.Error ?? null,
            contentType: item.ContentType ?? null,
            createdAt: item.CreatedAt,
            updatedAt: item.UpdatedAt,
        });
    }
}
