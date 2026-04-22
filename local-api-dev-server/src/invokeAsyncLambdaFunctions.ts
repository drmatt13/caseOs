import {
  pollReplayQueue,
  deleteReplayMessage,
  type ReplayEnvelope,
  type HandlerNames,
} from "@repo/event-replay";
import type { Context } from "aws-lambda";

// Asynchronous Lambda Functions
import { lambdaHandler as cognitoPostConfirmationTrigger } from "../../cdk-app/lambda_functions/cognito-post-confirmation-trigger";
// Add more imports here as you add more async Lambda functions, e.g.:
// import { lambdaHandler as anotherAsyncLambdaHandler } from "../../cdk-app/lambda_functions/another-async-lambda/index";

type ReplayHandler = (event: any, context: Context) => Promise<any>;

// Registry: map deployed Lambda function names to local handlers.
// Use a partial match — the key just needs to appear somewhere in envelope.lambdaName.
const handlerRegistry: Record<HandlerNames, ReplayHandler> = {
  //                          ^-- Update this type as you add more handlers, e.g.: HandlerNames = "CognitoPostConfirmationTrigger" | "AnotherAsyncLambda"
  CognitoPostConfirmationTrigger: cognitoPostConfirmationTrigger,
  // Add more handlers here as needed, e.g.:
  // AnotherAsyncLambda: anotherAsyncLambdaHandler,
};

function findHandler(envelope: ReplayEnvelope): ReplayHandler | undefined {
  // Prefer direct lookup by stable typed handler name.
  if (envelope.handlerName) {
    const typedHandler = handlerRegistry[envelope.handlerName];
    if (typedHandler) return typedHandler;
  }

  // Fallback for older messages that only contain an arbitrary deployed Lambda name.
  const lambdaName = envelope.lambdaName;
  if (!lambdaName) return undefined;

  for (const [key, handler] of Object.entries(handlerRegistry)) {
    if (lambdaName.includes(key)) return handler;
  }

  return undefined;
}

function getDisplayHandlerName(envelope: ReplayEnvelope): string {
  return envelope.handlerName ?? envelope.lambdaName ?? "unknown";
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

type ErrorLike = {
  name?: string;
  message?: string;
};

function asErrorLike(err: unknown): ErrorLike {
  if (err && typeof err === "object") {
    return err as ErrorLike;
  }

  return {
    message: String(err),
  };
}

function isExpiredAwsLoginSession(err: unknown): boolean {
  const { name, message } = asErrorLike(err);
  const normalizedName = (name ?? "").toLowerCase();
  const normalizedMessage = (message ?? "").toLowerCase();

  return (
    normalizedName.includes("credentialsprovidererror") &&
    (normalizedMessage.includes("session has expired") ||
      normalizedMessage.includes("reauthenticate"))
  );
}

function logReplayPollingError(err: unknown): void {
  const debugEnabled = process.env.DEV_REPLAY_VERBOSE_ERRORS === "true";

  if (isExpiredAwsLoginSession(err)) {
    console.error(
      "❌ [replay] Custom AWS session expired. Run 'aws login --profile dev' and restart local-api-dev-server.",
    );

    if (debugEnabled) {
      console.error("[replay][debug] Original polling error:", err);
    }

    return;
  }

  const { name, message } = asErrorLike(err);
  const errorName = name || "Error";
  const errorMessage = message || String(err);

  console.error(`[replay] Polling error (${errorName}): ${errorMessage}`);

  if (debugEnabled) {
    console.error("[replay][debug] Original polling error:", err);
  }
}

export default async function invokeAsyncLambdaFunctions(
  onFatalError?: () => void,
): Promise<void> {
  const queueUrl = process.env.DEV_LAMBDA_REPLAY_QUEUE_URL;
  const bucketName = process.env.DEV_LAMBDA_REPLAY_BUCKET_NAME;

  if (!queueUrl || !bucketName) return;

  try {
    const results = await pollReplayQueue(queueUrl, bucketName);

    for (const { envelope, receiptHandle } of results) {
      const handler = findHandler(envelope);
      const displayName = getDisplayHandlerName(envelope);

      if (handler) {
        console.log(
          `[replay] Invoking handler for ${displayName} (event: ${envelope.eventType})`,
        );
        try {
          await handler(envelope.originalEvent, mockContext(envelope));
        } catch (err) {
          console.error(`[replay] Handler error for ${displayName}:`, err);
        }
      } else {
        console.warn(
          `[replay] No handler registered for handlerName="${envelope.handlerName}" lambdaName="${envelope.lambdaName}"`,
        );
      }

      await deleteReplayMessage(queueUrl, receiptHandle);
    }
  } catch (err) {
    logReplayPollingError(err);
    if (isExpiredAwsLoginSession(err)) {
      // Stop polling if AWS session is expired
      if (onFatalError) onFatalError();
      return;
    }
  }
}
