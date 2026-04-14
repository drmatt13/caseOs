import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import invokeLambdaFunction from "../lib/invokeLambdaFunction";
import proxyToContainer from "../lib/proxyToContainer";

// Import Lambda function handlers
import { lambdaHandler as signIn } from "../../cdk-app/lambda_functions/sign-in/index";
import { lambdaHandler as verifyUser } from "../../cdk-app/lambda_functions/verify-user/index";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
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

// ************************************************************
//                    LOCAL API DEV SERVER
//          Emulates API Gateway for local development
// ************************************************************

// Root endpoint
app.get("/", (req, res) => {
  return res.send(
    "Welcome to the Local API Dev Server! Use this server to test your Lambda functions and ECS containers locally.",
  );
});

// Lambda function routes
app.all("/sign-in", (req, res) => {
  return invokeLambdaFunction(req, res, signIn);
});
app.all("/verify-user", (req, res) => {
  return invokeLambdaFunction(req, res, verifyUser);
});

// ECS container routes
app.use("/langgraph-service", (req, res) => {
  return proxyToContainer(
    req,
    res,
    LANGGRAPH_SERVICE_URL, // Forward to the LangGraph service container
    "/langgraph-service", // Strip the base path when forwarding to the container
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Local API Dev Server is running on port ${PORT}`);
});
