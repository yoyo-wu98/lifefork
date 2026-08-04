import { NextRequest, NextResponse } from "next/server";
import { chatCompletionJSON } from "@/lib/ai/client";
import {
  DIALOGUE_PROMPT_VERSION,
  DIALOGUE_SYSTEM_PROMPT,
  buildDialogueUserPrompt,
} from "@/lib/ai/prompts";
import { AI_TOKEN_BUDGETS } from "@/lib/ai/tokenBudget";
import { chatResponseSchema, type ChatLLMResponse } from "@/lib/ai/schemas/chatResponse";
import { parseChatRequest, readJsonRequest } from "@/lib/ai/schemas/requestSchemas";
import { containsCrisisSignal, safetyMessage } from "@/lib/safety";
import { finalizePublicApiResponse, guardPublicApi } from "@/lib/server/apiGuard";
import { getRuntimeConfig } from "@/lib/server/runtimeConfigStore";

function localDialogueFallback(message: string): string {
  if (/(后悔)/.test(message)) {
    return "这个方案仍然可能带来遗憾。先确认损失是否可承受，以及你能从中获得哪些可用于下一次判断的信息。";
  }
  if (/(失去|代价|成本)/.test(message)) {
    return "请分别列出短期成本和长期成本，包括时间、收入、关系、健康和退出难度。";
  }
  if (/(提醒|建议|注意|确认|一步开始|第一步|开始)/.test(message)) {
    return "先设定一个有期限、有投入上限、有完成标准的小规模测试，再根据结果决定是否继续。";
  }
  return "先写清楚你要比较的选项、最重要的判断标准和可接受的风险。信息不足的部分可以通过小规模测试补充。";
}

function compactReply(reply: string, maxChars = 180): string {
  const clean = reply.replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean;
  const candidate = clean.slice(0, maxChars);
  const boundary = Math.max(
    candidate.lastIndexOf("。"),
    candidate.lastIndexOf("！"),
    candidate.lastIndexOf("？"),
    candidate.lastIndexOf("；"),
  );
  return boundary >= 100 ? candidate.slice(0, boundary + 1) : `${candidate.slice(0, maxChars - 1)}…`;
}

export async function POST(request: NextRequest) {
  const { guard, blocked } = guardPublicApi(request, {
    bucket: "instance-chat",
    limit: 40,
  });
  if (blocked) return blocked;

  const respond = (body: unknown, status = 200) =>
    finalizePublicApiResponse(NextResponse.json(body, { status }), guard);

  try {
    const runtimeConfig = await getRuntimeConfig();
    if (runtimeConfig.status === "maintenance") {
      return respond(
        { success: false, error: "服务正在维护，请稍后再试。" },
        503,
      );
    }

    const json = await readJsonRequest(request, 120_000);
    if (!json.success) {
      return respond(
        {
          success: false,
          error: json.error,
          meta: {
            llmUsed: false,
            fallbackReason: "invalid_request",
            promptVersion: DIALOGUE_PROMPT_VERSION,
          },
        },
        400,
      );
    }

    const parsed = parseChatRequest(json.data);
    if (!parsed.success) {
      return respond(
        {
          success: false,
          error: parsed.error,
          meta: {
            llmUsed: false,
            fallbackReason: "invalid_request",
            promptVersion: DIALOGUE_PROMPT_VERSION,
          },
        },
        400,
      );
    }

    const {
      selfSkillSummary,
      forkTitle,
      forkSummary,
      forkScale,
      forkGains,
      forkCosts,
      forkFutureSelfVoice,
      voiceProfile,
      stageVoice,
      calibrationNotes,
      conversationHistory,
      userMessage,
    } = parsed.data;

    if (containsCrisisSignal(userMessage)) {
      return respond({
        success: true,
        data: { reply: safetyMessage, safetyIntercept: true },
        meta: {
          llmUsed: false,
          fallbackReason: "safety_intercept",
          promptVersion: DIALOGUE_PROMPT_VERSION,
        },
      });
    }

    const dialoguePrompt = buildDialogueUserPrompt({
      selfSkillSummary,
      forkTitle,
      forkSummary,
      forkScale,
      forkGains,
      forkCosts,
      forkFutureSelfVoice,
      voiceProfile,
      stageVoice,
      calibrationNotes,
      conversationHistory,
      userMessage,
    });

    const startedAt = Date.now();
    const response = await chatCompletionJSON<ChatLLMResponse>(
      [
        { role: "system", content: DIALOGUE_SYSTEM_PROMPT },
        { role: "user", content: dialoguePrompt },
      ],
      {
        temperature: 0.7,
        maxTokens: AI_TOKEN_BUDGETS.dialogue.maxOutputTokens,
        reasoningEffort: "low",
        safetyIdentifier: guard.session.safetyIdentifier,
        enabled:
          runtimeConfig.features.ai && runtimeConfig.service.aiConfigured,
      },
      chatResponseSchema,
    );

    return respond({
      success: true,
      data: {
        reply: compactReply(
          response.data?.reply ?? localDialogueFallback(userMessage),
        ),
        safetyIntercept: false,
      },
      meta: {
        ...response.meta,
        llmUsed: !!response.data,
        fallbackReason: response.data ? undefined : response.meta.fallbackReason ?? "local_dialogue",
        promptVersion: DIALOGUE_PROMPT_VERSION,
        durationMs: Date.now() - startedAt,
        tokenUsage: response.usage,
      },
      usage: response.usage,
    });
  } catch (error) {
    console.error("chat error:", error);
    return respond(
      {
        success: false,
        error: "这次回复生成失败，请稍后重试。",
        meta: {
          llmUsed: false,
          fallbackReason: "route_error",
          promptVersion: DIALOGUE_PROMPT_VERSION,
        },
      },
      500,
    );
  }
}
