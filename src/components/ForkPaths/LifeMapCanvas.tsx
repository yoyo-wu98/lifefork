"use client";

import {
  type PointerEvent,
  type WheelEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ForkPath, LifeScale } from "@/lib/types";
import {
  loadLifeMapOffsets,
  saveLifeMapOffsets,
  type StoredLifeMapOffsets,
} from "@/lib/storage";
import {
  cameraZoom,
  focusModeLabel,
  MIN_CAMERA_ZOOM,
  ROOT_NODE_ID,
  scaleMeta,
  scaleOrder,
} from "./constants";
import type { FocusMode } from "./types";
import { ScaleSidebar } from "./ScaleSidebar";
import { LifeMapLinks } from "./LifeMapLinks";
import { LifeMapNode } from "./LifeMapNode";
import {
  centerCameraOnRect,
  fitCameraToRect,
  semanticScaleForZoom,
  zoomCameraAroundPoint,
  type LifeMapCamera,
} from "./model/camera";
import {
  buildStableLifeMapScene,
  mergeSceneRects,
  type StableLifeMapScene,
  type StableSceneNode,
} from "./model/stableScene";
import {
  deriveSceneVisibility,
} from "./model/visibility";

type LifeMapCanvasProps = {
  currentPath: ForkPath;
  historyPaths: ForkPath[];
  futureRoots: ForkPath[];
  activeId: string;
  onPreview: (path: ForkPath) => void;
};

type DragState = {
  id: string;
  pointerId: number;
  lastX: number;
  lastY: number;
};

type PanState = {
  pointerId: number;
  lastX: number;
  lastY: number;
};

const focusModes: FocusMode[] = ["single", "parent-self", "self-children"];
const MIN_READABLE_FOCUS_ZOOM = 0.42;

function rankForScale(scale: LifeScale) {
  return Math.max(0, scaleOrder.indexOf(scale));
}

function nextFocusMode(current: FocusMode) {
  return focusModes[(focusModes.indexOf(current) + 1) % focusModes.length];
}

function clampOffset(value: number) {
  return Math.max(-1800, Math.min(1800, value));
}

function readableFocusBounds(
  scene: StableLifeMapScene,
  activeId: string,
  visibleIds: Set<string>,
  focusMode: FocusMode,
  viewport: { width: number; height: number },
  zoom: number,
) {
  const active = scene.nodeById.get(activeId) ?? scene.nodeById.get(scene.rootId);
  if (!active) return scene.overviewBounds;
  if (focusMode === "single") return active.card;

  const parent = active.parentId ? scene.nodeById.get(active.parentId) : undefined;
  if (focusMode === "parent-self" && parent) {
    return mergeSceneRects([parent.card, active.card], 64);
  }

  const candidates = active.childrenIds
    .map((id) => scene.nodeById.get(id))
    .filter((node): node is StableSceneNode => Boolean(node))
    .filter((node) => visibleIds.has(node.id))
    .sort((left, right) => {
      const activeCenterX = active.card.x + active.card.width / 2;
      const activeCenterY = active.card.y + active.card.height / 2;
      const leftDistance =
        (left.card.x + left.card.width / 2 - activeCenterX) ** 2 +
        (left.card.y + left.card.height / 2 - activeCenterY) ** 2;
      const rightDistance =
        (right.card.x + right.card.width / 2 - activeCenterX) ** 2 +
        (right.card.y + right.card.height / 2 - activeCenterY) ** 2;
      return leftDistance - rightDistance;
    });

  const selectedRects = [active.card];
  const availableWidth = Math.max(1, viewport.width - 152);
  const availableHeight = Math.max(1, viewport.height - 152);

  candidates.forEach((candidate) => {
    const proposed = mergeSceneRects([...selectedRects, candidate.card], 56);
    const fitsViewport =
      proposed.width * zoom <= availableWidth &&
      proposed.height * zoom <= availableHeight;
    if (fitsViewport) selectedRects.push(candidate.card);
  });

  // Keep one child in view when a large subtree cannot fit at the readable zoom.
  if (selectedRects.length === 1 && candidates[0]) selectedRects.push(candidates[0].card);
  return mergeSceneRects(selectedRects, 56);
}

function initialCameraForScene(
  scene: StableLifeMapScene,
  viewport: { width: number; height: number },
) {
  const root = scene.nodeById.get(scene.rootId);
  if (viewport.width < 640 && root) {
    return centerCameraOnRect(root.card, viewport, cameraZoom.life);
  }

  return fitCameraToRect(scene.overviewBounds, viewport, {
    padding: 44,
    minZoom: 0.5,
    maxZoom: cameraZoom.life,
  });
}

