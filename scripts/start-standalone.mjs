import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");

process.env.LIFEFORK_CONFIG_PATH ??= path.join(
  projectRoot,
  "data",
  "runtime-config.json",
);

await import(
  pathToFileURL(path.join(projectRoot, ".next", "standalone", "server.js")).href
);
