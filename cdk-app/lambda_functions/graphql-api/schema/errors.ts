import { GraphQLError } from "graphql";

export function badUserInput(message: string): GraphQLError {
  return new GraphQLError(message, {
    extensions: {
      code: "BAD_USER_INPUT",
    },
  });
}

export function notFound(message: string): GraphQLError {
  return new GraphQLError(message, {
    extensions: {
      code: "NOT_FOUND",
    },
  });
}

export function forbidden(message: string): GraphQLError {
  return new GraphQLError(message, {
    extensions: {
      code: "FORBIDDEN",
    },
  });
}
