import type { SelfSkill, ForkPath, LifeLane } from "@/lib/types";
import type { LayoutNode, LayoutLink, LayoutFrame, LayoutBounds, NodeOffset } from "./types";
import {
  ROOT_NODE_ID, ROOT_FRAME, PAD_X, PAD_Y,
  MAP_CENTER, TIMELINE_Y, CANVAS_WIDTH, CANVAS_HEIGHT,
  HISTORY_GAP_X, HISTORY_LANE_Y,
  scaleOrder, scaleMeta, scaleFrameByScale, nestedAreaByScale,
  frameByScale,
} from "./constants";
import {
  getFrameSize, getNodeMarker, scaleRank,
  nodeBounds, mergeBounds,
} from "./utils";

// ── Layout positioning helpers ────────────────────────────────────────

const CHILD_GAP_X = 150;
const CHILD_GAP_Y = 92;
const CONTAINER_PAD_X = 58;
const CONTAINER_PAD_Y = 54;
const TOP_LEVEL_GAP_Y = 180;

type SubtreePlan = {
  path: ForkPath;
  width: number;
  height: number;
  cardWidth: number;
  cardHeight: number;
  children: SubtreePlan[];
};

function measurePath(path: ForkPath, depth = 1): SubtreePlan {
  const frame = getFrameSize(path.scale);
  const children = (path.children ?? []).map((child) => measurePath(child, depth + 1));
  const base = nestedAreaByScale[path.scale ?? "life"];
  const depthShrink = Math.max(0.72, 1 - depth * 0.035);
  const baseWidth = base.width * depthShrink;
  const baseHeight = base.height * depthShrink;

  if (!children.length) {
    return {
      path,
      width: frame.width,
      height: frame.height,
      cardWidth: frame.width,
      cardHeight: frame.height,
      children,
    };
  }

  const childStackHeight = children.reduce((total, child, index) => total + child.height + (index > 0 ? CHILD_GAP_Y : 0), 0);
  const childMaxWidth = Math.max(...children.map((child) => child.width));
  const width = Math.max(baseWidth, CONTAINER_PAD_X * 2 + frame.width + CHILD_GAP_X + childMaxWidth);
  const height = Math.max(baseHeight, CONTAINER_PAD_Y * 2 + Math.max(frame.height, childStackHeight));

  return {
    path,
    width,
    height,
    cardWidth: frame.width,
    cardHeight: frame.height,
    children,
  };
}

function assignPlan(
  plan: SubtreePlan,
  x: number,
  y: number,
  inheritedLane?: LifeLane,
): LayoutNode {
  const path = plan.path;
  const lane = path.lane ?? inheritedLane ?? "experiment";
  const hasChildren = plan.children.length > 0;
  const cardX = hasChildren ? x + CONTAINER_PAD_X : x;
  const cardY = hasChildren ? y + plan.height / 2 - plan.cardHeight / 2 : y;

  const node: LayoutNode = {
    id: path.id,
    title: path.title,
    subtitle: path.subtitle,
    marker: getNodeMarker(path),
    scale: path.scale,
    lane: path.lane,
    x: cardX - PAD_X,
    y: cardY - PAD_Y,
    width: plan.cardWidth,
    height: plan.cardHeight,
    container: hasChildren ? { x, y, width: plan.width, height: plan.height } : undefined,
    path,
    children: [],
  };

  if (hasChildren) {
    const childStackHeight = plan.children.reduce((total, child, index) => total + child.height + (index > 0 ? CHILD_GAP_Y : 0), 0);
    const childX = x + CONTAINER_PAD_X + plan.cardWidth + CHILD_GAP_X;
    let childY = y + (plan.height - childStackHeight) / 2;

    node.children = plan.children.map((childPlan) => {
      const childNode = assignPlan(childPlan, childX, childY, lane);
      childY += childPlan.height + CHILD_GAP_Y;
      return childNode;
    });
  }

  return node;
}

// ── Node tree construction ────────────────────────────────────────────

export function toFutureLayoutNode(
  path: ForkPath,
  x: number,
  y: number,
  inheritedLane?: LifeLane,
): LayoutNode {
  return assignPlan(measurePath(path), x, y, inheritedLane);
}

export function toHistoryLayoutNode(path: ForkPath, index: number, total: number): LayoutNode {
  const frame = getFrameSize(path.scale);
  const centerX = MAP_CENTER.x - (total - index) * HISTORY_GAP_X;
  const centerY = TIMELINE_Y + HISTORY_LANE_Y[index % HISTORY_LANE_Y.length];

  return {
    id: path.id,
    title: path.title,
    subtitle: path.subtitle,
    marker: getNodeMarker(path),
    scale: path.scale,
    x: centerX - frame.width / 2,
    y: centerY - frame.height / 2,
    width: frame.width,
    height: frame.height,
    path,
    children: [],
  };
}

// ── Main layout builder ───────────────────────────────────────────────

