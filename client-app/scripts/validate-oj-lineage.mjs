import fs from "node:fs";

const src = fs.readFileSync(
  new URL("../src/lib/caseWorkspaceDemoOj.ts", import.meta.url),
  "utf8",
);
const lines = src.split(/\r?\n/);
const records = {};
let cur = null;
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  const idm = l.match(/^\s*id:\s*"([^"]+)",/);
  if (idm) {
    cur = { id: idm[1], status: "ACCEPTED", replaces: [], replacedBy: [] };
    records[idm[1]] = cur;
    continue;
  }
  if (!cur) continue;
  const sm = l.match(/^\s*status:\s*"([^"]+)"/);
  if (sm) cur.status = sm[1];
  for (const key of ["replacesIds", "replacedByIds"]) {
    if (l.includes(key + ":")) {
      let chunk = l;
      let j = i;
      while (!chunk.includes("]") && j < lines.length - 1) {
        j++;
        chunk += lines[j];
      }
      const got = [...chunk.matchAll(/"([^"]+)"/g)]
        .map((m) => m[1])
        .filter((x) => x !== key);
      if (key === "replacesIds") cur.replaces = got;
      else cur.replacedBy = got;
    }
  }
}

const problems = [];
for (const r of Object.values(records)) {
  for (const t of r.replacedBy) {
    if (!records[t]) {
      problems.push(`${r.id} replacedBy missing ${t}`);
      continue;
    }
    if (!records[t].replaces.includes(r.id))
      problems.push(
        `ONE-WAY: ${r.id} replacedBy ${t}, but ${t} omits replaces ${r.id}`,
      );
  }
  for (const s of r.replaces) {
    if (!records[s]) {
      problems.push(`${r.id} replaces missing ${s}`);
      continue;
    }
    if (!records[s].replacedBy.includes(r.id))
      problems.push(
        `ONE-WAY: ${r.id} replaces ${s}, but ${s} omits replacedBy ${r.id}`,
      );
  }
}

const chains = Object.values(records)
  .filter((r) => r.replaces.length && r.replacedBy.length)
  .map((r) => r.id);
const branches = Object.values(records)
  .filter((r) => r.replacedBy.length > 1)
  .map((r) => `${r.id} -> [${r.replacedBy.join(", ")}]`);
const merges = Object.values(records)
  .filter((r) => r.replaces.length > 1)
  .map((r) => `${r.id} <- [${r.replaces.join(", ")}]`);

console.log("MID-CHAIN (both replaces & replacedBy):\n  " + (chains.join("\n  ") || "none"));
console.log("\nBRANCHES (replacedBy > 1):\n  " + (branches.join("\n  ") || "none"));
console.log("\nMERGES (replaces > 1):\n  " + (merges.join("\n  ") || "none"));
console.log("\nCONSISTENCY:");
console.log(
  problems.length === 0
    ? "  fully bidirectional"
    : "  " + problems.join("\n  "),
);
