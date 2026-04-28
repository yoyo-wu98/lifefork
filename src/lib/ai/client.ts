/**
 * DeepSeek API Client
 *
 * Server-side only. Never imported in client components.
 * Provides typed interfaces for structured LLM calls.
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface CompletionResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Send a chat completion request to DeepSeek.
 * Returns the assistant's text response.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: CompletionOptions = {},
): Promise<CompletionResponse> {
  const { temperature = 0.7, maxTokens = 4096, topP = 0.95 } = options;

  const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `DeepSeek API error (${response.status}): ${errorBody.slice(0, 500)}`,
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  return {
    content,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  };
}

/**
 * Send a chat completion and parse the response as structured JSON.
 * Falls back gracefully if JSON parsing fails.
 */
export async function chatCompletionJSON<T>(
  messages: ChatMessage[],
  options: CompletionOptions = {},
): Promise<{ data: T | null; raw: string; usage?: CompletionResponse["usage"] }> {
  // Force JSON output via system prompt
  const systemMessage: ChatMessage = {
    role: "system",
    content:
      "You MUST respond with valid JSON only. No markdown, no explanations, no code fences. Just the raw JSON object.",
  };

  const response = await chatCompletion(
    [systemMessage, ...messages],
    { ...options, temperature: Math.min(options.temperature ?? 0.3, 0.3) },
  );

  try {
    // Try to extract JSON from the response
    let jsonStr = response.content.trim();
    // Remove markdown code fences if present
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    const data = JSON.parse(jsonStr) as T;
    return { data, raw: response.content, usage: response.usage };
  } catch {
    // If JSON parsing fails, return null data but preserve raw text
    console.warn("Failed to parse LLM response as JSON:", response.content.slice(0, 200));
    return { data: null, raw: response.content, usage: response.usage };
  }
}
