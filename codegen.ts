import type { CodegenConfig } from "@graphql-codegen/cli";
import { schema } from "./cdk-app/lambda_functions/graphql-api/schema/index";

const config: CodegenConfig = {
  schema,
  documents: ["client-app/src/api/**/*.ts", "!client-app/src/api/generated/**"],
  generates: {
    "client-app/src/api/generated/": {
      preset: "client",
      config: {
        useTypeImports: true,
      },
      presetConfig: {
        fragmentMasking: false,
      },
    },
    "client-app/src/api/generated/schema.graphql": {
      plugins: ["schema-ast"],
      config: {
        includeDirectives: true,
      },
    },
  },
};

export default config;
