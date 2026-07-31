import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "src");
const registryPath = path.join(root, "src/lib/content/copyRegistry.ts");

const requiredFields = ["id", "surface", "intent", "tone", "riskLevel", "owner", "version"];
const copyIdPattern =
  /^(global|landing|entry|versionSelector|fiveQuestions|wechatImport|selfSkillPanel|timeline|lifeMap|chat|shareCard|navigation|loading|aiOutput|dynamicEvent|dynamicType|safety)\.[a-z][A-Za-z0-9]*\.[a-z][A-Za-z0-9]*\.v\d+$/;
const requiredPromptFiles = [
  "src/lib/ai/prompts/selfSkill.v1.ts",
  "src/lib/ai/prompts/dialogue.v1.ts",
  "src/lib/ai/prompts/wechat.v1.ts",
];
const forbiddenLiterals = [
  "未来自我箴言",
  "命运不需要被预测",
  "召唤可能性",
  "正在召唤未来自我",
  "正在识别反复出现的主题",
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function listSourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(fullPath);
    if (!/\.(ts|tsx)$/.test(entry.name)) return [];
    return [fullPath];
  });
}

function findMatchingBrace(source, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  return -1;
}

function collectCopyEntries(source) {
  const matches = [...source.matchAll(/export const (\w+_COPY)\s*=\s*defineCopy/g)];
  return matches.map((match) => {
    const openIndex = source.indexOf("{", match.index);
    const closeIndex = findMatchingBrace(source, openIndex);
    return {
      name: match[1],
      block: closeIndex >= 0 ? source.slice(openIndex, closeIndex + 1) : "",
    };
  });
}

function addIssue(issues, severity, file, message) {
  issues.push({ severity, file, message });
}

function auditRegistry(issues) {
  const source = fs.readFileSync(registryPath, "utf8");
  const entries = collectCopyEntries(source);
  const registryMatch = source.match(/export const contentRegistry = \[([\s\S]*?)\] as const;/);
  const registryBlock = registryMatch?.[1] ?? "";
  const ids = new Map();

  if (!entries.length) {
    addIssue(issues, "error", "src/lib/content/copyRegistry.ts", "No exported *_COPY entries found.");
  }

  entries.forEach(({ name, block }) => {
    requiredFields.forEach((field) => {
      if (!new RegExp(`\\b${field}\\s*:`).test(block)) {
        addIssue(issues, "error", "src/lib/content/copyRegistry.ts", `${name} is missing required metadata field: ${field}.`);
      }
    });

    const id = block.match(/\bid\s*:\s*"([^"]+)"/)?.[1];
    if (!id) {
      addIssue(issues, "error", "src/lib/content/copyRegistry.ts", `${name} is missing a string id.`);
    } else if (!copyIdPattern.test(id)) {
      addIssue(issues, "error", "src/lib/content/copyRegistry.ts", `${name} id must follow surface.intent.variant.vN: ${id}.`);
    } else if (ids.has(id)) {
      addIssue(issues, "error", "src/lib/content/copyRegistry.ts", `${name} duplicates content id ${id} already used by ${ids.get(id)}.`);
    } else {
      ids.set(id, name);
    }

    if (!registryBlock.includes(name)) {
      addIssue(issues, "error", "src/lib/content/copyRegistry.ts", `${name} is not included in contentRegistry.`);
    }
  });
}

function auditIntegration(issues) {
  requiredPromptFiles.forEach((file) => {
    if (!read(file).includes("formatContentPolicyForPrompt")) {
      addIssue(issues, "error", file, "AI prompt file does not include Content Systems output policy.");
    }
  });

  if (!read("src/lib/types.ts").includes("content?: ContentAttribution")) {
    addIssue(issues, "error", "src/lib/types.ts", "ForkPath is missing content attribution metadata.");
  }

  if (!read("src/lib/selfSkill/forkTreeRules.ts").includes("createLifeMapContentAttribution")) {
    addIssue(issues, "error", "src/lib/selfSkill/forkTreeRules.ts", "Life Map generation is not attaching content owner attribution.");
  }

  if (!read("src/components/ShareCard.tsx").includes("SHARE_CARD_TEMPLATE_COPY")) {
    addIssue(issues, "error", "src/components/ShareCard.tsx", "Share card is not using the centralized template copy.");
  }
}

function auditLegacyCopy(issues) {
  const allowed = new Set([
    path.join(root, "src/lib/content/copyRegistry.ts"),
  ]);

  listSourceFiles(srcDir).forEach((file) => {
    if (allowed.has(file)) return;
    const source = fs.readFileSync(file, "utf8");
    forbiddenLiterals.forEach((literal) => {
      if (source.includes(literal)) {
        addIssue(issues, "error", path.relative(root, file), `Legacy or unregistered copy literal found: ${literal}`);
      }
    });
  });
}

const issues = [];
auditRegistry(issues);
auditIntegration(issues);
auditLegacyCopy(issues);

if (issues.length) {
  console.error("Content registry audit failed:");
  issues.forEach((issue) => {
    console.error(`[${issue.severity}] ${issue.file}: ${issue.message}`);
  });
  process.exit(1);
}

console.log("Content registry audit passed.");
