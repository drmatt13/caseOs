import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";

const repoRoot = path.join(__dirname, "..", "..");
const prismaClientSourcePath = path.join(
  repoRoot,
  "node_modules",
  ".prisma",
  "client",
);
const prismaQueryEngineFileName = "libquery_engine-rhel-openssl-3.0.x.so.node";

export const prismaLambdaEnvironment = {
  PRISMA_QUERY_ENGINE_LIBRARY: `/var/task/${prismaQueryEngineFileName}`,
};

export const prismaClientCommandHooks: nodejs.ICommandHooks = {
  beforeInstall() {
    return [];
  },

  beforeBundling() {
    return [];
  },

  afterBundling(_inputDir: string, outputDir: string) {
    const copyScript = [
      "const fs = require('fs');",
      "const path = require('path');",
      `const source = ${JSON.stringify(prismaClientSourcePath)};`,
      `const output = ${JSON.stringify(outputDir)};`,
      "const target = path.join(output, 'node_modules', '.prisma', 'client');",
      `const engineFileName = ${JSON.stringify(prismaQueryEngineFileName)};`,
      "const shouldCopyClientFile = (name) => !name.endsWith('.node') || name === engineFileName;",
      "const copyClient = (sourceDir, targetDir) => {",
      "  fs.mkdirSync(targetDir, { recursive: true });",
      "  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {",
      "    const sourcePath = path.join(sourceDir, entry.name);",
      "    const targetPath = path.join(targetDir, entry.name);",
      "    if (entry.isDirectory()) {",
      "      copyClient(sourcePath, targetPath);",
      "    } else if (shouldCopyClientFile(entry.name)) {",
      "      fs.copyFileSync(sourcePath, targetPath);",
      "    }",
      "  }",
      "};",
      "fs.rmSync(target, { recursive: true, force: true });",
      "copyClient(source, target);",
      "fs.copyFileSync(path.join(source, engineFileName), path.join(output, engineFileName));",
    ].join(" ");

    return [`node -e ${JSON.stringify(copyScript)}`];
  },
};
