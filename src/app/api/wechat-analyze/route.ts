import { NextRequest, NextResponse } from "next/server";
import { chatCompletionJSON } from "@/lib/ai/client";
import {
  WECHAT_ANALYSIS_SYSTEM_PROMPT,
  buildWechatAnalysisUserPrompt,
} from "@/lib/ai/prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { localSummary } = body;

    if (!localSummary) {
      return NextResponse.json(
        { success: false, error: "Missing localSummary" },
        { status: 400 },
      );
    }

    const userPrompt = buildWechatAnalysisUserPrompt(localSummary);

    const { data: llmAnalysis } = await chatCompletionJSON<{
      recurringTopics: string[];
      emotionalSignals: string[];
      keyThemes: string[];
      relationshipDynamics: string;
      selfSkillSignals: string[];
      suggestedSelfSkillText: string;
    }>(
      [
        { role: "system", content: WECHAT_ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.3, maxTokens: 1500 },
    );

    return NextResponse.json({
      success: true,
      data: llmAnalysis ?? {
        recurringTopics: [],
        emotionalSignals: [],
        keyThemes: [],
        relationshipDynamics: "",
        selfSkillSignals: [],
        suggestedSelfSkillText: localSummary.slice(0, 200),
      },
    });
  } catch (error) {
    console.error("wechat-analyze error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