export function LifeMapCanvas({
  currentPath,
  historyPaths,
  futureRoots,
  activeId,
  onPreview,
}: LifeMapCanvasProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const cameraRef = useRef<LifeMapCamera>({ x: 0, y: 0, zoom: cameraZoom.life });
  const panRef = useRef<PanState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const skipNextFocusRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const interactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [viewport, setViewport] = useState({ width: 980, height: 680 });
  const [camera, setCameraState] = useState<LifeMapCamera>({
    x: 0,
    y: 0,
    zoom: cameraZoom.life,
  });
  const [semanticScale, setSemanticScale] = useState<LifeScale>("life");
  const [focusMode, setFocusMode] = useState<FocusMode>("single");
  const [editLayout, setEditLayout] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [offsets, setOffsets] = useState<StoredLifeMapOffsets>(() => loadLifeMapOffsets());
  const [directManipulation, setDirectManipulation] = useState(false);

  const setCamera = (next: LifeMapCamera) => {
    cameraRef.current = next;
    setCameraState(next);
  };

  const markTransientInteraction = () => {
    setDirectManipulation(true);
    if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    interactionTimerRef.current = setTimeout(() => {
      setDirectManipulation(false);
      interactionTimerRef.current = null;
    }, 160);
  };

  const scene = useMemo(
    () =>
      buildStableLifeMapScene({
        currentPath,
        historyPaths,
        futureRoots,
        offsets,
      }),
    [currentPath, futureRoots, historyPaths, offsets],
  );
  const semanticRank = rankForScale(semanticScale);
  const visibility = useMemo(
    () => deriveSceneVisibility(scene, activeId, semanticRank, focusMode),
    [activeId, focusMode, scene, semanticRank],
  );
  const activeNode =
    scene.nodeById.get(activeId) ??
    scene.nodeById.get(ROOT_NODE_ID) ??
    scene.nodes[0];
  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const updateViewport = () => {
      const rect = element.getBoundingClientRect();
      setViewport({
        width: Math.max(320, rect.width),
        height: Math.max(500, rect.height),
      });
    };
    updateViewport();

    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateViewport);
    observer?.observe(element);
    window.addEventListener("resize", updateViewport);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  useEffect(
    () => () => {
      if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!activeNode || viewport.width <= 0 || viewport.height <= 0) return;
    if (directManipulation) return;
    if (skipNextFocusRef.current) {
      skipNextFocusRef.current = false;
      return;
    }

    if (!hasInitializedRef.current || activeNode.id === ROOT_NODE_ID) {
      const initial = initialCameraForScene(scene, viewport);
      setCamera(initial);
      hasInitializedRef.current = true;
      return;
    }

    const readableBounds = readableFocusBounds(
      scene,
      activeId,
      visibility.visibleIds,
      focusMode,
      viewport,
      cameraRef.current.zoom,
    );
    const target =
      focusMode === "single"
        ? centerCameraOnRect(readableBounds, viewport, cameraRef.current.zoom)
        : fitCameraToRect(readableBounds, viewport, {
            padding: 76,
            minZoom: Math.max(
              MIN_CAMERA_ZOOM,
              Math.min(MIN_READABLE_FOCUS_ZOOM, cameraRef.current.zoom),
            ),
            maxZoom: Math.max(cameraRef.current.zoom, cameraZoom[semanticScale]),
          });
    setCamera(target);
  }, [
    activeNode,
    activeId,
    focusMode,
    scene,
    semanticScale,
    directManipulation,
    visibility.visibleIds,
    viewport,
  ]);

  const changeSemanticScale = (scale: LifeScale) => {
    setDirectManipulation(false);
    const nextRank = rankForScale(scale);
    const hasVisibleChildren = Boolean(
      activeNode?.childrenIds.some((childId) => {
        const child = scene.nodeById.get(childId);
        return child && child.rank <= nextRank;
      }),
    );
    const nextMode =
      hasVisibleChildren
        ? "self-children"
        : focusMode === "self-children"
          ? "single"
          : focusMode;
    const nextVisibility = deriveSceneVisibility(
      scene,
      activeId,
      nextRank,
      nextMode,
    );
    setSemanticScale(scale);
    setFocusMode(nextMode);
    skipNextFocusRef.current = true;
    const targetZoom = cameraZoom[scale];
    if (scale === "life" && activeNode?.id === ROOT_NODE_ID) {
      setCamera(initialCameraForScene(scene, viewport));
      return;
    }

    const readableBounds = readableFocusBounds(
      scene,
      activeId,
      nextVisibility.visibleIds,
      nextMode,
      viewport,
      targetZoom,
    );
    setCamera(
      nextMode === "single"
        ? centerCameraOnRect(readableBounds, viewport, targetZoom)
        : fitCameraToRect(readableBounds, viewport, {
            padding: 76,
            minZoom: Math.max(
              MIN_CAMERA_ZOOM,
              Math.min(MIN_READABLE_FOCUS_ZOOM, targetZoom),
            ),
            maxZoom: targetZoom,
          }),
    );
  };

  const zoomAtViewportCenter = (factor: number) => {
    const next = zoomCameraAroundPoint(
      cameraRef.current,
      { x: viewport.width / 2, y: viewport.height / 2 },
      cameraRef.current.zoom * factor,
    );
    skipNextFocusRef.current = true;
    markTransientInteraction();
    setCamera(next);
    setSemanticScale(semanticScaleForZoom(next.zoom));
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseWheelLike =
      event.deltaMode === 1 ||
      (Math.abs(event.deltaY) >= 48 && Math.abs(event.deltaX) < 4);
    const shouldZoom = event.ctrlKey || event.metaKey || mouseWheelLike;

    if (!shouldZoom) {
      skipNextFocusRef.current = true;
      markTransientInteraction();
      setCamera({
        ...cameraRef.current,
        x: cameraRef.current.x - event.deltaX,
        y: cameraRef.current.y - event.deltaY,
      });
      return;
    }

    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    const factor = Math.exp(-event.deltaY * (event.ctrlKey || event.metaKey ? 0.012 : 0.0025));
    const next = zoomCameraAroundPoint(
      cameraRef.current,
      point,
      cameraRef.current.zoom * factor,
    );
    skipNextFocusRef.current = true;
    markTransientInteraction();
    setCamera(next);
    setSemanticScale(semanticScaleForZoom(next.zoom));
  };

  const startNodeDrag = (
    event: PointerEvent<HTMLButtonElement>,
    id: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
    };
    setDraggingId(id);
    setDirectManipulation(true);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("[data-map-node]")) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    panRef.current = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
    };
    setDirectManipulation(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag && drag.pointerId === event.pointerId) {
      const deltaX = (event.clientX - drag.lastX) / cameraRef.current.zoom;
      const deltaY = (event.clientY - drag.lastY) / cameraRef.current.zoom;
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
      setOffsets((current) => {
        const previous = current[drag.id] ?? { x: 0, y: 0 };
        return {
          ...current,
          [drag.id]: {
            x: clampOffset(previous.x + deltaX),
            y: clampOffset(previous.y + deltaY),
          },
        };
      });
      return;
    }

    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - pan.lastX;
    const deltaY = event.clientY - pan.lastY;
    pan.lastX = event.clientX;
    pan.lastY = event.clientY;
    setCamera({
      ...cameraRef.current,
      x: cameraRef.current.x + deltaX,
      y: cameraRef.current.y + deltaY,
    });
  };

  const finishPointerInteraction = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      setDraggingId(null);
      skipNextFocusRef.current = true;
    }
    if (panRef.current?.pointerId === event.pointerId) {
      panRef.current = null;
      skipNextFocusRef.current = true;
    }
    setDirectManipulation(false);
  };

  useEffect(() => {
    if (!draggingId) saveLifeMapOffsets(offsets);
  }, [draggingId, offsets]);

  const previewNode = (id: string) => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => {
      const node = scene.nodeById.get(id);
      if (!node) return;
      setFocusMode("single");
      onPreview(node.path);
      previewTimerRef.current = null;
    }, 180);
  };

  const cycleNodeFocus = (id: string) => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    const node = scene.nodeById.get(id);
    if (!node) return;
    if (id !== activeId) onPreview(node.path);

    const nextMode = id === activeId ? nextFocusMode(focusMode) : "parent-self";
    if (nextMode === "self-children" && node.childrenIds.length) {
      const childRanks = node.childrenIds
        .map((childId) => scene.nodeById.get(childId)?.rank)
        .filter((rank): rank is number => typeof rank === "number");
      const childRank = childRanks.length
        ? Math.min(...childRanks)
        : Math.min(scaleOrder.length - 1, node.rank + 1);
      if (childRank > semanticRank) {
        setSemanticScale(scaleOrder[childRank]);
      }
    }
    setFocusMode(nextMode);
  };

  const resetCamera = () => {
    setDirectManipulation(false);
    setFocusMode("single");
    setSemanticScale("life");
    setCamera(initialCameraForScene(scene, viewport));
    const root = scene.nodeById.get(ROOT_NODE_ID);
    if (root) onPreview(root.path);
  };

  const resetLayout = () => {
    setOffsets({});
    saveLifeMapOffsets({});
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ScaleSidebar
          zoomScale={semanticScale}
          onChangeScale={changeSemanticScale}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-night/10 bg-[var(--lf-paper-raised)] px-3 py-2 text-xs text-mist">
            {focusModeLabel[focusMode]}
          </span>
          <button
            type="button"
            className="h-10 w-10 rounded-lg border border-night/10 bg-[var(--lf-paper-raised)] text-lg text-ink hover:border-blue/35"
            aria-label="缩小人生地图"
            title="缩小"
            onClick={() => zoomAtViewportCenter(0.86)}
          >
            −
          </button>
          <span className="min-w-14 text-center text-xs text-mist">
            {Math.round(camera.zoom * 100)}%
          </span>
          <button
            type="button"
            className="h-10 w-10 rounded-lg border border-night/10 bg-[var(--lf-paper-raised)] text-lg text-ink hover:border-blue/35"
            aria-label="放大人生地图"
            title="放大"
            onClick={() => zoomAtViewportCenter(1.16)}
          >
            +
          </button>
          <button
            type="button"
            className={`rounded-lg border px-3 py-2 text-xs ${
              editLayout
                ? "border-gold/40 bg-gold/10 text-gold"
                : "border-night/10 bg-[var(--lf-paper-raised)] text-mist hover:text-ink"
            }`}
            onClick={() => setEditLayout((value) => !value)}
          >
            {editLayout ? "完成布局" : "调整布局"}
          </button>
          <button
            type="button"
            className="h-10 w-10 rounded-lg border border-night/10 bg-[var(--lf-paper-raised)] text-base text-ink hover:border-blue/35"
            aria-label="重置人生地图镜头"
            title="重置镜头"
            onClick={resetCamera}
          >
            ⌖
          </button>
        </div>
      </div>

      {editLayout && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold/20 bg-gold/10 px-4 py-3 text-xs text-mist">
          <span>拖动节点会带动它的全部后代，祖先容器会自动包住新的位置。</span>
          <button
            type="button"
            className="rounded-lg border border-gold/25 px-3 py-1.5 text-gold hover:bg-gold/10"
            onClick={resetLayout}
          >
            恢复自动布局
          </button>
        </div>
      )}

      <div
        ref={viewportRef}
        data-testid="life-map-viewport"
        className="life-map-viewport relative h-[560px] touch-none overflow-hidden rounded-lg border border-[var(--lf-map-line)] bg-[var(--lf-map)] md:h-[680px]"
        tabIndex={0}
        role="application"
        aria-label="人生方案地图。滚轮缩放，触控板双指移动，点击节点查看详情，双击切换聚焦范围。"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerInteraction}
        onPointerCancel={finishPointerInteraction}
      >
        <div className="pointer-events-none absolute left-5 top-5 z-40 rounded-lg border border-[var(--lf-map-line)] bg-[var(--lf-map-label)] px-3 py-2 text-xs text-[var(--lf-map-muted)]">
          <span className="text-[var(--lf-blue-soft)]">当前尺度</span>
          {" · "}
          {scaleMeta[semanticScale].label}
          {" · "}
          {directManipulation ? "手动浏览" : "自动聚焦"}
        </div>

        <div className="pointer-events-none absolute bottom-5 left-5 z-40 max-w-[calc(100%-2.5rem)] rounded-lg border border-[var(--lf-map-line)] bg-[var(--lf-map-label)] px-3 py-2 text-xs text-[var(--lf-map-muted)]">
          滚轮缩放 · 双指移动 · 点击查看 · 双击切换聚焦范围
        </div>

        <div
          data-map-canvas
          className="absolute left-0 top-0"
          style={{
            width: scene.worldBounds.x + scene.worldBounds.width + 240,
            height: scene.worldBounds.y + scene.worldBounds.height + 240,
            transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.zoom})`,
            transformOrigin: "top left",
            transition: directManipulation
              ? "none"
              : "transform 380ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <LifeMapLinks scene={scene} visibility={visibility} zoom={camera.zoom} />
          {scene.nodes
            .filter((node) => visibility.visibleIds.has(node.id))
            .map((node: StableSceneNode) => (
              <LifeMapNode
                key={node.id}
                node={node}
                displayContainer={visibility.containerById.get(node.id)}
                zoom={camera.zoom}
                expanded={visibility.expandedIds.has(node.id)}
                visibleDirectChildCount={node.childrenIds.filter((childId) => visibility.visibleIds.has(childId)).length}
                active={node.id === activeId}
                lineage={visibility.lineageIds.has(node.id)}
                context={visibility.contextIds.has(node.id)}
                editLayout={editLayout}
                dragging={draggingId === node.id}
                onPreview={previewNode}
                onCycleFocus={cycleNodeFocus}
                onDragStart={startNodeDrag}
              />
            ))}
        </div>
      </div>
    </section>
  );
}
