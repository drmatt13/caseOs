import express from "express";
import dotenv from "dotenv";
import { invokeGraph } from "./graph";

dotenv.config({
  path: `.env`,
});

const PORT = process.env.PORT || 5000;

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/chat", async (req, res) => {
  try {
    const message = req.body?.message;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    const result = await invokeGraph(message);
    const lastMessage = result.messages[result.messages.length - 1] as {
      content?: string;
    };

    return res.json({
      ok: true,
      message: lastMessage?.content ?? "",
      raw: result,
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
