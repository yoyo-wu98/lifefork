import type { ForkPath, LifeScale, LifeTimeRange } from "@/lib/types";
import { containsTimeRange, hasVerifiableTimeRange } from "@/lib/selfSkill/timeRangeRules";

export type ForkHierarchyViolationCode =
  | "missing-time-range"
  | "invalid-time-range"
  | "parent-id-mismatch"
  | "time-range-outside-parent"
  | "unstable-order-index"
  | "illegal-scale-attachment";

export interface ForkHierarchyViolation {
  code: ForkHierarchyViolationCode;
  pathId: string;
  parentId?: string;
  expectedParentId?: string;
  orderIndex?: number;
  expectedOrderIndex?: number;
  route: string[];
  message: string;
  details?: {
    childRange?: LifeTimeRange;
    parentRange?: LifeTimeRange;
    childScale?: LifeScale;
    parentScale?: LifeScale;
  };
}

export interface ForkHierarchyValidationResult {
  valid: boolean;
  violations: ForkHierarchyViolation[];
}

const labelForRoute = (path: ForkPath) => path.timeSpan?.durationLabel ?? path.title.split("：")[0] ?? path.id;

function isIllegalScaleAttachment(parent: ForkPath, child: ForkPath) {
  if (parent.scale === "life" && (child.scale === "week" || child.scale === "day" || child.scale === "hour")) return true;
  return false;
}

function visitNode(
  path: ForkPath,
  parent: ForkPath | undefined,
  siblingIndex: number,
  route: string[],
  violations: ForkHierarchyViolation[],
) {
  const expectedParentId = parent?.id;
  const nextRoute = [...route, labelForRoute(path)];
  const range = path.timeSpan?.range;

  if (path.parentId !== expectedParentId) {
    violations.push({
      code: "parent-id-mismatch",
      pathId: path.id,
      parentId: path.parentId,
      expectedParentId,
      route: nextRoute,
      message: `ForkPath ${path.id} declares parentId ${path.parentId ?? "undefined"} but is nested under ${expectedParentId ?? "root"}.`,
    });
  }

  if (path.orderIndex !== siblingIndex) {
    violations.push({
      code: "unstable-order-index",
      pathId: path.id,
      parentId: path.parentId,
      orderIndex: path.orderIndex,
      expectedOrderIndex: siblingIndex,
      route: nextRoute,
      message: `ForkPath ${path.id} orderIndex must be stable at ${siblingIndex}.`,
    });
  }

  if (!range) {
    violations.push({
      code: "missing-time-range",
      pathId: path.id,
      parentId: path.parentId,
      route: nextRoute,
      message: `ForkPath ${path.id} is missing timeSpan.range.`,
    });
  } else if (!hasVerifiableTimeRange(path)) {
    violations.push({
      code: "invalid-time-range",
      pathId: path.id,
      parentId: path.parentId,
      route: nextRoute,
      message: `ForkPath ${path.id} has an invalid timeSpan.range.`,
      details: { childRange: range, childScale: path.scale },
    });
  }

  if (parent && isIllegalScaleAttachment(parent, path)) {
    violations.push({
      code: "illegal-scale-attachment",
      pathId: path.id,
      parentId: parent.id,
      route: nextRoute,
      message: `ForkPath ${path.id} with scale ${path.scale} cannot attach directly to life-level parent ${parent.id}.`,
      details: { childRange: range, parentRange: parent.timeSpan?.range, childScale: path.scale, parentScale: parent.scale },
    });
  }

  if (parent && range && parent.timeSpan?.range && !containsTimeRange(parent.timeSpan.range, range)) {
    violations.push({
      code: "time-range-outside-parent",
      pathId: path.id,
      parentId: parent.id,
      route: nextRoute,
      message: `ForkPath ${path.id} time range must fall inside parent ${parent.id}.`,
      details: { childRange: range, parentRange: parent.timeSpan.range, childScale: path.scale, parentScale: parent.scale },
    });
  }

  path.children?.forEach((child, index) => visitNode(child, path, index, nextRoute, violations));
}

export function validateForkHierarchy(paths: ForkPath[]): ForkHierarchyValidationResult {
  const violations: ForkHierarchyViolation[] = [];
  paths.forEach((path, index) => visitNode(path, undefined, index, ["现在"], violations));
  return { valid: violations.length === 0, violations };
}
