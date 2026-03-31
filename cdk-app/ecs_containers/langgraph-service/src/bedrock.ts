import "dotenv/config";
import { ChatBedrockConverse } from "@langchain/aws";

export const model = new ChatBedrockConverse({
  region: process.env.AWS_REGION || "us-east-1",
  model: process.env.BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0",
  temperature: 0.2,
  maxTokens: 1000,
});
