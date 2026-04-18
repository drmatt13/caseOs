import {
  pollReplayQueue,
  deleteReplayMessage,
  type ReplayEnvelope,
} from "@repo/event-replay";
import type { Context } from "aws-lambda";

// Asynchronous Lambda Functions
import { lambdaHandler as cognitoPostConfirmationTrigger } from "../../cdk-app/lambda_functions/cognito-post-confirmation-trigger";
// Add more imports here as you add more async Lambda functions, e.g.:
// import { lambdaHandler as anotherAsyncLambdaHandler } from "../../cdk-app/lambda_functions/another-async-lambda/index";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReplayHandler = (event: any, context: Context) => Promise<any>;

// Registry: map deployed Lambda function names to local handlers.
// Use a partial match — the key just needs to appear somewhere in envelope.lambdaName.
const handlerRegistry: Record<string, ReplayHandler> = {
  CognitoPostConfirmationTrigger: cognitoPostConfirmationTrigger,
  // Add more handlers here as needed, e.g.:
  // AnotherAsyncLambda: anotherAsyncLambdaHandler,
};

function findHandler(
  lambdaName: string | undefined,
): ReplayHandler | undefined {
  if (!lambdaName) return undefined;
  for (const [key, handler] of Object.entries(handlerRegistry)) {
    if (lambdaName.includes(key)) return handler;
  }
  return undefined;
}

function mockContext(envelope: ReplayEnvelope): Context {
  return {
    awsRequestId: envelope.awsRequestId ?? "local-replay",
    functionName: envelope.lambdaName ?? "unknown",
    callbackWaitsForEmptyEventLoop: false,
    functionVersion: "$LATEST",
    invokedFunctionArn: "arn:aws:lambda:local:000000000000:function:local",
    logGroupName: "/aws/lambda/local",
    logStreamName: "local",
    memoryLimitInMB: "128",
    getRemainingTimeInMillis: () => 30_000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  };
}

export default async function invokeAsyncLambdaFunctions(): Promise<void> {
  const queueUrl = process.env.DEV_LAMBDA_REPLAY_QUEUE_URL;
  const bucketName = process.env.DEV_LAMBDA_REPLAY_BUCKET_NAME;

  if (!queueUrl || !bucketName) return;

  try {
    const results = await pollReplayQueue(queueUrl, bucketName);

    for (const { envelope, receiptHandle } of results) {
      const handler = findHandler(envelope.lambdaName);

      if (handler) {
        console.log(
          `[replay] Invoking handler for ${envelope.lambdaName} (event: ${envelope.eventType})`,
        );
        try {
          await handler(envelope.originalEvent, mockContext(envelope));
        } catch (err) {
          console.error(
            `[replay] Handler error for ${envelope.lambdaName}:`,
            err,
          );
        }
      } else {
        console.warn(
          `[replay] No handler registered for lambdaName="${envelope.lambdaName}"`,
        );
      }

      await deleteReplayMessage(queueUrl, receiptHandle);
    }
  } catch (err) {
    console.error("[replay] Polling error:", err);
  }
}
