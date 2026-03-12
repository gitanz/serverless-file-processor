import { BaseModel } from './BaseModel.js';

export class CsvResult extends BaseModel {

    constructor({ jobId, totalSales = 0, averageSales = 0, createdAt = new Date().toISOString(), updatedAt = new Date().toISOString() }) {
        if (!jobId) throw new Error('CsvResult jobId is required');

        super();
        this.jobId = jobId;
        this.totalSales = totalSales;
        this.averageSales = averageSales;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    toItem() {
        return {
            PK: 'Results',
            SK: this.jobId,
            TotalSales: this.totalSales,
            AverageSales: this.averageSales,
            CreatedAt: this.createdAt,
            UpdatedAt: this.updatedAt,
        };
    }

    static fromItem(item) {
        return new CsvResult({
            jobId: item.SK,
            totalSales: item.TotalSales,
            averageSales: item.AverageSales,
            createdAt: item.CreatedAt,
            updatedAt: item.UpdatedAt,
        });
    }
}
