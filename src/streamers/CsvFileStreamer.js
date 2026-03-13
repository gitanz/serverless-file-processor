import {Streamer} from "./Streamer.js";

export class CsvFileStreamer extends Streamer {
    constructor(s3Utils) {
        super(s3Utils);
    }

    async *streamRows(objectDetails) {
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