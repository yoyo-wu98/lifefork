/**
 * Server-side AI gateway.
 *
 * Provider keys never reach the browser. The gateway supports OpenAI Responses
 * API and DeepSeek Chat Completions, with the same local fallback contract.
 */

import "server-only";

import type { Schema } from "@/lib/ai/schemas/common";
import {
  readServerEnvironment,
  serverEnvironmentEnabled,
} from "@/lib/server/environment";

const REQUEST_TIMEOUT_MS = 75_000;

export type AIProvider = "openai" | "deepseek";

function configuredProvider(): AIProvider {
  const configured = readServerEnvironment("LIFEFORK_AI_PROVIDER");
  if (configured === "openai" || configured === "deepseek") return configured;
  return readServerEnvironment("OPENAI_API_KEY") ? "openai" : "deepseek";
}

function configuredModel(provider: AIProvider): string {
  return provider === "openai"
    ? readServerEnvironment("OPENAI_MODEL") || "gpt-5.6-terra"
    : readServerEnvironment("DEEPSEEK_MODEL") || "deepseek-chat";
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionOptions {
  enabled?: boolean;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  safetyIdentifier?: string;
  reasoningEffort?: "none" | "low" | "medium" | "high";
}

export interface CompletionResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  meta: LLMCallMeta;
}

export interface LLMCallMeta {
  llmUsed: boolean;
  fallbackReason?: string;
  provider: AIProvider;
  model: string;
  tokenBudget: {
    maxOutputTokens: number;
  };
}

function providerKey(provider: AIProvider): string | undefined {
  return provider === "openai"
    ? readServerEnvironment("OPENAI_API_KEY")
    : readServerEnvironment("DEEPSEEK_API_KEY");
}

function baseMeta(
  provider: AIProvider,
  maxTokens: number,
): Omit<LLMCallMeta, "llmUsed" | "fallbackReason"> {
  return {
    provider,
    model: configuredModel(provider),
    tokenBudget: { maxOutputTokens: maxTokens },
  };
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function parseOpenAIText(data: Record<string, unknown>): string {
  if (typeof data.output_text === "string") return data.output_text;
  if (!Array.isArray(data.output)) return "";

  const parts: string[] = [];
  for (const item of data.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (!block || typeof block !== "object") continue;
      const text = (block as { text?: unknown }).text;
      if (typeof text === "string") parts.push(text);
    }
  }
  return parts.join("\n");
}

async function callOpenAI(
  messages: ChatMessage[],
  options: Required<Pick<CompletionOptions, "maxTokens">> & CompletionOptions,
): Promise<CompletionResponse> {
  const provider: AIProvider = "openai";
  const meta = baseMeta(provider, options.maxTokens);
  const apiKey = providerKey(provider);
  if (!apiKey) {
    return {
      content: "",
      meta: { ...meta, llmUsed: false, fallbackReason: "api_key_missing" },
    };
  }

  const instructions = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");
  const input = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({ role: message.role, content: message.content }));

  const response = await fetchWithTimeout(
    `${readServerEnvironment("OPENAI_BASE_URL") || "https://api.openai.com"}/v1/responses`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: configuredModel(provider),
        instructions,
        input,
        max_output_tokens: options.maxTokens,
        store: false,
        reasoning: {
          effort:
            options.reasoningEffort ??
            (readServerEnvironment(
              "OPENAI_REASONING_EFFORT",
            ) as CompletionOptions["reasoningEffort"]) ??
            "medium",
        },
        text: { verbosity: "low" },
        ...(options.safetyIdentifier
          ? { safety_identifier: options.safetyIdentifier }
          : {}),
      }),
    },
  );

  if (!response.ok) {
    return {
      content: "",
      meta: {
        ...meta,
        llmUsed: false,
        fallbackReason: `provider_error_${response.status}`,
      },
    };
  }

  const data = (await response.json()) as Record<string, unknown>;
  const usage = data.usage as
    | { input_tokens?: number; output_tokens?: number; total_tokens?: number }
    | undefined;

  return {
    content: parseOpenAIText(data),
    usage: usage
      ? {
          promptTokens: usage.input_tokens ?? 0,
          completionTokens: usage.output_tokens ?? 0,
          totalTokens:
            usage.total_tokens ??
            (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
        }
      : undefined,
    meta: { ...meta, llmUsed: true },
  };
}

