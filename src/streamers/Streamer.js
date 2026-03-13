export class Streamer {
    s3Utils;
    constructor(s3Utils) {
        this.s3Utils = s3Utils;
    }
    async *streamRows(objectDetails)  {
        throw new Error('#streamRows() not implemented');
    }
}