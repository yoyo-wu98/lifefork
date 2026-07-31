import { access, cp, mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const openNextDirectory = path.join(root, ".open-next");
const workerFile = path.join(openNextDirectory, "worker.js");
const distDirectory = path.join(root, "dist");
const serverDirectory = path.join(distDirectory, "server");
const clientDirectory = path.join(distDirectory, "client");

await access(workerFile);
await rm(distDirectory, { recursive: true, force: true });
await mkdir(serverDirectory, { recursive: true });

await cp(openNextDirectory, serverDirectory, { recursive: true });
await rename(
  path.join(serverDirectory, "worker.js"),
  path.join(serverDirectory, "index.js"),
);

const assetsDirectory = path.join(openNextDirectory, "assets");
try {
  await access(assetsDirectory);
  await mkdir(clientDirectory, { recursive: true });
  await cp(assetsDirectory, clientDirectory, { recursive: true });
} catch {
  await mkdir(clientDirectory, { recursive: true });
}

console.log("Sites OpenNext bundle prepared.");
