import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import cookie from "cookie";

type JsonResponseOptions = {
  headers?: Record<string, string>;
  multiValueHeaders?: Record<string, string[]>;
};

export function jsonResponse(
  statusCode: number,
  body: unknown,
  options: JsonResponseOptions = {},
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      ...options.headers,
    },
    multiValueHeaders: options.multiValueHeaders,
    body: JSON.stringify(body),
  };
}

export function parseJsonBody<T = unknown>(
  body: string | null | undefined,
): T {
  return JSON.parse(body ?? "{}") as T;
}

export function getHttpMethod(
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): string | undefined {
  return "httpMethod" in event
    ? event.httpMethod
    : event.requestContext?.http?.method;
}

export function optionsResponse(): APIGatewayProxyResult {
  return { statusCode: 204, body: "" };
}

export function getUserPoolClientId(): string | null {
  const value = process.env.USER_POOL_CLIENT_ID;
  return value && value.trim().length > 0 ? value : null;
}

export function parseCookies(
  cookieHeader: string | undefined,
): Record<string, string> {
  return cookieHeader ? cookie.parse(cookieHeader) : {};
}

export function makeAuthCookie(
  name: string,
  value: string,
  maxAge?: number,
): string {
  const maxAgeAttribute =
    typeof maxAge === "number" ? `; Max-Age=${maxAge}` : "";

  return `${name}=${value}; HttpOnly; Secure; SameSite=None; Path=/${maxAgeAttribute}`;
}

export function clearAuthCookie(name: string): string {
  return `${name}=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
