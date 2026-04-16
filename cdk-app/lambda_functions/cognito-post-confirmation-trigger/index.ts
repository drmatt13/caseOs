import { PostConfirmationTriggerEvent } from "aws-lambda";
import type { User } from "@repo/database/src/generated/prisma/client";

export const lambdaHandler = async (event: PostConfirmationTriggerEvent) => {
  return event;
};
