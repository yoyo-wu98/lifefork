const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const cwd = process.cwd();
const srcRoot = path.join(cwd, "src");
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(srcRoot, request.slice(2)), parent, isMain, options);
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require.extensions[".ts"] = function compileTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  }).outputText;

  module._compile(output, filename);
};

const { validateFullLifeDemoFixture } = require("../src/lib/scenarios/fullLifeDemoFixture.ts");
const result = validateFullLifeDemoFixture();

if (!result.valid) {
  console.error("Scenario fixture validation failed:");
  result.failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  [
    "Scenario fixture validation passed.",
    `Rendered app nodes: ${result.renderedNodeCount}`,
    `Rendered fork nodes: ${result.renderedForkNodeCount}`,
    `Choice sets: ${result.choiceSetCount}`,
    `Life stages: ${result.lifeStageCount}`,
    `Replay branches: ${result.replayBranchCount}`,
    `Choice set QA checklist items: ${result.choiceSetQaChecklistCount}`,
  ].join("\n"),
);
