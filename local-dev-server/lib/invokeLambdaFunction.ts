import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Request, Response } from "express";

type LambdaHandler = (
  event: APIGatewayProxyEvent,
  context: any,
) => Promise<APIGatewayProxyResult>;

export default async function invokeLambdaFunction(
  req: Request,
  res: Response,
  handler: LambdaHandler,
  context?: any,
): Promise<void> {
  const headers: { [name: string]: string } = {};
  const multiValueHeaders: { [name: string]: string[] } = {};

  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      headers[key] = value[value.length - 1];
      multiValueHeaders[key] = value;
    } else {
      headers[key] = value;
      multiValueHeaders[key] = [value];
    }
  }

  const toStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.map(String) : [String(v)];

  const hasQuery = Object.keys(req.query).length > 0;
  const queryStringParameters: { [key: string]: string } | null = hasQuery
    ? Object.fromEntries(
        Object.entries(req.query).map(([k, v]) => [
          k,
          Array.isArray(v) ? String(v[v.length - 1]) : String(v),
        ]),
      )
    : null;
  const multiValueQueryStringParameters: { [key: string]: string[] } | null =
    hasQuery
      ? Object.fromEntries(
          Object.entries(req.query).map(([k, v]) => [k, toStringArray(v)]),
        )
      : null;

  const event: APIGatewayProxyEvent = {
    httpMethod: req.method,
    path: req.path,
    headers,
    multiValueHeaders,
    queryStringParameters,
    multiValueQueryStringParameters,
    pathParameters: Object.keys(req.params).length
      ? Object.fromEntries(
          Object.entries(req.params).map(([k, v]) => [k, String(v)]),
        )
      : null,
    stageVariables: null,
    resource: req.path,
    body:
      req.body && Object.keys(req.body).length
        ? JSON.stringify(req.body)
        : null,
    isBase64Encoded: false,
    requestContext: {
      accountId: "local",
      apiId: "local",
      httpMethod: req.method,
      identity: { sourceIp: req.ip ?? "127.0.0.1" } as any,
      path: req.path,
      protocol: "HTTP/1.1",
      requestId: `local-${Date.now()}`,
      requestTimeEpoch: Date.now(),
      resourceId: "local",
      resourcePath: req.path,
      stage: "local",
    } as APIGatewayProxyEvent["requestContext"],
  };

  const result = await handler(event, context ?? {});

  if (result.headers) {
    for (const [key, value] of Object.entries(result.headers)) {
      res.setHeader(key, String(value));
    }
  }
  if (result.multiValueHeaders) {
    for (const [key, values] of Object.entries(result.multiValueHeaders)) {
      if (key.toLowerCase() === "set-cookie") {
        // Lambdas set Secure;SameSite=None for production HTTPS. On the local
        // HTTP dev server those attributes prevent browsers from storing cookies
        // across ports (localhost:3000 → localhost:8080). Strip Secure and
        // downgrade to SameSite=Lax — both ports share the same localhost site
        // so Lax is sufficient and cookies will be stored correctly over HTTP.
        const devCookies = values.map((v) =>
          String(v)
            .replace(/;\s*Secure/gi, "")
            .replace(/SameSite=None/gi, "SameSite=Lax"),
        );
        res.setHeader(key, devCookies);
      } else {
        res.setHeader(key, values.map(String));
      }
    }
  }

  res.status(result.statusCode).send(result.body);
}
