import {
  Context,
  DynamoDBStreamEvent,
  EventBridgeEvent,
  PostConfirmationTriggerEvent,
  S3Event,
  SQSEvent,
} from "aws-lambda";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";

type CaptureEligibleEvent =
  | PostConfirmationTriggerEvent
  | DynamoDBStreamEvent
  | SQSEvent
  | S3Event
  | EventBridgeEvent<string, unknown>;

export type HandlerNames = "CognitoPostConfirmationTrigger";
// Add more handler names here as you add more async Lambda functions, e.g.:
// | "AnotherAsyncLambda"

const s3 = new S3Client({});
const sqs = new SQSClient({});

export type ReplayEnvelope = {
  id: string;
  capturedAt: string;
  eventType: string;
  sourceHint: string;
  handlerName?: HandlerNames;
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
  handlerName: HandlerNames,
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
    handlerName,
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

export type ReplayResult = {
  envelope: ReplayEnvelope;
  receiptHandle: string;
};

export async function pollReplayQueue(
  queueUrl: string,
  bucketName: string,
): Promise<ReplayResult[]> {
  const response = await sqs.send(
    new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 0,
    }),
  );

  if (!response.Messages || response.Messages.length === 0) {
    return [];
  }

  const results: ReplayResult[] = [];

  for (const message of response.Messages) {
    if (!message.Body || !message.ReceiptHandle) continue;

    const s3Event = JSON.parse(message.Body) as S3Event;
    const record = s3Event.Records?.[0];
    if (!record) continue;

    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    const obj = await s3.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      }),
    );

    if (!obj.Body) continue;

    const bodyStr = await obj.Body.transformToString("utf-8");
    const envelope = JSON.parse(bodyStr) as ReplayEnvelope;

    results.push({
      envelope,
      receiptHandle: message.ReceiptHandle,
    });
  }

  return results;
}

export async function deleteReplayMessage(
  queueUrl: string,
  receiptHandle: string,
): Promise<void> {
  await sqs.send(
    new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    }),
  );
}
