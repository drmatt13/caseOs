import express from "express";
import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import { requireAuthenticatedHttpSession } from "@repo/shared-lambda-utils";
import invokeLambdaFunction from "./invokeLambdaFunction";
import forwardToContainer from "./proxyToContainer";

export type AuthMode = "public" | "authenticated";

export type LambdaResult = APIGatewayProxyResult & {
  cookies?: string[];
};

export type LambdaHandler = (
  event: APIGatewayProxyEventV2,
  context: unknown,
) => Promise<LambdaResult>;

export function unauthorized(res: express.Response): void {
  res.status(401).json({ error: "Unauthorized" });
}

async function getRequestSession(req: express.Request) {
  return requireAuthenticatedHttpSession({
    authorizationHeader: req.header("authorization"),
    cookieHeader: req.header("cookie"),
  });
}

export function proxyToLambda(
  app: express.Express,
  path: string,
  handler: LambdaHandler,
  authMode: AuthMode = "public",
): void {
  app.all(path, async (req, res) => {
    if (req.method.toUpperCase() === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      let session: Awaited<ReturnType<typeof getRequestSession>> | undefined;

      if (authMode === "authenticated") {
        session = await getRequestSession(req);
        if (!session) {
          unauthorized(res);
          return;
        }
      }

      return invokeLambdaFunction(req, res, handler, {
        authorizerJwtClaims: session?.payload ?? undefined,
        routeKey: `${req.method.toUpperCase()} ${path}`,
      });
    } catch (error) {
      console.error("Local Lambda proxy error:", error);
      res.status(500).json({ error: "Local Lambda proxy failed" });
      return;
    }
  });
}

export function proxyToContainer(
  app: express.Express,
  path: string,
  containerUrl: string,
  authMode: AuthMode = "public",
): void {
  app.use(path, async (req, res) => {
    if (req.method.toUpperCase() === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      if (authMode === "authenticated") {
        const session = await getRequestSession(req);
        if (!session) {
          unauthorized(res);
          return;
        }
      }

      return forwardToContainer(req, res, containerUrl, path);
    } catch (error) {
      console.error("Local container proxy error:", error);
      res.status(500).json({ error: "Local container proxy failed" });
      return;
    }
  });
}
