import { PostConfirmationTriggerEvent } from "aws-lambda";
import type { User } from "@repo/database/src/generated/prisma/client";
import { prisma } from "@repo/database/src/index";

export const lambdaHandler = async (event: PostConfirmationTriggerEvent) => {
  return event;
};
