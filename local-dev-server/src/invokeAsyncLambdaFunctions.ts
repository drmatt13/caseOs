import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
  type Message,
} from "@aws-sdk/client-sqs";

// Asynchronous Lambda Functions
import { lambdaHandler as cognitoPostConfirmationTrigger } from "../../cdk-app/lambda_functions/cognito-post-confirmation-trigger";

type S3EventRecord = {
  eventSource: string;
  eventName: string;
  s3?: {
    bucket?: { name?: string };
    object?: { key?: string };
  };
};

type S3EventMessageBody = {
  Records?: S3EventRecord[];
};

const region = process.env.AWS_REGION ?? "us-east-1";
const queueUrl = process.env.DEV_LAMBDA_REPLAY_QUEUE_URL ?? "";

const sqsClient = new SQSClient({
  region,
});

export default function invokeAsyncLambdaFunctions() {}
