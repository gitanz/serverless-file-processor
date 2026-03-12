# Please follow overview and instructions in this markdown document

## Overview
This is a AWS native serverless system that aggregates content in a file and stores it in DynamoDB 

### User Story
- User will upload file to the api endpoint.
- User will synchronously receive a JobID.
- User can see the file processing status through an api /jobs/{jobid}

### Implementation

#### Infrastructure
This would be implemented with AWS Native Serverless Infrastructure
1. A S3 bucket to store the file to be processed
2. A single DynamoDB table with overloadable PrimaryKey, ie PartitionKey(PK) + SortKey(SK)
3. An APIGateway that triggers Lambda to upload file to S3.
4. An EventBridge rule, that listens to object-created event in S3 bucket
5. A Lambda function, named Mapper, that is triggered by the EventBridge rule.
6. A SQS queue, that holds each line from uploaded file as a message payload. The format of message would be {jobid: string, key: string, payloadType: csv-row|jsonline|line, payload:
   {rowNumber: int, data: object}}. The key is an idempotency key of format "{JobId}#{rowNumber}"
7. A Lambda function, named Reducer, that processes the message payload from the queue.
8. A deadletter queue, that holds failed rows after 3 retries, with exponential backoff


##### Front-end Client
- Users are going to use the system with an Angular single page app
- This will be have two sections
- First section, form with file selector and a upload button
- File selector is a input type = "file"
- Upload button is a submit handler. Upon upload action, client will request "Uploader" end-point in APIGateway and receive pre-signed url
- It will then do a PUT request to the received PUT url.
- Second section, is a table of jobs
- The table will have JobID, TotalRows, TotalCompleted, Status, CreatedAt, Updated At columns, along with a Get Details button
- GetDetails will show Results of file-processing.

##### Users file upload to S3
- An APIGateway will open a GET Endpoint that triggers a Lambda Handler, "Uploader"
- Uploader will generate a JobID (UUID)
- Uploader will create a Presigned S3 URL, validity of 10 minutes, attached userdefined Metadata of jobid 
- API will return JobID and pre-signed S3 URL, {jobid: JobID, url: PresignedS3URL}
- Client will upload to URL.

##### Handle File upload event to S3: Mapper Lambda
- A job reference will be created in DynamoDB with PK = "Jobs", SK = JobID (from file metadata), SourceFilePath = (s3 reference) and JobStatus = PENDING
- An AWS Event Rule will look for Object Created event in S3 bucket
- The Event Rule will trigger a "Mapper" Lambda function that picks up the job.  
- Mapper will stream contents of file and put each row in a SQS queue. Let it be delayed by 30 seconds.
- Mapper will update the job reference in DynamoDB with TotalRows as count of total rows to be processed
- Mapper will initialize a record in the DynamoDB table, different partition, PK = "Results", SK = JobID, TotalSales = 0, AverageSales = 0
- Mapper will update Job status to 'IN_PROGRESS'

##### Process rows in SQS: Reducer Lambda
- A dedicated lambda function 'Reducer' will be responsible to process a row from SQS
- Reducer will get rows in batches from SQS
- For each row in batch, reducer will create a IdempotencyKey by JobID and RowNumber
- Reducer attempt to cache the IdempotencyKey in DynamoDB, separate partition, PK = "Idempotency", SK = IdempotencyKey
- Reducer will return early, if IdempotencyKey fails i.e the key already exist, we don't want to process again
- Reducer will reduce the result with initial value taken from current value on the results row
- This read of current value from DynamoDB would be a strongly consistent read, and write will be atomic-write
- Success will up the Job's TotalCompleted field, JobStatus to COMPLETED if TotalRows = TotalCompleted
- If reducer fails, remove idempotency key


### Low level details
#### Domain Models
##### Job
- My job will have ID(UUID), SourceFilePath and JobStatus = PENDING | IN_PROGRESS | COMPLETED | FAILED. JobStatus will have default value of PENDING, others must be provided  