import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import { Request, Response } from "express";

type LambdaResult = APIGatewayProxyResult & {
  cookies?: string[];
};

type LambdaHandler = (
  event: APIGatewayProxyEventV2,
  context: unknown,
) => Promise<LambdaResult>;

type InvokeLambdaOptions = {
  authorizerJwtClaims?: Record<string, unknown>;
  context?: unknown;
  routeKey?: string;
};

type RequestWithRawBody = Request & {
  rawBody?: string;
};

function getSingleHeaderValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value.join(",");
  }

  return value ?? "";
}

function getRequestBody(req: Request): string | null {
  const rawBody = (req as RequestWithRawBody).rawBody;
  if (typeof rawBody === "string" && rawBody.length > 0) {
    return rawBody;
  }

  if (typeof req.body === "string") {
    return req.body;
  }

  if (Buffer.isBuffer(req.body)) {
    return req.body.toString("utf8");
  }

  if (req.body && Object.keys(req.body).length) {
    return JSON.stringify(req.body);
  }

  return null;
}

function toQueryStringParameters(
  query: Request["query"],
): Record<string, string> | undefined {
  if (Object.keys(query).length === 0) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(query).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.map(String).join(",") : String(value),
    ]),
  );
}

function toDevCookie(cookieValue: string): string {
  // Lambdas set Secure;SameSite=None for production HTTPS. On the local HTTP
  // dev server those attributes prevent browsers from storing cookies across
  // ports, so downgrade them for localhost development.
  return cookieValue
    .replace(/;\s*Secure/gi, "")
    .replace(/SameSite=None/gi, "SameSite=Lax");
}

export default async function invokeLambdaFunction(
  req: Request,
  res: Response,
  handler: LambdaHandler,
  options: InvokeLambdaOptions = {},
): Promise<void> {
  const headers: Record<string, string> = {};

  for (const [key, value] of Object.entries(req.headers)) {
    const headerValue = getSingleHeaderValue(value);
    if (headerValue) {
      headers[key.toLowerCase()] = headerValue;
    }
  }

  const routeKey = options.routeKey ?? `${req.method} ${req.path}`;
  const requestId = `local-${Date.now()}`;
  const rawQueryString = req.originalUrl.includes("?")
    ? req.originalUrl.slice(req.originalUrl.indexOf("?") + 1)
    : "";
  const cookieHeader = headers.cookie;

  const event: APIGatewayProxyEventV2 = {
    version: "2.0",
    routeKey,
    rawPath: req.path,
    rawQueryString,
    cookies: cookieHeader ? [cookieHeader] : undefined,
    headers,
    queryStringParameters: toQueryStringParameters(req.query),
    pathParameters: Object.keys(req.params).length
      ? Object.fromEntries(
          Object.entries(req.params).map(([key, value]) => [
            key,
            String(value),
          ]),
        )
      : undefined,
    body: getRequestBody(req) ?? undefined,
    isBase64Encoded: false,
    requestContext: {
      accountId: "local",
      apiId: "local",
      domainName: headers.host ?? "localhost",
      domainPrefix: "local",
      http: {
        method: req.method,
        path: req.path,
        protocol: "HTTP/1.1",
        sourceIp: req.ip ?? "127.0.0.1",
        userAgent: headers["user-agent"] ?? "",
      },
      requestId,
      routeKey,
      stage: "local",
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
      ...(options.authorizerJwtClaims
        ? {
            authorizer: {
              jwt: {
                claims: options.authorizerJwtClaims,
                scopes: [],
              },
            },
          }
        : {}),
    },
  };

  const result = await handler(event, options.context ?? {});
  const setCookieValues = new Set<string>();

  if (result.cookies) {
    result.cookies.forEach((cookie) => setCookieValues.add(cookie));
  }

  if (result.headers) {
    for (const [key, value] of Object.entries(result.headers)) {
      if (key.toLowerCase() === "set-cookie") {
        setCookieValues.add(String(value));
      } else {
        res.setHeader(key, String(value));
      }
    }
  }

  if (result.multiValueHeaders) {
    for (const [key, values] of Object.entries(result.multiValueHeaders)) {
      if (key.toLowerCase() === "set-cookie") {
        values.forEach((value) => setCookieValues.add(String(value)));
      } else {
        res.setHeader(key, values.map(String));
      }
    }
  }

  if (setCookieValues.size > 0) {
    res.setHeader(
      "Set-Cookie",
      [...setCookieValues].map((value) => toDevCookie(value)),
    );
  }

  res.status(result.statusCode).send(result.body);
}
