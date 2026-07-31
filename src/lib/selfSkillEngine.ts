export { generateSelfSkill, type GenerateSelfSkillOptions } from "@/lib/selfSkill/localGenerator";
export { buildLifeForks, buildLifeSimulationMap, buildSimpleForks } from "@/lib/selfSkill/forkTreeRules";
export { validateForkHierarchy, type ForkHierarchyValidationResult, type ForkHierarchyViolation } from "@/lib/selfSkill/containmentValidation";
export { lifeMapTeamFixture, qaExpectedHierarchyViolations, validForkContainmentExamples, invalidForkContainmentExamples } from "@/lib/selfSkill/containmentFixtures";
