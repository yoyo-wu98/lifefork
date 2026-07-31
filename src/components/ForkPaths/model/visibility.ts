import type { FocusMode } from "../types";
import type {
  SceneRect,
  StableLifeMapScene,
  StableSceneNode,
} from "./stableScene";
import { getSceneLineage, mergeSceneRects } from "./stableScene";

export type SceneVisibility = {
  lineage: StableSceneNode[];
  lineageIds: Set<string>;
  expandedIds: Set<string>;
  visibleIds: Set<string>;
  contextIds: Set<string>;
  highlightedLinkIds: Set<string>;
  containerById: Map<string, SceneRect>;
};

function visibleChildrenAtRank(
  scene: StableLifeMapScene,
  node: StableSceneNode,
  semanticRank: number,
) {
  return node.childrenIds
    .map((childId) => scene.nodeById.get(childId))
    .filter((child): child is StableSceneNode => Boolean(child))
    .filter((child) => child.rank <= semanticRank);
}

export function deriveSceneVisibility(
  scene: StableLifeMapScene,
  activeId: string,
  semanticRank: number,
  focusMode: FocusMode,
): SceneVisibility {
  const lineage = getSceneLineage(scene, activeId);
  const lineageIds = new Set(lineage.map((node) => node.id));
  const visibleIds = new Set<string>();
  const expandedIds = new Set<string>();
  const contextIds = new Set<string>();

  if (activeId === scene.rootId) {
    scene.historyIds.forEach((id) => visibleIds.add(id));
    visibleIds.add(scene.rootId);
    scene.futureRootIds.forEach((id) => visibleIds.add(id));
  } else {
    lineage.forEach((node) => visibleIds.add(node.id));

    const active = scene.nodeById.get(activeId);
    const parent = active?.parentId ? scene.nodeById.get(active.parentId) : undefined;
    const hideRootSiblingsWhileExpanded =
      parent?.id === scene.rootId &&
      active !== undefined &&
      semanticRank > active.rank;
    if (!hideRootSiblingsWhileExpanded) {
      parent?.childrenIds.forEach((id) => {
        if (!lineageIds.has(id)) {
          visibleIds.add(id);
          contextIds.add(id);
        }
      });
    }

    lineage.forEach((node) => {
      if (node.id === scene.rootId || semanticRank <= node.rank) return;
      const visibleChildren = visibleChildrenAtRank(scene, node, semanticRank);
      if (!visibleChildren.length) return;

      expandedIds.add(node.id);
      visibleChildren.forEach((child) => visibleIds.add(child.id));
    });
  }

  const active = scene.nodeById.get(activeId);
  const activeChildren =
    active && semanticRank > active.rank
      ? visibleChildrenAtRank(scene, active, semanticRank)
      : [];
  if (active && active.id !== scene.rootId && activeChildren.length) {
    expandedIds.add(active.id);
    activeChildren.forEach((child) => visibleIds.add(child.id));
  }

  const highlightedLinkIds = new Set<string>();
  if (focusMode === "parent-self" && active?.parentId) {
    highlightedLinkIds.add(`${active.parentId}->${active.id}`);
  } else if (focusMode === "self-children" && active) {
    active.childrenIds.forEach((childId) => {
      if (visibleIds.has(childId)) highlightedLinkIds.add(`${active.id}->${childId}`);
    });
  } else {
    lineage.forEach((node, index) => {
      if (index > 0) highlightedLinkIds.add(`${lineage[index - 1].id}->${node.id}`);
    });
  }

  const containerById = new Map<string, SceneRect>();
  const resolveVisibleContainer = (node: StableSceneNode): SceneRect => {
    const cached = containerById.get(node.id);
    if (cached) return cached;

    const childRects = node.childrenIds
      .filter((childId) => visibleIds.has(childId))
      .map((childId) => scene.nodeById.get(childId))
      .filter((child): child is StableSceneNode => Boolean(child))
      .map((child) =>
        expandedIds.has(child.id) ? resolveVisibleContainer(child) : child.card,
      );
    const container = mergeSceneRects([node.card, ...childRects], 48);
    containerById.set(node.id, container);
    return container;
  };

  expandedIds.forEach((id) => {
    const node = scene.nodeById.get(id);
    if (node) resolveVisibleContainer(node);
  });

  return {
    lineage,
    lineageIds,
    expandedIds,
    visibleIds,
    contextIds,
    highlightedLinkIds,
    containerById,
  };
}

export function focusBoundsForMode(
  scene: StableLifeMapScene,
  activeId: string,
  visibility: SceneVisibility,
  focusMode: FocusMode,
) {
  const active = scene.nodeById.get(activeId) ?? scene.nodeById.get(scene.rootId);
  if (!active) return scene.overviewBounds;
  if (active.id === scene.rootId && focusMode === "single") return scene.overviewBounds;

  const activeRect = active.card;
  const parent = active.parentId ? scene.nodeById.get(active.parentId) : undefined;

  if (focusMode === "parent-self" && parent) {
    return mergeSceneRects([parent.card, activeRect], 70);
  }

  if (focusMode === "self-children") {
    const visibleContainer = visibility.containerById.get(active.id);
    if (visibleContainer) return visibleContainer;

    const childRects = active.childrenIds
      .map((id) => scene.nodeById.get(id))
      .filter((node): node is StableSceneNode => Boolean(node))
      .filter((node) => visibility.visibleIds.has(node.id))
      .map((node) => node.card);
    return mergeSceneRects([activeRect, ...childRects], 48);
  }

  return mergeSceneRects([activeRect], 60);
}
