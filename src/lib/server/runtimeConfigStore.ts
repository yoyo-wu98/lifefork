import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import {
  createDefaultRuntimeConfig,
  type EditableRuntimeConfig,
  type PublicRuntimeConfig,
} from "@/lib/runtimeConfig";
import { readServerEnvironment } from "@/lib/server/environment";

const runtimeConfigSchema = z.object({
  version: z.literal("public-runtime.v1"),
  updatedAt: z.string(),
  status: z.enum(["online", "maintenance"]),
  betaLabel: z.string().trim().max(40),
  announcement: z.string().trim().max(500),
  privacyNotice: z.string().trim().max(800),
  features: z.object({
    ai: z.boolean(),
    wechatImport: z.boolean(),
    culturalMethods: z.boolean(),
    demoScenario: z.boolean(),
  }),
  defaults: z.object({
    analysisPreset: z.enum([
      "evidence-first",
      "balanced",
      "cultural-exploration",
    ]),
  }),
});

interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
}

interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
}

let d1Initialization: Promise<void> | null = null;

function cloudflareEnvironment(): Record<string, unknown> | null {
  try {
    return getCloudflareContext().env as unknown as Record<string, unknown>;
  } catch {
    return null;
  }
}

function cloudflareDatabase(): D1DatabaseLike | null {
  const database = cloudflareEnvironment()?.DB;
  if (
    database &&
    typeof database === "object" &&
    "prepare" in database &&
    typeof database.prepare === "function"
  ) {
    return database as D1DatabaseLike;
  }
  return null;
}

async function ensureD1Schema(database: D1DatabaseLike) {
  if (!d1Initialization) {
    const initialization = database
      .prepare(
        `CREATE TABLE IF NOT EXISTS lifefork_runtime_config (
          id TEXT PRIMARY KEY NOT NULL,
          payload TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )`,
      )
      .run()
      .then(() => undefined);
    d1Initialization = initialization.catch((error) => {
      d1Initialization = null;
      throw error;
    });
  }
  await d1Initialization;
}

async function readD1Config(
  database: D1DatabaseLike,
): Promise<EditableRuntimeConfig | null> {
  await ensureD1Schema(database);
  const row = await database
    .prepare(
      "SELECT payload FROM lifefork_runtime_config WHERE id = ? LIMIT 1",
    )
    .bind("global")
    .first<{ payload?: unknown }>();
  if (!row || typeof row.payload !== "string") return null;
  const parsed = runtimeConfigSchema.safeParse(JSON.parse(row.payload));
  return parsed.success ? parsed.data : null;
}

async function writeD1Config(
  database: D1DatabaseLike,
  config: EditableRuntimeConfig,
) {
  await ensureD1Schema(database);
  await database
    .prepare(
      `INSERT INTO lifefork_runtime_config (id, payload, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         payload = excluded.payload,
         updated_at = excluded.updated_at`,
    )
    .bind("global", JSON.stringify(config), config.updatedAt)
    .run();
}

function configPath() {
  return (
    readServerEnvironment("LIFEFORK_CONFIG_PATH") ||
    path.join(
      /* turbopackIgnore: true */ process.cwd(),
      "data",
      "runtime-config.json",
    )
  );
}

function serviceStatus(): PublicRuntimeConfig["service"] {
  const environment = cloudflareEnvironment();
  const readEnvironment = (key: string) => {
    const workerValue = environment?.[key];
    return typeof workerValue === "string"
      ? workerValue
      : readServerEnvironment(key);
  };
  const configuredProvider = readEnvironment("LIFEFORK_AI_PROVIDER");
  const provider =
    configuredProvider === "openai" || configuredProvider === "deepseek"
      ? configuredProvider
      : readEnvironment("OPENAI_API_KEY")
        ? "openai"
        : readEnvironment("DEEPSEEK_API_KEY")
          ? "deepseek"
          : "none";
  return {
    aiConfigured:
      readEnvironment("LIFEFORK_AI_ENABLED") === "true" &&
      ((provider === "openai" && Boolean(readEnvironment("OPENAI_API_KEY"))) ||
        (provider === "deepseek" &&
          Boolean(readEnvironment("DEEPSEEK_API_KEY")))),
    provider,
  };
}

function withService(config: EditableRuntimeConfig): PublicRuntimeConfig {
  return { ...config, service: serviceStatus() };
}

export async function getRuntimeConfig(): Promise<PublicRuntimeConfig> {
  const defaults = createDefaultRuntimeConfig();
  const database = cloudflareDatabase();
  if (database) {
    try {
      const stored = await readD1Config(database);
      return withService(stored ?? defaults);
    } catch {
      return { ...defaults, service: serviceStatus() };
    }
  }

  try {
    const file = configPath();
    const raw = await fs.readFile(/* turbopackIgnore: true */ file, "utf8");
    const parsed = runtimeConfigSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return { ...defaults, service: serviceStatus() };
    return withService(parsed.data);
  } catch {
    return { ...defaults, service: serviceStatus() };
  }
}

export async function updateRuntimeConfig(
  input: unknown,
): Promise<PublicRuntimeConfig> {
  const candidate =
    typeof input === "object" && input
      ? {
          ...(input as Record<string, unknown>),
          version: "public-runtime.v1",
          updatedAt: new Date().toISOString(),
        }
      : input;
  const parsed = runtimeConfigSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "配置格式无效");
  }

  const database = cloudflareDatabase();
  if (database) {
    await writeD1Config(database, parsed.data);
    return withService(parsed.data);
  }

  const file = configPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporaryFile = `${file}.${process.pid}.tmp`;
  await fs.writeFile(temporaryFile, JSON.stringify(parsed.data, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
  await fs.rename(temporaryFile, file);
  return withService(parsed.data);
}
