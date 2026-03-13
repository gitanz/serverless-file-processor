This is an example of a AWS cloud-native serverless application, that aggregates information from a file uploaded.
The architecture is as follows:
1. A file is uploaded to an S3 bucket.
   - User uploads a file thorugh a simple client application (angular frontend).
   - Client GETs a pre-signed URL from API Gateway, and uploads the file to S3 directly. 
2. "Object created" S3 event triggers file processing.
   - Two Lambda functions work in map-reduce style to process the file and aggregate the information.
   - Mapping Lambda function, streams the file, line by line, puts each line object in SQS Queue, keeping a delay of 30 seconds. It then initializes a results row in DynamoDB. 
     - The delay is to make sure that the mapping Lambda function finishes
       - putting all the messages in the SQS queue and 
       - put a initial results row in dynamoDB
     - before reducing lambda function starts processing it.
   - Reducing Lambda function reads messages from the SQS queue, accumulate on the results row in DynamoDB.

A simple client application (angular frontend) is provided to upload the file, see job status and results. 

To run the application,
1. Clone the repository and navigate to the project directory.
`git clone https://github.com/gitanz/serverless-file-processor.git`
2. Navigate into repository.
3. Deploy serverless application using SAM CLI
`sam build`
`sam deploy --no-confirm-changeset --stack-name serverless-file-processor`
4. After deployment, you will get the API Gateway endpoint URL in the output. 
5. Go to the client application directory and update the API Gateway endpoint URL in the environment.ts file.
6. Install client application dependencies and run the application.
`cd client`
`npm install`
`npm run start`

Things to note:
- The API Gateway and S3 bucket are configured to allow cross-origin requests from the client application running on http://localhost:4200.
- Please run the client application on http://localhost:4200 to avoid CORS issues.
