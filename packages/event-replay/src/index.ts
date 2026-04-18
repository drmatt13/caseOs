import {
  Context,
  DynamoDBStreamEvent,
  EventBridgeEvent,
  PostConfirmationTriggerEvent,
  S3Event,
  SQSEvent,
} from "aws-lambda";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
// import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

const s3 = new S3Client({});
// const sqs = new SQSClient({});

type CaptureEligibleEvent =
  | PostConfirmationTriggerEvent
  | DynamoDBStreamEvent
  | SQSEvent
  | S3Event
  | EventBridgeEvent<string, unknown>;

type ReplayEnvelope = {
  id: string;
  capturedAt: string;
  eventType: string;
  sourceHint: string;
  lambdaName?: string;
  awsRequestId?: string;
  originalEvent: CaptureEligibleEvent;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function detectEventType(event: CaptureEligibleEvent): string {
  if ("triggerSource" in event) {
    return "PostConfirmationTriggerEvent";
  }

  if (
    "Records" in event &&
    Array.isArray(event.Records) &&
    event.Records.length > 0
  ) {
    const firstRecord = event.Records[0];
    const source = firstRecord?.eventSource ?? "records";

    if (source === "aws:dynamodb") return "DynamoDBStreamEvent";
    if (source === "aws:sqs") return "SQSEvent";
    if (source === "aws:s3") return "S3Event";
  }

  if ("source" in event && "detail-type" in event) {
    return "EventBridgeEvent";
  }

  return "UnknownEvent";
}

function detectSourceHint(event: CaptureEligibleEvent): string {
  if ("triggerSource" in event) {
    return `cognito:${event.triggerSource}`;
  }

  if (
    "Records" in event &&
    Array.isArray(event.Records) &&
    event.Records.length > 0
  ) {
    return event.Records[0]?.eventSource ?? "records";
  }

  if ("source" in event && typeof event.source === "string") {
    return event.source;
  }

  return "unknown";
}

export async function captureEventDrivenInvocation(
  event: CaptureEligibleEvent,
  context: Context,
): Promise<void> {
  const bucketName = getRequiredEnv("DEV_LAMBDA_REPLAY_BUCKET_NAME");

  // const shouldSendCustomSqsMessage =
  //   process.env.DEV_LAMBDA_REPLAY_SEND_CUSTOM_SQS_MESSAGE === "true";

  // const queueUrl = shouldSendCustomSqsMessage
  //   ? getRequiredEnv("DEV_LAMBDA_REPLAY_QUEUE_URL")
  //   : undefined;

  const capturedAt = new Date().toISOString();
  const eventType = detectEventType(event);
  const sourceHint = detectSourceHint(event);

  const key = [
    "replay",
    eventType,
    capturedAt.slice(0, 10),
    `${context.awsRequestId}.json`,
  ].join("/");

  const envelope: ReplayEnvelope = {
    id: context.awsRequestId,
    capturedAt,
    eventType,
    sourceHint,
    lambdaName: context.functionName,
    awsRequestId: context.awsRequestId,
    originalEvent: event,
  };

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(envelope, null, 2),
      ContentType: "application/json",
    }),
  );

  // Optional:
  // Only use this if you explicitly want a custom SQS payload
  // instead of relying on S3 -> SQS event notifications.
  // if (shouldSendCustomSqsMessage && queueUrl) {
  //   await sqs.send(
  //     new SendMessageCommand({
  //       QueueUrl: queueUrl,
  //       MessageBody: JSON.stringify({
  //         bucket: bucketName,
  //         key,
  //         eventType,
  //         sourceHint,
  //         capturedAt,
  //         awsRequestId: context.awsRequestId,
  //         lambdaName: context.functionName,
  //       }),
  //     }),
  //   );
  // }
}
