import {
  StateGraph,
  StateSchema,
  MessagesValue,
  START,
  END,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import z from "zod";
import { model } from "./bedrock";

export type InvokeGraphResult = {
  messages: unknown[];
  route?: string;
};

// -------------------------
// State
// -------------------------

const ChatState = new StateSchema({
  messages: MessagesValue,

  // // track which branch we chose
  // route: {
  //   reducer: (_prev: string | undefined, next: string | undefined) => next,
  // },

  // // optional scratch log to show non-message state updates
  // log: {
  //   reducer: (prev: string[] = [], next: string[] | string) => {
  //     const nextArr = Array.isArray(next) ? next : [next];
  //     return [...prev, ...nextArr];
  //   },
  // },
});

// -------------------------
// Tools
// -------------------------

const awsDocTool = tool(
  async ({ service }: { service: string }) => {
    return `AWS doc summary: ${service} is commonly used in cloud architectures.`;
  },
  {
    name: "aws_doc_lookup",
    description: "Look up basic AWS service guidance.",
    schema: z.object({
      service: z.string().describe("AWS service name"),
    }),
  },
);

const addTool = tool(
  async ({ a, b }: { a: number; b: number }) => {
    return String(a + b);
  },
  {
    name: "add_numbers",
    description: "Add two numbers together.",
    schema: z.object({
      a: z.number(),
      b: z.number(),
    }),
  },
);

const multiplyTool = tool(
  async ({ a, b }: { a: number; b: number }) => {
    return String(a * b);
  },
  {
    name: "multiply_numbers",
    description: "Multiply two numbers together.",
    schema: z.object({
      a: z.number(),
      b: z.number(),
    }),
  },
);

// Different tool sets for different branches
const awsTools = [awsDocTool];
const mathTools = [addTool, multiplyTool];

// Bind different tools to different model nodes
const awsModel = model.bindTools(awsTools);
const mathModel = model.bindTools(mathTools);

// Tool executors
const awsToolNode = new ToolNode(awsTools);
const mathToolNode = new ToolNode(mathTools);

// -------------------------
// Nodes
// -------------------------

// Simple classifier node.
// For demo purposes, this uses plain code rather than an LLM.
const classifyIntent = async (state: typeof ChatState.State) => {
  const last = state.messages && state.messages[state.messages.length - 1];
  const content =
    last && "content" in last && typeof last.content === "string"
      ? last.content
      : "";

  const lower = content.toLowerCase();

  const route = /\b(add|sum|plus|multiply|times|\d)\b/.test(lower)
    ? "math"
    : "aws";

  return {
    route,
    log: [`classified:${route}`],
  };
};

// AWS-focused agent node
const awsAgent = async (state: typeof ChatState.State) => {
  const system = new SystemMessage(
    "You are an AWS assistant. Use aws_doc_lookup when it helps. Be concise.",
  );

  const response = await awsModel.invoke([system, ...state.messages]);

  return {
    messages: [response],
    log: ["awsAgent"],
  };
};

// Math-focused agent node
const mathAgent = async (state: typeof ChatState.State) => {
  const system = new SystemMessage(
    "You are a math assistant. Use tools for arithmetic. Be concise.",
  );

  const response = await mathModel.invoke([system, ...state.messages]);

  return {
    messages: [response],
    log: ["mathAgent"],
  };
};

// Optional finalizer node just to show another ordinary node
const finalize = async (state: typeof ChatState.State) => {
  return {
    log: ["finalize"],
  };
};

// -------------------------
// Routers
// -------------------------

function routeFromClassifier(state: typeof ChatState.State) {
  return state.route === "math" ? "mathAgent" : "awsAgent";
}

function routeAfterAwsAgent(state: typeof ChatState.State) {
  const last = state.messages && state.messages[state.messages.length - 1];

  if (
    last &&
    "tool_calls" in last &&
    Array.isArray((last as AIMessage).tool_calls) &&
    (last as AIMessage).tool_calls.length > 0
  ) {
    return "awsTools";
  }

  return "finalize";
}

function routeAfterMathAgent(state: typeof ChatState.State) {
  const last = state.messages && state.messages[state.messages.length - 1];

  if (
    last &&
    "tool_calls" in last &&
    Array.isArray((last as AIMessage).tool_calls) &&
    (last as AIMessage).tool_calls.length > 0
  ) {
    return "mathTools";
  }

  return "finalize";
}

// -------------------------
// Graph
// -------------------------

export const graph = new StateGraph(ChatState)
  .addNode("classifyIntent", classifyIntent)
  .addNode("awsAgent", awsAgent)
  .addNode("mathAgent", mathAgent)
  .addNode("awsTools", awsToolNode)
  .addNode("mathTools", mathToolNode)
  .addNode("finalize", finalize)

  .addEdge(START, "classifyIntent")

  // branch to one of two agent nodes
  .addConditionalEdges("classifyIntent", routeFromClassifier, {
    awsAgent: "awsAgent",
    mathAgent: "mathAgent",
  })

  // each agent may or may not call its own tool node
  .addConditionalEdges("awsAgent", routeAfterAwsAgent, {
    awsTools: "awsTools",
    finalize: "finalize",
  })
  .addConditionalEdges("mathAgent", routeAfterMathAgent, {
    mathTools: "mathTools",
    finalize: "finalize",
  })

  // loop back into the earlier agent after tools run
  .addEdge("awsTools", "awsAgent")
  .addEdge("mathTools", "mathAgent")

  .addEdge("finalize", END)
  .compile();

// -------------------------
// Invoke helpers
// -------------------------

export async function invokeGraph(input: string): Promise<InvokeGraphResult> {
  const result = await graph.invoke({
    messages: [new HumanMessage(input)],
  });

  return result as InvokeGraphResult;
}

// Optional streaming demo
export async function invokeGraphStream(input: string) {
  const stream = await graph.stream({
    messages: [new HumanMessage(input)],
  });

  for await (const chunk of stream) {
    console.log("STREAM CHUNK:", chunk);
  }
}
