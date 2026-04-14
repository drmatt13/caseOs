import { CustomMessageTriggerEvent } from "aws-lambda";

export const lambdaHandler = async (event: CustomMessageTriggerEvent) => {
  if (event.triggerSource === "CustomMessage_SignUp") {
    const email = event.request.userAttributes?.email ?? "";
    const username = event.userName;
    const code = event.request.codeParameter;
    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

    const verifyUrl =
      `${frontendUrl}/verify-account` +
      `?username=${encodeURIComponent(username)}` +
      `&email=${encodeURIComponent(email)}` +
      `&code=${code}`;

    event.response.emailSubject = "CaseOS - Verify your email";
    event.response.emailMessage = `
      <p>Click this link to verify your email address:</p>
      <p><a href="${verifyUrl}">Verify Email</a></p>
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>If the button does not work, open the app and paste this code manually.</p>
    `;
  }

  return event;
};
