import SchemaBuilder from "@pothos/core";
import PrismaPlugin from "@pothos/plugin-prisma";
import type PrismaTypes from "@repo/database/generated/pothos";
import { getDatamodel } from "@repo/database/generated/pothos";
import type { GraphQLContext } from "../graphql-context";

export const builder = new SchemaBuilder<{
  Context: GraphQLContext;
  PrismaTypes: PrismaTypes;
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: (context) => context.prisma,
    dmmf: getDatamodel(),
  },
});

builder.queryType({});
builder.mutationType({});
