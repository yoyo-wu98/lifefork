import type { Consequence, ForkPath, LifeStateVector } from "@/lib/types";

export function buildStateConsequences(stateVector: LifeStateVector): Consequence[] {
  return [
    { label: "自主感", delta: { autonomy: stateVector.autonomy - 50 } },
    { label: "稳定性", delta: { stability: stateVector.stability - 50 } },
    { label: "创造表达", delta: { creation: stateVector.creation - 50 } },
    { label: "不确定性", delta: { uncertainty: stateVector.uncertainty - 50 } },
  ];
}

export function withStateConsequences(path: ForkPath): ForkPath {
  if (path.consequences || !path.stateVector) return path;
  return { ...path, consequences: buildStateConsequences(path.stateVector) };
}

export function clampStateVector(stateVector: LifeStateVector): LifeStateVector {
  return Object.fromEntries(
    Object.entries(stateVector).map(([key, value]) => [key, Math.max(0, Math.min(100, value))]),
  ) as unknown as LifeStateVector;
}
