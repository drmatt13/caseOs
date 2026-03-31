import {
  StateGraph,
  StateSchema,
  MessagesValue,
  START,
  END,
} from "@langchain/langgraph";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { model } from "./bedrock";

export type InvokeGraphResult = {
  messages: unknown[];
};

const ChatState = new StateSchema({
  messages: MessagesValue,
});

const callModel = async (state: typeof ChatState.State) => {
  const system = new SystemMessage(
    "You are a concise AWS-focused assistant. Answer clearly and directly.",
  );

  const response = await model.invoke([system, ...state.messages]);

  return {
    messages: [response],
  };
};

export const graph = new StateGraph(ChatState)
  .addNode("callModel", callModel)
  .addEdge(START, "callModel")
  .addEdge("callModel", END)
  .compile();

export async function invokeGraph(input: string): Promise<InvokeGraphResult> {
  const result = await graph.invoke({
    messages: [new HumanMessage(input)],
  });

  return result as InvokeGraphResult;
}
