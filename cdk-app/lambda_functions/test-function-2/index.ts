import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  const method =
    "httpMethod" in event ? event.httpMethod : event.requestContext.http.method;
  const path = "path" in event ? event.path : event.requestContext.http.path;

  console.log("=== FULL EVENT ===");

  // 🔥 KEY THINGS TO LOG
  console.log("=== CORE REQUEST DATA ===");
  console.log("Method:", method);
  console.log("Path:", path);

  console.log("=== HEADERS ===");
  console.log("Authorization:", event.headers?.authorization);
  console.log("Content-Type:", event.headers?.["content-type"]);

  console.log("=== QUERY PARAMS ===");
  console.log(event.queryStringParameters);

  console.log("=== BODY (RAW) ===");
  console.log(event.body);

  let parsedBody = null;

  try {
    parsedBody = event.body ? JSON.parse(event.body) : null;
  } catch (e) {
    console.log("Body parse failed");
  }

  console.log("=== BODY (PARSED) ===");
  console.log(parsedBody);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "hello from test function 2",
      received: {
        method,
        path,
        headers: event.headers,
        query: event.queryStringParameters || null,
        body: parsedBody,
      },
    }),
  };
};
