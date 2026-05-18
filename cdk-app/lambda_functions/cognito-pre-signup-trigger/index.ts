import {
  AdminLinkProviderForUserCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { PreSignUpTriggerEvent } from "aws-lambda";

const cognito = new CognitoIdentityProviderClient({});

function shouldSkipEmailVerification(): boolean {
  return process.env.SKIP_EMAIL_VERIFICATION === "true";
}

function parseExternalProviderUserName(
  userName: string,
): { providerName: string; providerUserId: string } | null {
  const separatorIndex = userName.indexOf("_");

  if (separatorIndex <= 0 || separatorIndex === userName.length - 1) {
    return null;
  }

  return {
    providerName: userName.slice(0, separatorIndex),
    providerUserId: userName.slice(separatorIndex + 1),
  };
}

function escapeCognitoFilterValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function linkExternalProviderToExistingUser(
  event: PreSignUpTriggerEvent,
): Promise<void> {
  const email = event.request.userAttributes.email?.trim().toLowerCase();
  const externalProvider = parseExternalProviderUserName(event.userName);

  if (!email || !externalProvider) {
    return;
  }

  const users = await cognito.send(
    new ListUsersCommand({
      UserPoolId: event.userPoolId,
      Filter: `email = "${escapeCognitoFilterValue(email)}"`,
      Limit: 10,
    }),
  );

  const existingNativeUser = users.Users?.find(
    (user) =>
      user.Username &&
      user.UserStatus !== "EXTERNAL_PROVIDER" &&
      user.Attributes?.some(
        (attribute) =>
          attribute.Name === "email" &&
          attribute.Value?.trim().toLowerCase() === email,
      ),
  );

  if (!existingNativeUser?.Username) {
    return;
  }

  await cognito.send(
    new AdminLinkProviderForUserCommand({
      UserPoolId: event.userPoolId,
      DestinationUser: {
        ProviderName: "Cognito",
        ProviderAttributeValue: existingNativeUser.Username,
      },
      SourceUser: {
        ProviderName: externalProvider.providerName,
        ProviderAttributeName: "Cognito_Subject",
        ProviderAttributeValue: externalProvider.providerUserId,
      },
    }),
  );
}

export const lambdaHandler = async (event: PreSignUpTriggerEvent) => {
  if (event.triggerSource === "PreSignUp_ExternalProvider") {
    await linkExternalProviderToExistingUser(event);
    event.response.autoConfirmUser = true;
    event.response.autoVerifyEmail = true;
    return event;
  }

  if (shouldSkipEmailVerification()) {
    event.response.autoConfirmUser = true;
    event.response.autoVerifyEmail = true;
  }

  return event;
};
