import {CSVRowDTO} from "../dtos/CsvRowDTO.js";
import {DynamoDBDocumentClient} from "@aws-sdk/lib-dynamodb";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBCsvResultRepository} from "../repositories/DynamoDBCsvResultRepository.js";
import {S3Utils} from "../utils/S3Utils.js";
import {CsvFileStreamer} from "../streamers/CsvFileStreamer.js";
import {CsvResult} from "../models/CsvResult.js";
import {FileTypeFactory} from "./FileTypeFactory.js";

const s3Utils = new S3Utils();
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient());

const csvResultRepository = new DynamoDBCsvResultRepository(docClient, process.env.TABLE_NAME);
const csvStreamer = new CsvFileStreamer(s3Utils);
export class CsvFileFactory extends FileTypeFactory {
    createDto(data) {
        return new CSVRowDTO(data.country, data.sales);
    }

    getStreamer() {
        return csvStreamer;
    }

    createResult(job) {
        return new CsvResult({ jobId: job.id });
    }

    getResultRepository() {
        return csvResultRepository;
    }
}
