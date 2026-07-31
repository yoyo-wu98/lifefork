import { access, cp, mkdir, rm, writeFile } from "node:fs/promises";
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
await writeFile(
  path.join(serverDirectory, "index.js"),
  `import { createRequire } from "node:module";

globalThis.require ??= createRequire("file:///worker/index.js");

const worker = await import("./worker.js");

export const DOQueueHandler = worker.DOQueueHandler;
export const DOShardedTagCache = worker.DOShardedTagCache;
export const BucketCachePurge = worker.BucketCachePurge;
export default worker.default;
`,
  "utf8",
);
// Sites uploads dist/client through its static-asset pipeline. Keeping the same
// files under dist/server would count them again toward the Worker size limit.
await rm(path.join(serverDirectory, "assets"), {
  recursive: true,
  force: true,
});

const assetsDirectory = path.join(openNextDirectory, "assets");
try {
  await access(assetsDirectory);
  await mkdir(clientDirectory, { recursive: true });
  await cp(assetsDirectory, clientDirectory, { recursive: true });
} catch {
  await mkdir(clientDirectory, { recursive: true });
}

console.log("Sites OpenNext bundle prepared.");
