import type { ForkPath, LifeLane, LifeScale } from "@/lib/types";
import {
  CONTENT_SYSTEM_OWNER,
  CONTENT_SYSTEM_VERSION,
  LIFE_MAP_DIALOGUE_COPY,
  LIFE_SIMULATION_ROOT_NARRATIVE_COPY,
} from "@/lib/content/copyRegistry";
import type { ContentAttribution, ContentIntent, ContentRiskLevel, ContentTone } from "@/lib/content/types";

export { LIFE_MAP_DIALOGUE_COPY, LIFE_SIMULATION_ROOT_NARRATIVE_COPY } from "@/lib/content/copyRegistry";

const laneTone: Record<LifeLane, ContentTone> = {
  stability: "restrained",
  leap: "direct",
  experiment: "reflective",
  relationship: "warm",
  creation: "narrative",
};

function toneForPath(path: Pick<ForkPath, "lane" | "nodeType">): ContentTone {
  if (path.lane) return laneTone[path.lane];
  if (path.nodeType === "life-map") return "narrative";
  return "reflective";
}

function riskForScale(scale?: LifeScale): ContentRiskLevel {
  if (scale === "life" || scale === "decade" || scale === "era") return "medium";
  return "low";
}

function intentForPath(path: Pick<ForkPath, "mapRole" | "nodeType">): ContentIntent {
  if (path.mapRole === "current") return "frame-choice";
  if (path.nodeType === "life-map") return "simulate-life-path";
  return "dialogue-guidance";
}

export function createLifeMapContentAttribution(path: Pick<ForkPath, "id" | "lane" | "scale" | "mapRole" | "nodeType">): ContentAttribution {
  return {
    id: `lifeMap.node.${path.id}.v1`,
    surface: "life-map",
    intent: intentForPath(path),
    tone: toneForPath(path),
    riskLevel: riskForScale(path.scale),
    owner: CONTENT_SYSTEM_OWNER,
    version: CONTENT_SYSTEM_VERSION,
  };
}

export function rootNarrativeForLane(lane: keyof typeof LIFE_SIMULATION_ROOT_NARRATIVE_COPY.value) {
  return LIFE_SIMULATION_ROOT_NARRATIVE_COPY.value[lane];
}

export function getDialoguePathHint(selectedFork: Pick<ForkPath, "lane">): string {
  const hints = LIFE_MAP_DIALOGUE_COPY.value.pathHints;
  return selectedFork.lane ? hints[selectedFork.lane] : hints.default;
}

export function getDialogueStageHint(selectedFork: Pick<ForkPath, "scale" | "lane">): string {
  const hints = LIFE_MAP_DIALOGUE_COPY.value.stageHints;

  if (selectedFork.scale === "life" || selectedFork.scale === "decade") return hints.longHorizon;
  if (selectedFork.scale === "day" || selectedFork.scale === "hour") return hints.shortHorizon;
  if (selectedFork.lane === "relationship") return hints.relationship;
  if (selectedFork.lane === "leap") return hints.leap;
  return hints.default;
}
