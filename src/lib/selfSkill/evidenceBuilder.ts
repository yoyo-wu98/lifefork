import type { Claim, Evidence, GenerateSelfSkillInput } from "@/lib/types";

type IdFactory = () => string;

export function buildEvidence(input: GenerateSelfSkillInput, nextId: IdFactory): Evidence[] {
  const evidence: Evidence[] = [
    { id: nextId(), source: "question", quote: `来自你的回答：「${input.currentChoice.slice(0, 48)}」` },
    { id: nextId(), source: "question", quote: `来自你的回答：「${input.hiddenSelf.slice(0, 48)}」` },
    {
      id: nextId(),
      source: input.extraText ? "extra_text" : "generated",
      quote: input.extraText
        ? `来自你粘贴的文字：「${input.extraText.slice(0, 48)}」`
        : "系统推断：你希望把当前问题转化为可以执行和验证的方案。",
    },
  ];

  if (input.wechatAnalysis) {
    evidence.push({
      id: nextId(),
      source: "wechat",
      quote: `来自微信记录分析：「${input.wechatAnalysis.summary.slice(0, 80)}」`,
    });
  }

  return evidence;
}

export function buildClaims(input: GenerateSelfSkillInput, values: string[], evidence: Evidence[], nextId: IdFactory): Claim[] {
  const claims: Claim[] = [
    {
      id: nextId(),
      text: `你当前主要在比较「${values[0]}」和「${values[1] ?? "安全感"}」两类需求。`,
      confidence: 0.78,
      evidenceIds: evidence.slice(0, 2).map((item) => item.id),
    },
    {
      id: nextId(),
      text: "目前信息不足以支持一次性做出最终决定，更适合先设定一个有期限的验证方案。",
      confidence: 0.84,
      evidenceIds: evidence.map((item) => item.id),
    },
  ];

  if (input.wechatAnalysis) {
    const wechatEvidenceIds = evidence.filter((item) => item.source === "wechat").map((item) => item.id);
    claims.push({
      id: nextId(),
      text: `微信聊天记录补充显示，你的反复主题包含 ${input.wechatAnalysis.recurringTopics.slice(0, 3).join("、") || "关系、情绪与选择"}。`,
      confidence: 0.72,
      evidenceIds: wechatEvidenceIds.length ? wechatEvidenceIds : evidence.filter((item) => item.source === "generated").map((item) => item.id),
    });
  }

  return claims;
}

export function validateClaimEvidence(claims: Claim[], evidence: Evidence[]): Claim[] {
  const evidenceIds = new Set(evidence.map((item) => item.id));
  const generatedEvidenceId = evidence.find((item) => item.source === "generated")?.id;

  return claims.map((claim) => {
    const validEvidenceIds = claim.evidenceIds.filter((id) => evidenceIds.has(id));
    if (validEvidenceIds.length || !generatedEvidenceId) return { ...claim, evidenceIds: validEvidenceIds };
    return { ...claim, evidenceIds: [generatedEvidenceId] };
  });
}
