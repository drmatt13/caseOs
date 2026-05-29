const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const packageRoot = path.join(__dirname, "..");
const repoRoot = path.join(packageRoot, "..", "..");
const binaryTargetsJson = process.env.PRISMA_BINARY_TARGETS;

let binaryTargets;

if (binaryTargetsJson !== undefined) {
  try {
    binaryTargets = JSON.parse(binaryTargetsJson);
  } catch (error) {
    throw new Error(
      `PRISMA_BINARY_TARGETS must be a JSON array string. Received: ${binaryTargetsJson}`,
    );
  }

  if (
    !Array.isArray(binaryTargets) ||
    binaryTargets.length === 0 ||
    binaryTargets.some((target) => typeof target !== "string" || !target)
  ) {
    throw new Error(
      `PRISMA_BINARY_TARGETS must be a non-empty JSON array of strings. Received: ${binaryTargetsJson}`,
    );
  }

  process.env.PRISMA_BINARY_TARGETS = JSON.stringify(binaryTargets);
}

const generatedClientDirs = [
  path.join(repoRoot, "node_modules", ".prisma", "client"),
  path.join(packageRoot, "src", "generated", "prisma"),
];

const engineFilePattern =
  /^(libquery_engine-.+\.(so|dylib)\.node|query_engine-.+\.dll\.node)$/;

for (const clientDir of generatedClientDirs) {
  if (!fs.existsSync(clientDir)) {
    continue;
  }

  for (const entry of fs.readdirSync(clientDir)) {
    if (engineFilePattern.test(entry)) {
      fs.rmSync(path.join(clientDir, entry), { force: true });
    }
  }
}

execSync("npx prisma generate", {
  cwd: packageRoot,
  env: process.env,
  stdio: "inherit",
});
