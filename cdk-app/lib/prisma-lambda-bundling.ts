import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";

const repoRoot = path.join(__dirname, "..", "..");

const getPrismaQueryEngineFileName = (binaryTarget: string) =>
  `libquery_engine-${binaryTarget}.so.node`;

export const makePrismaLambdaEnvironment = (binaryTarget: string) => ({
  PRISMA_QUERY_ENGINE_LIBRARY: `/var/task/${getPrismaQueryEngineFileName(binaryTarget)}`,
});

export const makePrismaClientCommandHooks = (
  binaryTarget: string,
): nodejs.ICommandHooks => ({
  beforeInstall() {
    return [];
  },

  beforeBundling() {
    return [];
  },

  afterBundling(_inputDir: string, outputDir: string) {
    const prismaQueryEngineFileName =
      getPrismaQueryEngineFileName(binaryTarget);
    const copyScript = [
      "(function(){",
      "const fs = require('fs');",
      "const path = require('path');",
      `const repoRoot = ${JSON.stringify(path.join(repoRoot))};`,
      `const output = ${JSON.stringify(outputDir)};`,
      `const engineFileName = ${JSON.stringify(prismaQueryEngineFileName)};`,
      "const shouldCopyClientFile = (name) => !name.endsWith('.node') || name === engineFileName;",
      "const candidates = [];",
      // default common location
      `candidates.push(path.join(repoRoot, 'node_modules', '.prisma', 'client'));`,
      // @prisma/client package location
      `candidates.push(path.join(repoRoot, 'node_modules', '@prisma', 'client', '.prisma', 'client'));`,
      // pnpm nested node_modules/.pnpm entries
      "const pnpmDir = path.join(repoRoot, 'node_modules', '.pnpm');",
      "if (fs.existsSync(pnpmDir)) {",
      "  for (const entry of fs.readdirSync(pnpmDir)) {",
      "    candidates.push(path.join(pnpmDir, entry, 'node_modules', '.prisma', 'client'));",
      "  }",
      "}",
      "const findExisting = () => candidates.find(p => fs.existsSync(p));",
      "const source = findExisting();",
      "if (!source) {",
      "  console.warn('prisma client folder not found among candidates:', candidates);",
      "  return;",
      "}",
      "const target = path.join(output, 'node_modules', '.prisma', 'client');",
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
      "try {",
      "  fs.rmSync(target, { recursive: true, force: true });",
      "  copyClient(source, target);",
      "  const enginePath = path.join(source, engineFileName);",
      "  if (fs.existsSync(enginePath)) {",
      "    fs.copyFileSync(enginePath, path.join(output, engineFileName));",
      "  } else {",
      "    console.warn('prisma engine file not found at', enginePath);",
      "  }",
      "} catch (err) {",
      "  console.error('Error copying prisma client files:', err);",
      "}",
      "})();",
    ].join(" ");

    return [`node -e ${JSON.stringify(copyScript)}`];
  },
});
