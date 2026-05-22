import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import { API_ROUTE } from "@repo/api-contract";
import { verifyCognitoIdToken } from "@repo/shared-lambda-utils";
import invokeLambdaFunction from "../lib/invokeLambdaFunction";
import proxyToContainer from "../lib/proxyToContainer";
import invokeAsyncLambdaFunctions from "./invokeAsyncLambdaFunctions";

// Synchronous Lambda Functions
import { lambdaHandler as signIn } from "../../cdk-app/lambda_functions/sign-in/index";
import { lambdaHandler as signOut } from "../../cdk-app/lambda_functions/sign-out/index";
import { lambdaHandler as oauthCallback } from "../../cdk-app/lambda_functions/oauth-callback/index";
import { lambdaHandler as verifySession } from "../../cdk-app/lambda_functions/verify-session/index";
import { lambdaHandler as refresh } from "../../cdk-app/lambda_functions/refresh/index";
import { lambdaHandler as getUser } from "../../cdk-app/lambda_functions/get-user/index";
import { lambdaHandler as graphqlApi } from "../../cdk-app/lambda_functions/graphql-api/index";
import { lambdaHandler as s3AccessBroker } from "../../cdk-app/lambda_functions/s3-access-broker/index";

// Stripe-related Lambda functions
import { lambdaHandler as billingListProducts } from "../../cdk-app/lambda_functions/billing-list-products/index";
import { lambdaHandler as billingCreateSetupIntent } from "../../cdk-app/lambda_functions/billing-create-setup-intent/index";
import { lambdaHandler as billingCreateSubscription } from "../../cdk-app/lambda_functions/billing-create-subscription/index";
import { lambdaHandler as stripeWebhook } from "../../cdk-app/lambda_functions/stripe-webhook/index";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 8080;

// Container URLs (can be set via environment variables or default to localhost)
const LANGGRAPH_SERVICE_URL =
  process.env.LANGGRAPH_SERVICE_URL || "http://localhost:5000";

const app = express();

type LambdaResult = APIGatewayProxyResult & {
  cookies?: string[];
};

type LambdaHandler = (
  event: APIGatewayProxyEventV2,
  context: unknown,
) => Promise<LambdaResult>;

app.use(
  cors({
    origin: "http://localhost:3000", // Allow requests from the React app
    credentials: true, // Allow cookies to be sent
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "OPTIONS"],
  }),
);

app.use(
  express.json({
    verify: (req, _res, buffer) => {
      (req as express.Request & { rawBody?: string }).rawBody =
        buffer.toString("utf8");
    },
  }),
);

// Polling interval reference
let pollingInterval: NodeJS.Timeout | undefined;

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = undefined;
    console.warn(
      "[replay] Polling stopped due to fatal error (e.g., expired AWS session).",
    );
  }
}

async function instantiatePolling(): Promise<void> {
  await invokeAsyncLambdaFunctions(stopPolling);
}

// run every 10 seconds
pollingInterval = setInterval(() => {
  void instantiatePolling();
}, 10_000);

// ************************************************************
//                    LOCAL API DEV SERVER
//          Emulates API Gateway for local development
// ************************************************************

const authenticatedReadWriteMethods = ["GET", "POST"];

function getBearerToken(req: express.Request): string | null {
  const authorization = req.header("authorization")?.trim() ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  return match?.[1]?.trim() || null;
}

function isMethodAllowed(
  req: express.Request,
  methods: readonly string[] | "ANY",
): boolean {
  return (
    req.method.toUpperCase() === "OPTIONS" ||
    methods === "ANY" ||
    methods.includes(req.method.toUpperCase())
  );
}

function methodNotAllowed(res: express.Response): void {
  res.status(405).json({ error: "Method Not Allowed" });
}

function unauthorized(res: express.Response): void {
  res.status(401).json({ error: "Unauthorized" });
}

function addPublicRoute(
  path: string,
  methods: readonly string[] | "ANY",
  handler: LambdaHandler,
): void {
  app.all(path, async (req, res) => {
    if (!isMethodAllowed(req, methods)) {
      methodNotAllowed(res);
      return;
    }

    return invokeLambdaFunction(req, res, handler, {
      routeKey: `${req.method.toUpperCase()} ${path}`,
    });
  });
}

function addAuthenticatedRoute(
  path: string,
  methods: readonly string[],
  handler: LambdaHandler,
): void {
  app.all(path, async (req, res) => {
    if (!isMethodAllowed(req, methods)) {
      methodNotAllowed(res);
      return;
    }

    if (req.method.toUpperCase() === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    const token = getBearerToken(req);
    if (!token) {
      unauthorized(res);
      return;
    }

    try {
      const claims = await verifyCognitoIdToken(token);
      if (!claims) {
        unauthorized(res);
        return;
      }

      return invokeLambdaFunction(req, res, handler, {
        authorizerJwtClaims: claims,
        routeKey: `${req.method.toUpperCase()} ${path}`,
      });
    } catch (error) {
      console.error("Local Cognito authorizer error:", error);
      res.status(500).json({ error: "Auth service is not configured" });
      return;
    }
  });
}

/*********************************
 *         Root Endpoint         *
 *********************************/
app.get("/", (req, res) => {
  return res.send(
    "Welcome to the Local API Dev Server! Use this server to test your Lambda functions and ECS containers locally.",
  );
});

/*********************************
 *         Public Routes         *
 *********************************/
addPublicRoute(API_ROUTE.signIn, "ANY", signIn);
addPublicRoute(API_ROUTE.signOut, "ANY", signOut);
addPublicRoute(API_ROUTE.oauthCallback, "ANY", oauthCallback);
addPublicRoute(API_ROUTE.refresh, "ANY", refresh);
addPublicRoute(API_ROUTE.stripeWebhook, "ANY", stripeWebhook);

/*********************************
 *     Authenticated Routes      *
 *********************************/
addAuthenticatedRoute(
  API_ROUTE.verifySession,
  authenticatedReadWriteMethods,
  verifySession,
);
addAuthenticatedRoute(API_ROUTE.getUser, authenticatedReadWriteMethods, getUser);
addAuthenticatedRoute(API_ROUTE.graphql, authenticatedReadWriteMethods, graphqlApi);
addAuthenticatedRoute(
  API_ROUTE.s3AccessBroker,
  authenticatedReadWriteMethods,
  s3AccessBroker,
);

// -- Stripe Routes --
addAuthenticatedRoute(
  API_ROUTE.billingListProducts,
  authenticatedReadWriteMethods,
  billingListProducts,
);
addAuthenticatedRoute(
  API_ROUTE.billingCreateSetupIntent,
  authenticatedReadWriteMethods,
  billingCreateSetupIntent,
);
addAuthenticatedRoute(
  API_ROUTE.billingCreateSubscription,
  authenticatedReadWriteMethods,
  billingCreateSubscription,
);

/*********************************
 *     ECS Service Routes        *
 *********************************/
app.use("/langgraph-service", (req, res) => {
  return proxyToContainer(
    req,
    res,
    LANGGRAPH_SERVICE_URL, // Forward to the LangGraph service container
    "/langgraph-service", // Strip the base path when forwarding to the container
  );
});

/*********************************
 *        Server Startup         *
 *********************************/

app.listen(PORT, () => {
  console.log(`Local API Dev Server is running on port ${PORT}`);
});
