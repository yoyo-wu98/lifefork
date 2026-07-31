import type { ForkPath, GenerateSelfSkillInput, SelfSkill } from "@/lib/types";
import { CONTENT_SYSTEM_OWNER } from "@/lib/content/copyRegistry";
import { buildDynamicTypeProfile } from "@/lib/selfSkill/dynamicTypeRules";
import { buildLifeSimulationMap } from "@/lib/selfSkillEngine";
import { hasVerifiableTimeRange, scaleForTimeRange } from "@/lib/selfSkill/timeRangeRules";

export function flattenForks(paths: ForkPath[]): ForkPath[] {
  return paths.flatMap((path) => [path, ...flattenForks(path.children ?? [])]);
}

function hasModernForkShape(path: ForkPath): boolean {
  return Boolean(
    path.scale &&
      path.mapRole &&
      path.timeSpan &&
      typeof path.orderIndex === "number" &&
      typeof path.durationMonths === "number" &&
      typeof path.timeSpan.durationMonths === "number" &&
      path.displayScale &&
      path.containmentRole &&
      hasVerifiableTimeRange(path) &&
      scaleForTimeRange(path.timeSpan.range) === path.scale &&
      path.content?.owner === CONTENT_SYSTEM_OWNER &&
      path.dynamicType?.currentTypeTendency &&
      !path.id.startsWith("node-"),
  );
}

function inputFromSkill(skill: SelfSkill): GenerateSelfSkillInput {
  return {
    selectedVersion: skill.selectedVersion,
    currentChoice: skill.questions.currentChoice,
    recurringEmotion: skill.questions.recurringEmotion,
    pastNode: skill.questions.pastNode,
    hiddenSelf: skill.questions.hiddenSelf,
    futureSentence: skill.questions.futureSentence,
    extraText: skill.extraText,
    wechatAnalysis: skill.wechatAnalysis,
  };
}

export function repairForkTree(skill: SelfSkill): SelfSkill {
  const forks = Array.isArray(skill.forks) ? skill.forks : [];
  const needsRepair = !forks.length || flattenForks(forks).some((path) => !hasModernForkShape(path));
  const evidenceIds = skill.evidence.map((item) => item.id);
  const repairedForks = needsRepair ? buildLifeSimulationMap(skill.questions?.currentChoice ?? "", evidenceIds) : forks;
  const dynamicTypeProfile = skill.dynamicTypeProfile ?? buildDynamicTypeProfile(inputFromSkill(skill), skill.evidence, repairedForks);

  if (!needsRepair && skill.dynamicTypeProfile) return skill;

  return {
    ...skill,
    version: "v0.5",
    dynamicTypeProfile,
    forks: repairedForks,
  };
}
