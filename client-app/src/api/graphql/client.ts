import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { print } from "graphql";
import { fetchWithAuthRefresh } from "#/lib/auth";

type GraphQLResponse<TData> = {
  data?: TData;
  errors?: Array<{ message?: string }>;
};

export async function executeGraphQL<TData, TVariables>(
  document: TypedDocumentNode<TData, TVariables>,
  variables?: TVariables,
): Promise<TData> {
  const res = await fetchWithAuthRefresh("/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: print(document),
      variables,
    }),
  });

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status}`);
  }

  const result = (await res.json()) as GraphQLResponse<TData>;

  if (result.errors?.length) {
    throw new Error(
      result.errors[0]?.message ?? "GraphQL request returned an error",
    );
  }

  if (!result.data) {
    throw new Error("GraphQL request did not return data");
  }

  return result.data;
}
