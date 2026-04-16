import { PostConfirmationTriggerEvent } from "aws-lambda";
import type { User } from "@repo/database/src/generated/prisma/client";

export const handler = async (event: PostConfirmationTriggerEvent) => {
  // await snsClient.send(
  //   new PublishCommand({
  //     TopicArn: process.env.ACCOUNTCREATEDTOPIC_TOPIC_ARN,
  //     Message: JSON.stringify({ user_id: event.request.userAttributes.sub }),
  //   })
  // );
  return event;
};
