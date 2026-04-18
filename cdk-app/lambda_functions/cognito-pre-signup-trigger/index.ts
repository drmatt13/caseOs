import { PreSignUpTriggerEvent } from "aws-lambda";

export const lambdaHandler = async (event: PreSignUpTriggerEvent) => {
  event.response.autoConfirmUser = true;
  event.response.autoVerifyEmail = true;
  return event;
};
