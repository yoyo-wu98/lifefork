import type { ForkPath, LifeScale } from "@/lib/types";
import { ROOT_NODE_ID, scaleOrder } from "../constants";

export type ScenePoint = { x: number; y: number };

export type SceneRect = ScenePoint & {
  width: number;
  height: number;
};

export type LifeMapOffset = ScenePoint;

export type StableSceneNode = {
  id: string;
  parentId?: string;
  path: ForkPath;
  rank: number;
  depth: number;
  card: SceneRect;
  container: SceneRect;
  childrenIds: string[];
};

export type StableSceneLink = {
  id: string;
  fromId: string;
  toId: string;
  kind: "history" | "future";
};

export type StableLifeMapScene = {
  rootId: string;
  nodes: StableSceneNode[];
  nodeById: Map<string, StableSceneNode>;
  links: StableSceneLink[];
  historyIds: string[];
  futureRootIds: string[];
  overviewBounds: SceneRect;
  worldBounds: SceneRect;
};

const ROOT_CARD = { width: 320, height: 136 };
const HISTORY_CARD = { width: 226, height: 98 };
const FUTURE_GAP_X = 330;
const HISTORY_GAP_X = 64;
const ROOT_X = 1180;
const ROOT_Y = 980;
const BRANCH_GAP_Y = 220;
const CHILD_GAP_X = 148;
const CHILD_GAP_Y = 56;
const CONTAINER_PAD_X = 58;
const CONTAINER_PAD_Y = 54;

const cardSizeByScale: Record<LifeScale, { width: number; height: number }> = {
  life: { width: 360, height: 150 },
  decade: { width: 338, height: 142 },
  era: { width: 322, height: 138 },
  year: { width: 306, height: 132 },
  month: { width: 288, height: 126 },
  week: { width: 270, height: 120 },
  day: { width: 252, height: 114 },
  hour: { width: 236, height: 108 },
};

type SubtreePlan = {
  path: ForkPath;
  cardWidth: number;
  cardHeight: number;
  width: number;
  height: number;
  children: SubtreePlan[];
};

function rankForScale(scale?: LifeScale) {
  return Math.max(0, scaleOrder.indexOf(scale ?? "life"));
}