async function callDeepSeek(
  messages: ChatMessage[],
  options: Required<Pick<CompletionOptions, "maxTokens">> & CompletionOptions,
): Promise<CompletionResponse> {
  const provider: AIProvider = "deepseek";
  const meta = baseMeta(provider, options.maxTokens);
  const apiKey = providerKey(provider);
  if (!apiKey) {
    return {
      content: "",
      meta: { ...meta, llmUsed: false, fallbackReason: "api_key_missing" },
    };
  }

  const response = await fetchWithTimeout(
    `${readServerEnvironment("DEEPSEEK_BASE_URL") || "https://api.deepseek.com"}/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: configuredModel(provider),
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        top_p: options.topP ?? 0.95,
        stream: false,
      }),
    },
  );

  if (!response.ok) {
    return {
      content: "",
      meta: {
        ...meta,
        llmUsed: false,
        fallbackReason: `provider_error_${response.status}`,
      },
    };
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };

  return {
    content: data.choices?.[0]?.message?.content ?? "",
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens ?? 0,
          completionTokens: data.usage.completion_tokens ?? 0,
          totalTokens: data.usage.total_tokens ?? 0,
        }
      : undefined,
    meta: { ...meta, llmUsed: true },
  };
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: CompletionOptions = {},
): Promise<CompletionResponse> {
  const provider = configuredProvider();
  const maxTokens = options.maxTokens ?? 4096;
  const meta = baseMeta(provider, maxTokens);

  if (options.enabled === false) {
    return {
      content: "",
      meta: { ...meta, llmUsed: false, fallbackReason: "client_ai_disabled" },
    };
  }

  if (!serverEnvironmentEnabled("LIFEFORK_AI_ENABLED")) {
    return {
      content: "",
      meta: { ...meta, llmUsed: false, fallbackReason: "remote_ai_disabled" },
    };
  }

  try {
    return provider === "openai"
      ? await callOpenAI(messages, { ...options, maxTokens })
      : await callDeepSeek(messages, { ...options, maxTokens });
  } catch (error) {
    return {
      content: "",
      meta: {
        ...meta,
        llmUsed: false,
        fallbackReason:
          error instanceof Error && error.name === "AbortError"
            ? "provider_timeout"
            : "provider_request_failed",
      },
    };
  }
}

export async function chatCompletionJSON<T>(
  messages: ChatMessage[],
  options: CompletionOptions = {},
  schema?: Schema<T>,
): Promise<{
  data: T | null;
  raw: string;
  usage?: CompletionResponse["usage"];
  meta: LLMCallMeta;
}> {
  const systemMessage: ChatMessage = {
    role: "system",
    content:
      "Return one valid JSON object only. Do not use markdown, code fences, comments, or text outside the JSON object.",
  };

  const response = await chatCompletion([systemMessage, ...messages], {
    ...options,
    temperature: Math.min(options.temperature ?? 0.3, 0.3),
  });

  if (!response.meta.llmUsed) {
    return {
      data: null,
      raw: response.content,
      usage: response.usage,
      meta: response.meta,
    };
  }

  try {
    const jsonString = response.content
      .trim()
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "");
    const parsed = JSON.parse(jsonString) as unknown;
    if (!schema) {
      return {
        data: parsed as T,
        raw: response.content,
        usage: response.usage,
        meta: response.meta,
      };
    }

    const validated = schema.parse(parsed);
    if (!validated.success) {
      return {
        data: null,
        raw: response.content,
        usage: response.usage,
        meta: {
          ...response.meta,
          llmUsed: false,
          fallbackReason: `schema_validation_failed:${schema.name}:${validated.error}`,
        },
      };
    }

    return {
      data: validated.data,
      raw: response.content,
      usage: response.usage,
      meta: response.meta,
    };
  } catch {
    return {
      data: null,
      raw: response.content,
      usage: response.usage,
      meta: {
        ...response.meta,
        llmUsed: false,
        fallbackReason: "non_json_response",
      },
    };
  }
}
