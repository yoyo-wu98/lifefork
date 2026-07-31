import type { SelfSkill } from "@/lib/types";
import { repairForkTree } from "@/lib/schema/repairForkTree";
import { validateSelfSkill } from "@/lib/schema/validateSelfSkill";
import { KNOWN_SELF_SKILL_VERSIONS } from "@/lib/schema/versions";

export function migrateSelfSkill(value: unknown): SelfSkill | null {
  if (!validateSelfSkill(value)) return null;

  const skill = value as SelfSkill;
  const repaired = repairForkTree(skill);

  if (KNOWN_SELF_SKILL_VERSIONS.has(repaired.version)) return repaired;

  return {
    ...repaired,
    version: repaired.version || "v0.3",
  };
}
