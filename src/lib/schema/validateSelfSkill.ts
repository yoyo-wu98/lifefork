import type { ForkPath, SelfSkill } from "@/lib/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasString(value: Record<string, unknown>, key: string): boolean {
  return typeof value[key] === "string";
}

function isForkPath(value: unknown): value is ForkPath {
  if (!isRecord(value)) return false;
  return hasString(value, "id") && hasString(value, "title") && Array.isArray(value.gains) && Array.isArray(value.costs);
}

export function validateSelfSkill(value: unknown): value is SelfSkill {
  if (!isRecord(value)) return false;
  if (!hasString(value, "id") || !hasString(value, "createdAt")) return false;
  if (!isRecord(value.questions) || !hasString(value.questions, "currentChoice")) return false;
  if (!isRecord(value.identity) || !isRecord(value.voice) || !isRecord(value.semantic) || !isRecord(value.decision)) return false;
  if (!Array.isArray(value.timeline) || !Array.isArray(value.evidence) || !Array.isArray(value.claims)) return false;
  if (!Array.isArray(value.forks) || !value.forks.every(isForkPath)) return false;
  return true;
}
