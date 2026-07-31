import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const standaloneRoot = path.join(projectRoot, ".next", "standalone");

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function replaceDirectory(source, target) {
  if (!(await exists(source))) return;
  await rm(target, { recursive: true, force: true });
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target, { recursive: true });
}

if (!(await exists(path.join(standaloneRoot, "server.js")))) {
  throw new Error("Standalone server is missing. Run `next build` first.");
}

await replaceDirectory(
  path.join(projectRoot, ".next", "static"),
  path.join(standaloneRoot, ".next", "static"),
);
await replaceDirectory(
  path.join(projectRoot, "public"),
  path.join(standaloneRoot, "public"),
);

console.log("Standalone static assets prepared.");