function rectUnion(rects: Array<SceneRect | undefined>, padding = 0): SceneRect {
  const valid = rects.filter((rect): rect is SceneRect => Boolean(rect));
  if (!valid.length) return { x: 0, y: 0, width: 1, height: 1 };

  const minX = Math.min(...valid.map((rect) => rect.x));
  const minY = Math.min(...valid.map((rect) => rect.y));
  const maxX = Math.max(...valid.map((rect) => rect.x + rect.width));
  const maxY = Math.max(...valid.map((rect) => rect.y + rect.height));

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

function offsetRect(rect: SceneRect, offset: LifeMapOffset): SceneRect {
  return { ...rect, x: rect.x + offset.x, y: rect.y + offset.y };
}

function measureSubtree(path: ForkPath): SubtreePlan {
  const card = cardSizeByScale[path.scale ?? "life"];
  const children = [...(path.children ?? [])]
    .sort((left, right) => (left.orderIndex ?? 0) - (right.orderIndex ?? 0))
    .map(measureSubtree);

  if (!children.length) {
    return {
      path,
      cardWidth: card.width,
      cardHeight: card.height,
      width: card.width,
      height: card.height,
      children,
    };
  }

  const childrenHeight = children.reduce(
    (sum, child, index) => sum + child.height + (index ? CHILD_GAP_Y : 0),
    0,
  );
  const maxChildWidth = Math.max(...children.map((child) => child.width));

  return {
    path,
    cardWidth: card.width,
    cardHeight: card.height,
    width: CONTAINER_PAD_X * 2 + card.width + CHILD_GAP_X + maxChildWidth,
    height: CONTAINER_PAD_Y * 2 + Math.max(card.height, childrenHeight),
    children,
  };
}

function assignSubtree(
  plan: SubtreePlan,
  cardX: number,
  cardCenterY: number,
  depth: number,
  inheritedOffset: LifeMapOffset,
  offsets: Record<string, LifeMapOffset>,
  records: StableSceneNode[],
) {
  const ownOffset = offsets[plan.path.id] ?? { x: 0, y: 0 };
  const cumulativeOffset = {
    x: inheritedOffset.x + ownOffset.x,
    y: inheritedOffset.y + ownOffset.y,
  };
  const baseContainer: SceneRect = {
    x: cardX - CONTAINER_PAD_X,
    y: cardCenterY - plan.height / 2,
    width: plan.width,
    height: plan.height,
  };
  const baseCard: SceneRect = {
    x: cardX,
    y: cardCenterY - plan.cardHeight / 2,
    width: plan.cardWidth,
    height: plan.cardHeight,
  };
  const node: StableSceneNode = {
    id: plan.path.id,
    parentId: plan.path.parentId,
    path: plan.path,
    rank: rankForScale(plan.path.scale),
    depth,
    card: offsetRect(baseCard, cumulativeOffset),
    container: offsetRect(baseContainer, cumulativeOffset),
    childrenIds: plan.children.map((child) => child.path.id),
  };
  records.push(node);

  if (!plan.children.length) {
    node.container = node.card;
    return;
  }

  const childrenHeight = plan.children.reduce(
    (sum, child, index) => sum + child.height + (index ? CHILD_GAP_Y : 0),
    0,
  );
  const childX = cardX + plan.cardWidth + CHILD_GAP_X;
  let childY = cardCenterY - childrenHeight / 2;

  plan.children.forEach((child) => {
    assignSubtree(
      child,
      childX,
      childY + child.height / 2,
      depth + 1,
      cumulativeOffset,
      offsets,
      records,
    );
    childY += child.height + CHILD_GAP_Y;
  });
}

function refreshContainers(node: StableSceneNode, nodeById: Map<string, StableSceneNode>): SceneRect {
  const childRects = node.childrenIds
    .map((childId) => nodeById.get(childId))
    .filter((child): child is StableSceneNode => Boolean(child))
    .map((child) => refreshContainers(child, nodeById));

  if (!childRects.length) {
    node.container = node.card;
    return node.card;
  }

  node.container = rectUnion([node.card, ...childRects], CONTAINER_PAD_Y);
  return node.container;
}

function buildHistoryNodes(
  historyPaths: ForkPath[],
  rootCard: SceneRect,
): StableSceneNode[] {
  const totalWidth =
    historyPaths.length * HISTORY_CARD.width +
    Math.max(0, historyPaths.length - 1) * HISTORY_GAP_X;
  const startX = rootCard.x - 190 - totalWidth;

  return historyPaths.map((path, index) => {
    const yOffset = index % 2 === 0 ? -28 : 28;
    const card: SceneRect = {
      x: startX + index * (HISTORY_CARD.width + HISTORY_GAP_X),
      y: rootCard.y + (rootCard.height - HISTORY_CARD.height) / 2 + yOffset,
      ...HISTORY_CARD,
    };

    return {
      id: path.id,
      parentId: index > 0 ? historyPaths[index - 1].id : undefined,
      path,
      rank: rankForScale(path.scale),
      depth: 0,
      card,
      container: card,
      childrenIds: index < historyPaths.length - 1 ? [historyPaths[index + 1].id] : [ROOT_NODE_ID],
    };
  });
}

export function buildStableLifeMapScene({
  currentPath,
  historyPaths,
  futureRoots,
  offsets,
}: {
  currentPath: ForkPath;
  historyPaths: ForkPath[];
  futureRoots: ForkPath[];
  offsets: Record<string, LifeMapOffset>;
}): StableLifeMapScene {
  const rootCard: SceneRect = {
    x: ROOT_X,
    y: ROOT_Y,
    ...ROOT_CARD,
  };
  const rootNode: StableSceneNode = {
    id: ROOT_NODE_ID,
    parentId: historyPaths.at(-1)?.id,
    path: currentPath,
    rank: 0,
    depth: 0,
    card: rootCard,
    container: rootCard,
    childrenIds: futureRoots.map((path) => path.id),
  };
  const historyNodes = buildHistoryNodes(historyPaths, rootCard);
  const futureNodes: StableSceneNode[] = [];
  const branchCenter = (futureRoots.length - 1) / 2;

  futureRoots.forEach((path, index) => {
    const plan = measureSubtree(path);
    assignSubtree(
      plan,
      rootCard.x + rootCard.width + FUTURE_GAP_X,
      rootCard.y + rootCard.height / 2 + (index - branchCenter) * BRANCH_GAP_Y,
      1,
      { x: 0, y: 0 },
      offsets,
      futureNodes,
    );
  });

  const nodes = [...historyNodes, rootNode, ...futureNodes];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  futureRoots.forEach((path) => {
    const root = nodeById.get(path.id);
    if (root) refreshContainers(root, nodeById);
  });

  const links: StableSceneLink[] = [];
  historyNodes.forEach((node, index) => {
    const next = historyNodes[index + 1];
    links.push({
      id: `${node.id}->${next?.id ?? ROOT_NODE_ID}`,
      fromId: node.id,
      toId: next?.id ?? ROOT_NODE_ID,
      kind: "history",
    });
  });
  futureRoots.forEach((path) => {
    links.push({
      id: `${ROOT_NODE_ID}->${path.id}`,
      fromId: ROOT_NODE_ID,
      toId: path.id,
      kind: "future",
    });
  });
  futureNodes.forEach((node) => {
    node.childrenIds.forEach((childId) => {
      links.push({
        id: `${node.id}->${childId}`,
        fromId: node.id,
        toId: childId,
        kind: "future",
      });
    });
  });

  const overviewBounds = rectUnion([
    ...historyNodes.map((node) => node.card),
    rootCard,
    ...futureRoots.map((path) => nodeById.get(path.id)?.card),
  ], 90);
  const worldBounds = rectUnion([
    overviewBounds,
    ...futureRoots.map((path) => nodeById.get(path.id)?.container),
  ], 180);

  return {
    rootId: ROOT_NODE_ID,
    nodes,
    nodeById,
    links,
    historyIds: historyNodes.map((node) => node.id),
    futureRootIds: futureRoots.map((path) => path.id),
    overviewBounds,
    worldBounds,
  };
}

export function getSceneLineage(scene: StableLifeMapScene, activeId: string): StableSceneNode[] {
  const historyIndex = scene.historyIds.indexOf(activeId);
  if (historyIndex >= 0) {
    return scene.historyIds
      .slice(0, historyIndex + 1)
      .map((id) => scene.nodeById.get(id))
      .filter((node): node is StableSceneNode => Boolean(node));
  }

  const lineage: StableSceneNode[] = [];
  let cursor = scene.nodeById.get(activeId) ?? scene.nodeById.get(scene.rootId);
  const seen = new Set<string>();

  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    lineage.unshift(cursor);
    cursor = cursor.parentId ? scene.nodeById.get(cursor.parentId) : undefined;
  }

  if (!lineage.some((node) => node.id === scene.rootId) && activeId !== scene.rootId) {
    const root = scene.nodeById.get(scene.rootId);
    if (root) lineage.unshift(root);
  }

  return lineage;
}

export function mergeSceneRects(rects: Array<SceneRect | undefined>, padding = 0) {
  return rectUnion(rects, padding);
}