export function buildMapLayout(
  selfSkill: SelfSkill,
  currentPath: ForkPath,
  historyPaths: ForkPath[],
  nodeOffsets: Record<string, NodeOffset>,
) {
  const futurePlans = selfSkill.forks.map((path) => measurePath(path));
  const futureStackHeight = futurePlans.reduce((total, plan, index) => total + plan.height + (index > 0 ? TOP_LEVEL_GAP_Y : 0), 0);
  const futureX = MAP_CENTER.x + 470;
  let futureY = TIMELINE_Y - futureStackHeight / 2;

  const root: LayoutNode = {
    id: ROOT_NODE_ID,
    title: "现在的生活点",
    subtitle: selfSkill.questions.currentChoice || "当前选择",
    marker: "Root · Now",
    x: MAP_CENTER.x - ROOT_FRAME.width / 2,
    y: TIMELINE_Y - ROOT_FRAME.height / 2,
    width: ROOT_FRAME.width,
    height: ROOT_FRAME.height,
    path: currentPath,
    children: futurePlans.map((plan) => {
      const node = assignPlan(plan, futureX, futureY);
      futureY += plan.height + TOP_LEVEL_GAP_Y;
      return node;
    }),
  };
  const historyNodes = historyPaths.map((path, index) =>
    toHistoryLayoutNode(path, index, historyPaths.length),
  );

  const applyOffsets = (node: LayoutNode, inherited: NodeOffset) => {
    const own = nodeOffsets[node.id] ?? { x: 0, y: 0 };
    const combined = { x: inherited.x + own.x, y: inherited.y + own.y };
    node.x += combined.x;
    node.y += combined.y;
    if (node.container) {
      node.container.x += combined.x;
      node.container.y += combined.y;
    }
    node.children.forEach((child) => applyOffsets(child, combined));
  };

  historyNodes.forEach((node) => applyOffsets(node, { x: 0, y: 0 }));
  applyOffsets(root, { x: 0, y: 0 });

  const refreshContainers = (node: LayoutNode): LayoutBounds | undefined => {
    const childBounds = node.children.map(refreshContainers);
    if (!node.container) return nodeBounds(node);

    const bounds = mergeBounds([node.container, nodeBounds(node), ...childBounds]);
    if (bounds) {
      const padding = Math.max(28, frameByScale[node.scale ?? "life"].padding * 0.72);
      node.container = {
        x: bounds.x - padding,
        y: bounds.y - padding,
        width: bounds.width + padding * 2,
        height: bounds.height + padding * 2,
      };
    }

    return node.container;
  };

  refreshContainers(root);

  const nodes: LayoutNode[] = [];
  const links: LayoutLink[] = [];
  const frames: LayoutFrame[] = [];

  historyNodes.forEach((node, index) => {
    nodes.push(node);
    if (index > 0) links.push({ from: historyNodes[index - 1], to: node });
  });
  const lastHistoryNode = historyNodes[historyNodes.length - 1];
  if (lastHistoryNode) links.push({ from: lastHistoryNode, to: root });

  const collect = (node: LayoutNode) => {
    nodes.push(node);
    node.children.forEach((child) => {
      links.push({ from: node, to: child });
      collect(child);
    });
  };

  collect(root);

  scaleOrder.forEach((scale) => {
    const rank = scaleRank(scale);
    const frameBase = scaleFrameByScale[scale];
    const defaultBounds: LayoutBounds = {
      x: MAP_CENTER.x - frameBase.width * 0.42,
      y: TIMELINE_Y - frameBase.height / 2,
      width: frameBase.width,
      height: frameBase.height,
    };
    const containedNodes = nodes.filter((node) => {
      if (node.id === ROOT_NODE_ID) return true;
      if (!node.path?.scale) return false;
      const nodeRank = scaleRank(node.path.scale);
      return nodeRank >= rank && nodeRank <= rank + 1;
    });
    const bounds =
      mergeBounds([defaultBounds, ...containedNodes.map(nodeBounds)]) ?? defaultBounds;
    const padding = frameBase.padding;

    frames.push({
      id: `scale-frame-${scale}`,
      title: scaleMeta[scale].label,
      label: `${scaleMeta[scale].label}时间容器`,
      scale,
      x: bounds.x - padding,
      y: bounds.y - padding,
      width: bounds.width + padding * 2,
      height: bounds.height + padding * 2,
      childCount: containedNodes.length,
    });
  });

  const containers = nodes
    .map((node) => node.container)
    .filter((bounds): bounds is LayoutBounds => Boolean(bounds));

  const minX = Math.min(
    0,
    ...frames.map((frame) => frame.x),
    ...containers.map((container) => container.x),
    ...nodes.map((node) => node.x + PAD_X),
  );
  const minY = Math.min(
    0,
    ...frames.map((frame) => frame.y),
    ...containers.map((container) => container.y),
    ...nodes.map((node) => node.y + PAD_Y),
  );
  const maxX = Math.max(
    CANVAS_WIDTH,
    ...nodes.map((node) => node.x + node.width),
    ...containers.map((container) => container.x + container.width),
    ...frames.map((frame) => frame.x + frame.width),
  );
  const maxY = Math.max(
    CANVAS_HEIGHT,
    ...nodes.map((node) => node.y + node.height),
    ...containers.map((container) => container.y + container.height),
    ...frames.map((frame) => frame.y + frame.height),
  );

  return {
    nodes,
    links,
    frames,
    width: maxX - minX + PAD_X * 2,
    height: maxY - minY + PAD_Y * 2,
  };
}
