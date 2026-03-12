import { BaseModel } from './BaseModel.js';

export class Idempotency extends BaseModel {

    /**
     * @param {string} key - format: {jobId}#{rowNumber}
     */
    constructor({ key }) {
        if (!key) throw new Error('Idempotency key is required');

        super();
        this.key = key;
        this.createdAt = new Date().toISOString();
    }

    toItem() {
        return {
            PK: 'Idempotency',
            SK: this.key,
            CreatedAt: this.createdAt,
        };
    }

    static fromItem(item) {
        return new Idempotency({ key: item.SK });
    }
}

