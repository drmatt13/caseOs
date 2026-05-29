import {
  StateGraph,
  StateSchema,
  MessagesValue,
  START,
  END,
  MemorySaver,
  Command,
  interrupt,
} from "@langchain/langgraph";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";

// model
import { model } from "./bedrock";

export type InvokeGraphResult = {
  messages: unknown[];
  __interrupt__?: { value: unknown }[];
};

// -------------------------
// State
// -------------------------

const ChatState = new StateSchema({
  messages: MessagesValue,
});

// -------------------------
// Tools
// -------------------------

// A simple tool that adds two numbers together
const addTool = tool(
  // The function that will be called when the tool is invoked in the graph
  async ({ a, b }: { a: number; b: number }) => {
    const sum = a + b;
    return sum.toString();
  },
  // Metadata about the tool, including a name, description, and input schema
  {
    name: "add_numbers",
    description: "Add two numbers together.",
    schema: {
      type: "object",
      properties: {
        a: { type: "number", description: "First number to add" },
        b: { type: "number", description: "Second number to add" },
      },
      required: ["a", "b"],
      additionalProperties: false,
    },
  },
);

// A basic tool that pauses execution and waits for human input.
const requestHumanConfirmationTool = tool(
  async ({ prompt }: { prompt: string }) => {
    const resumeValue = interrupt({
      type: "human_confirmation",
      prompt,
      instructions:
        "Resume this thread with resume=true and message set to the human response.",
    });

    return `Human response received: ${String(resumeValue)}`;
  },
  {
    name: "request_human_confirmation",
    description:
      "Pause the graph and request human input when confirmation is needed before continuing.",
    schema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Question or prompt to ask the human before continuing",
        },
      },
      required: ["prompt"],
      additionalProperties: false,
    },
  },
);

const tools = [addTool, requestHumanConfirmationTool];
const modelWithTools = model.bindTools(tools);
const toolNode = new ToolNode(tools);

// -------------------------
// Nodes
// -------------------------

const assistant = async (state: typeof ChatState.State) => {
  const system = new SystemMessage(
    "You are a concise assistant for a starter LangGraph app. Keep responses short and clear. Use tools when helpful. If you need explicit user approval or missing information before continuing, call request_human_confirmation.",
  );

  const response = await modelWithTools.invoke([system, ...state.messages]);

  return {
    messages: [response],
  };
};

function routeAfterAssistant(state: typeof ChatState.State) {
  const last = state.messages?.[state.messages.length - 1];

  if (
    last &&
    "tool_calls" in last &&
    Array.isArray((last as AIMessage).tool_calls) &&
    (last as AIMessage).tool_calls!.length > 0
  ) {
    return "tools";
  }

  return END;
}

// -------------------------
// Graph
// -------------------------

const checkpointer = new MemorySaver();

export const graph = new StateGraph(ChatState)
  .addNode("assistant", assistant)
  .addNode("tools", toolNode)
  .addEdge(START, "assistant")
  .addConditionalEdges("assistant", routeAfterAssistant, {
    tools: "tools",
    [END]: END,
  })
  .addEdge("tools", "assistant")
  .compile({ checkpointer });

// -------------------------
// Invoke helpers
// -------------------------

export async function invokeGraph(
  input: string,
  threadId: string,
  resume?: boolean,
): Promise<InvokeGraphResult> {
  const config = { configurable: { thread_id: threadId } };

  // Resume from the last interrupt() checkpoint, or append a new user message to the thread
  const result = resume
    ? await graph.invoke(new Command({ resume: input }), config)
    : await graph.invoke({ messages: [new HumanMessage(input)] }, config);

  return result as InvokeGraphResult;
}

// Streaming helper for WebSocket/SSE realtime graph updates
export async function invokeGraphStream(input: string) {
  const stream = await graph.stream({
    messages: [new HumanMessage(input)],
  });

  for await (const chunk of stream) {
    console.log("STREAM CHUNK:", chunk);
  }
}
