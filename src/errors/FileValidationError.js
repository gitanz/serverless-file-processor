export class FileValidationError extends Error {
    constructor(message = 'File validation failed', correlationId) {
        super(message);
        this.name = 'FileValidationError';
        this.correlationId = correlationId;
    }
}

