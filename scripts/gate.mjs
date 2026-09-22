import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

execSync("pnpm test", { stdio: "inherit" });
execSync("pnpm typecheck", { stdio: "inherit" });

const banned = [
  [/linear-gradient/i, "gradient"],
  [/backdrop-filter/i, "glass"],
  [/glassmorphism/i, "glassmorphism"],
  [/AI-powered/i, "marketing phrase"],
  [/origin:\s*["']live["']/, "fixture labeled live"],
  [/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, "emoji"],
];

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === "test-results") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, acc);
    else if (/\.(tsx|ts|css|html)$/.test(name)) acc.push(path);
  }
  return acc;
}

let failed = false;
for (const file of [...walk("apps"), ...walk("packages")]) {
  const text = readFileSync(file, "utf8");
  for (const [pattern, label] of banned) {
    if (pattern.test(text)) {
      console.error(`gate: ${label} in ${file}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log("gate: contracts, types, and interface rules passed");
