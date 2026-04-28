import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/ai/client";
import {
  DIALOGUE_SYSTEM_PROMPT,
  buildDialogueUserPrompt,
} from "@/lib/ai/prompts";
import { containsCrisisSignal, safetyMessage } from "@/lib/safety";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      selfSkillSummary,
      forkTitle,
      forkSummary,
      forkScale,
      forkGains = [],
      forkCosts = [],
      forkFutureSelfVoice,
      voiceProfile,
      conversationHistory,
      userMessage,
    } = body;

    // Safety check: intercept crisis signals
    if (containsCrisisSignal(userMessage ?? "")) {
      return NextResponse.json({
        success: true,
        data: { reply: safetyMessage, safetyIntercept: true },
      });
    }

    // Build the prompt
    const dialoguePrompt = buildDialogueUserPrompt({
      selfSkillSummary: selfSkillSummary ?? "",
      forkTitle: forkTitle ?? "",
      forkSummary: forkSummary ?? "",
      forkScale: forkScale ?? "当前",
      forkGains,
      forkCosts,
      forkFutureSelfVoice: forkFutureSelfVoice ?? "",
      voiceProfile: voiceProfile ?? "",
      conversationHistory: conversationHistory ?? "",
      userMessage: userMessage ?? "",
    });

    // Call DeepSeek
    const response = await chatCompletion(
      [
        { role: "system", content: DIALOGUE_SYSTEM_PROMPT },
        { role: "user", content: dialoguePrompt },
      ],
      { temperature: 0.7, maxTokens: 600 },
    );

    return NextResponse.json({
      success: true,
      data: { reply: response.content, safetyIntercept: false },
      usage: response.usage,
    });
  } catch (error) {
    console.error("chat error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
