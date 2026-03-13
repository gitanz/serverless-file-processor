export class FileValidationError extends Error {
    constructor(message = 'File validation failed') {
        super(message);
        this.name = 'FileValidationError';
    }
}

