import { NextRequest, NextResponse } from "next/server";
import { chatCompletionJSON } from "@/lib/ai/client";
import {
  WECHAT_ANALYSIS_SYSTEM_PROMPT,
  WECHAT_PROMPT_VERSION,
  buildWechatAnalysisUserPrompt,
} from "@/lib/ai/prompts";
import { AI_TOKEN_BUDGETS } from "@/lib/ai/tokenBudget";
import { parseWechatAnalyzeRequest, readJsonRequest } from "@/lib/ai/schemas/requestSchemas";
import { wechatResponseSchema, type WechatLLMAnalysis } from "@/lib/ai/schemas/wechatResponse";
import { finalizePublicApiResponse, guardPublicApi } from "@/lib/server/apiGuard";
import { getRuntimeConfig } from "@/lib/server/runtimeConfigStore";

function localWechatFallback(localSummary: string): WechatLLMAnalysis {
  return {
    recurringTopics: [],
    emotionalSignals: [],
    keyThemes: [],
    relationshipDynamics: "",
    selfSkillSignals: [],
    suggestedSelfSkillText: localSummary.slice(0, 200),
  };
}

function sanitizeLocalSummary(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/1[3-9]\d{9}/g, "[phone]")
    .replace(/https?:\/\/\S+/g, "[link]");
}

export async function POST(request: NextRequest) {
  const { guard, blocked } = guardPublicApi(request, {
    bucket: "wechat-analysis",
    limit: 4,
  });
  if (blocked) return blocked;

  const respond = (body: unknown, status = 200) =>
    finalizePublicApiResponse(NextResponse.json(body, { status }), guard);

  try {
    const runtimeConfig = await getRuntimeConfig();
    if (
      runtimeConfig.status === "maintenance" ||
      !runtimeConfig.features.wechatImport
    ) {
      return respond(
        {
          success: false,
          error:
            runtimeConfig.status === "maintenance"
              ? "服务正在维护，请稍后再试。"
              : "微信导入当前已关闭。",
        },
        503,
      );
    }

    const json = await readJsonRequest(request, 180_000);
    if (!json.success) {
      return respond(
        {
          success: false,
          error: json.error,
          meta: {
            llmUsed: false,
            fallbackReason: "invalid_request",
            promptVersion: WECHAT_PROMPT_VERSION,
          },
        },
        400,
      );
    }

    const parsed = parseWechatAnalyzeRequest(json.data);
    if (!parsed.success) {
      return respond(
        {
          success: false,
          error: parsed.error,
          meta: {
            llmUsed: false,
            fallbackReason: "invalid_request",
            promptVersion: WECHAT_PROMPT_VERSION,
          },
        },
        400,
      );
    }

    const localSummary = sanitizeLocalSummary(parsed.data.localSummary);
    const userPrompt = buildWechatAnalysisUserPrompt(localSummary);

    const startedAt = Date.now();
    const response = await chatCompletionJSON<WechatLLMAnalysis>(
      [
        { role: "system", content: WECHAT_ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      {
        temperature: 0.3,
        maxTokens: AI_TOKEN_BUDGETS.wechat.maxOutputTokens,
        reasoningEffort: "low",
        safetyIdentifier: guard.session.safetyIdentifier,
        enabled:
          runtimeConfig.features.ai && runtimeConfig.service.aiConfigured,
      },
      wechatResponseSchema,
    );

    return respond({
      success: true,
      data: response.data ?? localWechatFallback(localSummary),
      meta: {
        ...response.meta,
        llmUsed: !!response.data,
        fallbackReason: response.data ? undefined : response.meta.fallbackReason ?? "local_summary",
        promptVersion: WECHAT_PROMPT_VERSION,
        durationMs: Date.now() - startedAt,
        tokenUsage: response.usage,
      },
      usage: response.usage,
    });
  } catch (error) {
    console.error("wechat-analyze error:", error);
    return respond(
      {
        success: false,
        error: "Failed to analyze WeChat summary",
        meta: {
          llmUsed: false,
          fallbackReason: "route_error",
          promptVersion: WECHAT_PROMPT_VERSION,
        },
      },
      500,
    );
  }
}
