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

    setStatus(status) {
        this.status = status;
        this.updatedAt = new Date().toISOString();
    }

    // DynamoDB representation
    toItem() {
        return {
            PK: 'Jobs',
            SK: this.id,
            SourceFilePath: this.sourceFilePath,
            JobStatus: this.status,
            TotalRows: this.totalRows,
            TotalCompleted: this.totalCompleted,
            CreatedAt: this.createdAt,
            UpdatedAt: this.updatedAt,
        };
    }

    // Hydrate from a DynamoDB item
    static fromItem(item) {
        return new Job({
            id: item.SK,
            sourceFilePath: item.SourceFilePath,
            status: item.JobStatus,
            totalRows: item.TotalRows,
            totalCompleted: item.TotalCompleted,
            createdAt: item.CreatedAt,
            updatedAt: item.UpdatedAt,
        });
    }
}
