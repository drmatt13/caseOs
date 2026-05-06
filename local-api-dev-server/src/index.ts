import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import invokeLambdaFunction from "../lib/invokeLambdaFunction";
import proxyToContainer from "../lib/proxyToContainer";
import invokeAsyncLambdaFunctions from "./invokeAsyncLambdaFunctions";

// Synchronous Lambda Functions
import { lambdaHandler as signIn } from "../../cdk-app/lambda_functions/sign-in/index";
import { lambdaHandler as signOut } from "../../cdk-app/lambda_functions/sign-out/index";
import { lambdaHandler as oauthCallback } from "../../cdk-app/lambda_functions/oauth-callback/index";
import { lambdaHandler as verifyUser } from "../../cdk-app/lambda_functions/verify-user/index";
import { lambdaHandler as refresh } from "../../cdk-app/lambda_functions/refresh/index";
import { lambdaHandler as getUser } from "../../cdk-app/lambda_functions/get-user/index";
import { lambdaHandler as updateUser } from "../../cdk-app/lambda_functions/update-user/index";
import { lambdaHandler as s3AccessBroker } from "../../cdk-app/lambda_functions/s3-access-broker/index";

// Stripe-related Lambda functions
import { lambdaHandler as billingListProducts } from "../../cdk-app/lambda_functions/billing-list-products/index";
import { lambdaHandler as billingCreateSetupIntent } from "../../cdk-app/lambda_functions/billing-create-setup-intent/index";
import { lambdaHandler as billingCreateSubscription } from "../../cdk-app/lambda_functions/billing-create-subscription/index";

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
  }),
);

app.use(express.json());

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
app.all("/sign-in", async (req, res) => {
  console.log("Sign-in request received");
  return invokeLambdaFunction(req, res, signIn);
});

app.all("/sign-out", async (req, res) => {
  return invokeLambdaFunction(req, res, signOut);
});

app.all("/oauth/callback", async (req, res) => {
  return invokeLambdaFunction(req, res, oauthCallback);
});

app.all("/refresh", async (req, res) => {
  return invokeLambdaFunction(req, res, refresh);
});

/*********************************
 *     Authenticated Routes      *
 *********************************/
app.all("/get-user", async (req, res) => {
  return invokeLambdaFunction(req, res, getUser);
});

app.all("/update-user", async (req, res) => {
  return invokeLambdaFunction(req, res, updateUser);
});

app.all("/verify-user", async (req, res) => {
  return invokeLambdaFunction(req, res, verifyUser);
});

app.all("/s3-access-broker", async (req, res) => {
  return invokeLambdaFunction(req, res, s3AccessBroker);
});

// -- Stripe Routes --
app.all("/billing/list-products", async (req, res) => {
  return invokeLambdaFunction(req, res, billingListProducts);
});

app.all("/billing/create-setup-intent", async (req, res) => {
  return invokeLambdaFunction(req, res, billingCreateSetupIntent);
});

app.all("/billing/create-subscription", async (req, res) => {
  return invokeLambdaFunction(req, res, billingCreateSubscription);
});

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
