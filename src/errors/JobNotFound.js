export class JobNotFound extends Error {
    constructor(jobId) {
        super(`Job not found: ${jobId}`);
        this.name = 'JobNotFound';
    }
}

