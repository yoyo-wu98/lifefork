import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

const environment = { ...process.env };

try {
  const localEnvironment = await readFile(
    path.join(process.cwd(), ".env.local"),
    "utf8",
  );
  for (const line of localEnvironment.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (match) environment[match[1]] = "";
  }
} catch {
  // A deployment build does not require a local environment file.
}

const executable = path.join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32"
    ? "opennextjs-cloudflare.cmd"
    : "opennextjs-cloudflare",
);

const exitCode = await new Promise((resolve, reject) => {
  const child = spawn(executable, ["build"], {
    cwd: process.cwd(),
    env: environment,
    stdio: "inherit",
  });
  child.once("error", reject);
  child.once("exit", (code) => resolve(code ?? 1));
});

if (exitCode !== 0) process.exit(exitCode);
await import("./prepare-sites-opennext.mjs");
