import { Context, PostConfirmationTriggerEvent } from "aws-lambda";
import { captureEventDrivenInvocation } from "@repo/event-replay";

// placeholder
// import type { User } from "@repo/database/src/generated/prisma/client";
// import { prisma } from "@repo/database/src/index";

export const lambdaHandler = async (
  event: PostConfirmationTriggerEvent,
  context: Context,
): Promise<PostConfirmationTriggerEvent> => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  console.log("Execution context:", JSON.stringify(context, null, 2));

  if (process.env.USE_LOCAL_IMPLEMENTATIONS === "true") {
    await captureEventDrivenInvocation(event, context);
  }

  console.log("Post-confirmation trigger executed successfully.");

  return event;
};
