import express from "express";
import dotenv from "dotenv";
import { randomUUID } from "crypto";
import * as sharedLambdaUtils from "@repo/shared-lambda-utils";
import { invokeGraph } from "./graph";

dotenv.config({
  path: `.env`,
});

const PORT = process.env.PORT || 5000;

const app = express();
app.use(express.json());

async function authMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> {
  try {
    const session = await sharedLambdaUtils.requireAuthenticatedHttpSession({
      authorizationHeader: req.header("authorization") ?? null,
      cookieHeader: req.header("cookie") ?? null,
    });

    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    res.locals.authSession = session;
    next();
  } catch (error) {
    console.error("auth error", error);
    res.status(500).json({
      ok: false,
      error: "Auth service is not configured",
    });
  }
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/chat", authMiddleware, async (req, res) => {
  try {
    // New user message, or value sent back into a paused interrupt()
    const message = req.body?.message;

    // true = resume from a paused interrupt()
    const resume = req.body?.resume === true;

    // Existing threadId, or generated for a new conversation
    const requestedThreadId = req.body?.threadId;
    const threadId =
      typeof requestedThreadId === "string" && requestedThreadId
        ? requestedThreadId
        : resume
          ? undefined
          : randomUUID();

    // Basic validation
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    // If resuming, threadId must be provided to know which paused execution to resume
    if (!threadId) {
      return res.status(400).json({
        error: "threadId is required for interrupt resume",
      });
    }

    // Normal invoke or interrupt resume, depending on resume flag
    const result = await invokeGraph(message, threadId, resume);

    // If the graph returned an interrupt, we send that back to the client so it can decide how to proceed (e.g., resume with additional input or tool results)
    const firstInterrupt = result.__interrupt__?.[0];
    if (firstInterrupt) {
      return res.json({
        ok: true,
        interrupted: true,
        threadId,
        interrupt: firstInterrupt.value,
      });
    }

    const lastMessage = result.messages?.at(-1) as
      | { content?: string }
      | undefined;

    return res.json({
      ok: true,
      interrupted: false,
      threadId,
      message: lastMessage?.content ?? "",
    });
  } catch (error) {
    console.error("chat error", error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "unknown error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`LangGraph Bedrock server listening on ${PORT}`);
});
