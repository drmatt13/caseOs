import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { API_ROUTE } from "@repo/api-contract";
import { proxyToContainer, proxyToLambda } from "../lib/routeProxyHelpers";
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
proxyToLambda(app, API_ROUTE.signIn, signIn, "public");
proxyToLambda(app, API_ROUTE.signOut, signOut, "public");
proxyToLambda(app, API_ROUTE.oauthCallback, oauthCallback, "public");
proxyToLambda(app, API_ROUTE.refresh, refresh, "public");

// -- Stripe Routes --
proxyToLambda(app, API_ROUTE.stripeWebhook, stripeWebhook, "public");

/*********************************
 *     Authenticated Routes      *
 *********************************/
proxyToLambda(app, API_ROUTE.verifySession, verifySession, "authenticated");
proxyToLambda(app, API_ROUTE.getUser, getUser, "authenticated");
proxyToLambda(app, API_ROUTE.graphql, graphqlApi, "authenticated");
proxyToLambda(app, API_ROUTE.s3AccessBroker, s3AccessBroker, "authenticated");

// -- Stripe Routes --
proxyToLambda(
  app,
  API_ROUTE.billingListProducts,
  billingListProducts,
  "authenticated",
);
proxyToLambda(
  app,
  API_ROUTE.billingCreateSetupIntent,
  billingCreateSetupIntent,
  "authenticated",
);
proxyToLambda(
  app,
  API_ROUTE.billingCreateSubscription,
  billingCreateSubscription,
  "authenticated",
);

/*********************************
 *     ECS Service Routes        *
 *********************************/
proxyToContainer(
  app,
  API_ROUTE.langGraphService,
  LANGGRAPH_SERVICE_URL,
  "authenticated",
);

/*********************************
 *        Server Startup         *
 *********************************/

app.listen(PORT, () => {
  console.log(`Local API Dev Server is running on port ${PORT}`);
});
