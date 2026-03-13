import {CsvFileFactory} from "./CsvFileFactory.js";

export class FileProcessingStrategy {
    getFactory(contentType) {
        if (contentType === 'text/csv') {
            return new CsvFileFactory();
        }

        throw new Error(`Unsupported file type: ${fileType}`);
    }
}
