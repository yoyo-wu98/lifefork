import { type PointerEvent, type WheelEvent, useEffect, useMemo, useRef, useState } from "react";
import type { LifeScale, SelfSkill } from "@/lib/types";
import type { ForkPath } from "@/lib/types";
import { useLifeforkStore } from "@/lib/stores/lifeforkStore";
import {
  ROOT_NODE_ID,
  ROOT_FRAME, PAD_X, PAD_Y, VIEWPORT_HEIGHT,
  scaleOrder, scaleMeta, cameraZoom,
  frameByScale,
  laneMeta, stateLabels, focusModeLabel,
} from "./constants";
import type { LayoutNode, LayoutBounds, NodeOffset, FocusMode, NodeDragState } from "./types";
import {
  scaleRank, clampZoom, scaleForZoom, rgba,
  createCurrentPath, createHistoryPaths,
  nodeBounds, collectLayoutDescendants, containerBoundsForNode,
  mergeBounds, fitZoomForBounds,
  flattenForks, getAncestry,
} from "./utils";
import { buildMapLayout } from "./layoutEngine";
import { connectorPath } from "./connectorPath";
import { StateBar } from "./StateBar";

/**
 * Life Simulation Map — the core visualization.
 *
 * Reads state from zustand store directly.
 * Renders an interactive semantic-zoom canvas of the user's life timeline
 * with branching future paths, state vectors, and node inspection.
 */
export function ForkPaths() {
  const selfSkill = useLifeforkStore((s) => s.selfSkill) as SelfSkill;
  const activePathId = useLifeforkStore((s) => s.previewForkId);
  const onPreview = useLifeforkStore((s) => s.setPreviewForkId);
  const onSelect = useLifeforkStore((s) => s.selectFork);

  const [zoomScale, setZoomScale] = useState<LifeScale>("life");
  const [cameraMotion, setCameraMotion] = useState<"idle" | "zoom-in" | "zoom-out" | "pan" | "drag">("idle");
  const [manualZoom, setManualZoom] = useState<number | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPointer, setLastPointer] = useState<{ x: number; y: number } | null>(null);
  const [nodeOffsets, setNodeOffsets] = useState<Record<string, NodeOffset>>({});
  const [nodeDrag, setNodeDrag] = useState<NodeDragState | null>(null);
  const [focusMode, setFocusMode] = useState<FocusMode>("single");
  const [viewportSize, setViewportSize] = useState({ width: 860, height: VIEWPORT_HEIGHT });

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const motionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodeDragMovedRef = useRef(false);
  const suppressNodeClickRef = useRef(false);
  const lastNodeClickRef = useRef<{ id: string; at: number } | null>(null);
  const gestureScaleRef = useRef(1);

  // ── Derived path data ──────────────────────────────────────────────

  const historyPaths = useMemo(() => createHistoryPaths(selfSkill), [selfSkill]);
  const currentPath = useMemo(() => createCurrentPath(selfSkill), [selfSkill]);
  const allForks = useMemo(() => flattenForks(selfSkill.forks), [selfSkill.forks]);
  const allPaths = useMemo(() => [...historyPaths, currentPath, ...allForks], [allForks, currentPath, historyPaths]);
  const activeId = activePathId ?? ROOT_NODE_ID;
  const activePath = useMemo(() => allPaths.find((path) => path.id === activeId) ?? currentPath, [activeId, allPaths, currentPath]);
  const lineage = useMemo(() => {
    const ancestry = getAncestry(activePath, allPaths);
    if (activePath.id === ROOT_NODE_ID || ancestry.some((path) => path.id === ROOT_NODE_ID)) return ancestry;
    return [currentPath, ...ancestry];
  }, [activePath, allPaths, currentPath]);

  const zoomFocusPath = activePath;
  const zoomFocusLineage = lineage;
  const zoomFocusLineageIds = useMemo(() => new Set(zoomFocusLineage.map((path) => path.id)), [zoomFocusLineage]);
  const directChildIds = useMemo(() => new Set((zoomFocusPath.children ?? []).map((path) => path.id)), [zoomFocusPath.children]);
  const visibleRank = scaleRank(zoomScale);
  const layout = useMemo(() => buildMapLayout(selfSkill, currentPath, historyPaths, nodeOffsets), [selfSkill, currentPath, historyPaths, nodeOffsets]);
  const parentIdByNodeId = useMemo(() => new Map(layout.links.map((link) => [link.to.id, link.from.id])), [layout.links]);

  const activeLayoutNode = layout.nodes.find((node) => node.id === activePath.id);
  const zoomFocusLayoutNode = layout.nodes.find((node) => node.id === zoomFocusPath.id);
  const zoomFocusFrame = layout.frames.find((frame) => frame.id === zoomFocusPath.id);
  const zoomParentPath = zoomFocusLineage.length > 1 ? zoomFocusLineage[zoomFocusLineage.length - 2] : undefined;
  const zoomParentLayoutNode = zoomParentPath ? layout.nodes.find((node) => node.id === zoomParentPath.id) : undefined;
  const zoomChildLayoutNodes = (zoomFocusPath.children ?? []).map((child) => layout.nodes.find((node) => node.id === child.id));
  const zoomFocusDescendants = useMemo(() => (zoomFocusLayoutNode ? collectLayoutDescendants(zoomFocusLayoutNode) : []), [zoomFocusLayoutNode]);
  const zoomFocusDescendantIds = useMemo(() => new Set(zoomFocusDescendants.map((node) => node.id)), [zoomFocusDescendants]);

  const visibleContainerChildIds = useMemo(() => {
    const ids = new Set<string>();
    if (focusMode === "self-children") {
      zoomFocusPath.children?.forEach((child) => ids.add(child.id));
      return ids;
    }
    layout.nodes.forEach((node) => {
      if (!node.children.length) return;
      const isLineageParent = zoomFocusLineageIds.has(node.id) || node.id === zoomFocusPath.id;
      if (!isLineageParent) return;
      if (node.id === ROOT_NODE_ID || (node.path?.scale && scaleRank(node.path.scale) <= visibleRank)) {
        node.children.forEach((child) => ids.add(child.id));
      }
    });
    return ids;
  }, [focusMode, layout.nodes, visibleRank, zoomFocusLineageIds, zoomFocusPath]);

  const forceCardNodeIds = useMemo(() => {
    const ids = new Set<string>();
    if (focusMode === "self-children") {
      ids.add(zoomFocusPath.id);
      directChildIds.forEach((id) => ids.add(id));
    }
    return ids;
  }, [directChildIds, focusMode, zoomFocusPath.id]);

  const shouldUseContainerForNode = (node?: LayoutNode) => {
    if (!node?.container || !node.path?.scale) return false;
    if (forceCardNodeIds.has(node.id)) return false;
    return scaleRank(node.path.scale) <= visibleRank;
  };

  const visualBoundsForNode = (node?: LayoutNode) =>
    node ? (shouldUseContainerForNode(node) ? containerBoundsForNode(node) : nodeBounds(node)) : undefined;

  const containerLabelBoundsForNode = (node?: LayoutNode): LayoutBounds | undefined => {
    if (!node || !shouldUseContainerForNode(node)) return undefined;
    const bounds = containerBoundsForNode(node);
    if (!bounds) return undefined;
    const nodeRank = scaleRank(node.scale);
    const ancestorGap = Math.max(0, visibleRank - nodeRank);
    const labelWidth = Math.min(760, Math.max(420, bounds.width * 0.46));
    const labelHeight = 38 + Math.min(22, ancestorGap * 3.2);

    return {
      x: bounds.x + 22 + Math.min(18, ancestorGap * 3),
      y: bounds.y + 18 + Math.min(16, ancestorGap * 2.4),
      width: labelWidth,
      height: labelHeight,
    };
  };

  const connectorSourceBoundsForNode = (node?: LayoutNode) => {
    if (!node) return undefined;
    return shouldUseContainerForNode(node) ? visualBoundsForNode(node) : nodeBounds(node);
  };

  const connectorTargetBoundsForNode = (node?: LayoutNode) => {
    if (!node) return undefined;
    return containerLabelBoundsForNode(node) ?? nodeBounds(node);
  };

  const makeLinkId = (fromId?: string, toId?: string) => `${fromId ?? ""}->${toId ?? ""}`;

  const activeScaleRank = zoomFocusPath.id === ROOT_NODE_ID ? 0 : scaleRank(zoomFocusPath.scale ?? "life");
  const focusedScaleChildren = useMemo(
    () =>
      visibleRank > activeScaleRank
        ? zoomFocusDescendants.filter(
            (node) => node.path?.scale && scaleRank(node.path.scale) >= visibleRank && scaleRank(node.path.scale) <= visibleRank + 1,
          )
        : [],
    [activeScaleRank, visibleRank, zoomFocusDescendants],
  );
  const focusedScaleChildIds = useMemo(() => new Set(focusedScaleChildren.map((node) => node.id)), [focusedScaleChildren]);
  const visibleNodeIds = useMemo(() => {
    const ids = new Set<string>();

    const addWithAncestors = (id: string) => {
      let cursor: string | undefined = id;
      while (cursor && !ids.has(cursor)) {
        ids.add(cursor);
        cursor = parentIdByNodeId.get(cursor);
      }
    };

    layout.nodes.forEach((node) => {
      if (node.id === ROOT_NODE_ID || node.id.startsWith("lifefork-history")) ids.add(node.id);
    });
    zoomFocusLineageIds.forEach((id) => addWithAncestors(id));
    visibleContainerChildIds.forEach((id) => addWithAncestors(id));
    focusedScaleChildIds.forEach((id) => addWithAncestors(id));
    forceCardNodeIds.forEach((id) => addWithAncestors(id));
    addWithAncestors(zoomFocusPath.id);
    addWithAncestors(activePath.id);

    return ids;
  }, [activePath.id, focusedScaleChildIds, forceCardNodeIds, layout.nodes, parentIdByNodeId, visibleContainerChildIds, zoomFocusLineageIds, zoomFocusPath.id]);
  const highlightedLinkIds = useMemo(() => {
    const ids = new Set<string>();

    if (focusMode === "parent-self" && zoomParentPath) {
      ids.add(makeLinkId(zoomParentPath.id, zoomFocusPath.id));
      return ids;
    }

    if (focusMode === "self-children") {
      zoomFocusPath.children?.forEach((child) => ids.add(makeLinkId(zoomFocusPath.id, child.id)));
      return ids;
    }

    for (let index = 1; index < zoomFocusLineage.length; index += 1) {
      ids.add(makeLinkId(zoomFocusLineage[index - 1].id, zoomFocusLineage[index].id));
    }

    return ids;
  }, [focusMode, zoomFocusLineage, zoomFocusPath, zoomParentPath]);
  const scaleDrillBounds = focusedScaleChildren.length
    ? mergeBounds([visualBoundsForNode(zoomFocusLayoutNode), ...focusedScaleChildren.map(visualBoundsForNode)])
    : undefined;
  const selfChildrenBounds = mergeBounds([nodeBounds(zoomFocusLayoutNode), ...zoomChildLayoutNodes.map(nodeBounds)]);
  const focusBounds =
    focusMode === "parent-self"
      ? mergeBounds([visualBoundsForNode(zoomParentLayoutNode), visualBoundsForNode(zoomFocusLayoutNode)])
      : focusMode === "self-children"
        ? selfChildrenBounds
        : (scaleDrillBounds ?? visualBoundsForNode(zoomFocusLayoutNode));

  const focusNode = zoomFocusLayoutNode ?? activeLayoutNode ?? layout.nodes.find((node) => node.id === ROOT_NODE_ID) ?? layout.nodes[0];
  const nextScale = zoomScale === "hour" ? undefined : scaleOrder[scaleRank(zoomScale) + 1];
  const desiredZoom = manualZoom ?? cameraZoom[zoomScale];
  const focusScaleRank = zoomFocusPath.id === ROOT_NODE_ID ? 0 : scaleRank(zoomFocusPath.scale ?? "life");
  const shouldFocusFrame = Boolean(zoomFocusFrame && scaleRank(zoomScale) <= focusScaleRank + 1);
  const focusX = focusBounds ? focusBounds.x + focusBounds.width / 2 : shouldFocusFrame && zoomFocusFrame ? zoomFocusFrame.x + zoomFocusFrame.width / 2 : (focusNode?.x ?? 0) + PAD_X + (focusNode?.width ?? ROOT_FRAME.width) / 2;
  const focusY = focusBounds ? focusBounds.y + focusBounds.height / 2 : shouldFocusFrame && zoomFocusFrame ? zoomFocusFrame.y + zoomFocusFrame.height / 2 : (focusNode?.y ?? 0) + PAD_Y + (focusNode?.height ?? ROOT_FRAME.height) / 2;
  const focusFitZoom = fitZoomForBounds(focusBounds, viewportSize);
  const currentZoom = Math.min(desiredZoom, focusFitZoom);
  const baseCameraX = viewportSize.width / 2 - focusX * currentZoom;
  const baseCameraY = viewportSize.height / 2 - focusY * currentZoom;
  const cameraX = Math.round(baseCameraX + panOffset.x);
  const cameraY = Math.round(baseCameraY + panOffset.y);
  const cameraTransform = `translate3d(${cameraX}px, ${cameraY}px, 0) scale(${currentZoom})`;
  const cameraLabel = cameraMotion === "zoom-in" ? "ZOOM IN" : cameraMotion === "zoom-out" ? "ZOOM OUT" : cameraMotion === "pan" ? "PANNING" : cameraMotion === "drag" ? "MOVING TREE" : "FOCUS LOCK";
  const activeFrameWidth = Math.round(focusBounds?.width ?? zoomFocusFrame?.width ?? zoomFocusLayoutNode?.width ?? frameByScale[zoomFocusPath.scale ?? "life"].width);
  const activeFrameHeight = Math.round(focusBounds?.height ?? zoomFocusFrame?.height ?? zoomFocusLayoutNode?.height ?? frameByScale[zoomFocusPath.scale ?? "life"].height);

  // ── ResizeObserver ──────────────────────────────────────────────────

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const updateSize = () => {
      const rect = viewport.getBoundingClientRect();
      setViewportSize({ width: Math.max(360, rect.width), height: Math.max(420, rect.height) });
    };
    updateSize();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateSize);
    observer?.observe(viewport);
    window.addEventListener("resize", updateSize);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (motionTimerRef.current) clearTimeout(motionTimerRef.current);
    };
  }, []);

  // ── Gesture events (Safari/iOS pinch zoom) ─────────────────────────

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleGestureStart = (event: Event) => {
      event.preventDefault();
      gestureScaleRef.current = 1;
    };
    const handleGestureChange = (event: Event) => {
      event.preventDefault();
      const gestureEvent = event as Event & { scale?: number; clientX?: number; clientY?: number };
      const nextScaleValue = gestureEvent.scale ?? 1;
      const factor = nextScaleValue / gestureScaleRef.current;
      if (!Number.isFinite(factor) || Math.abs(factor - 1) < 0.002) return;
      const rect = viewport.getBoundingClientRect();
      const oldZoom = currentZoom;
      const nextDesiredZoom = clampZoom(desiredZoom * factor);
      const nextZoom = Math.min(nextDesiredZoom, focusFitZoom);
      const nextSemanticScale = scaleForZoom(nextDesiredZoom);
      const pointerX = (gestureEvent.clientX ?? rect.left + rect.width / 2) - rect.left;
      const pointerY = (gestureEvent.clientY ?? rect.top + rect.height / 2) - rect.top;
      const oldCameraX = baseCameraX + panOffset.x;
      const oldCameraY = baseCameraY + panOffset.y;
      const worldX = (pointerX - oldCameraX) / oldZoom;
      const worldY = (pointerY - oldCameraY) / oldZoom;
      const nextBaseX = viewportSize.width / 2 - focusX * nextZoom;
      const nextBaseY = viewportSize.height / 2 - focusY * nextZoom;
      const nextCameraX = pointerX - worldX * nextZoom;
      const nextCameraY = pointerY - worldY * nextZoom;
      gestureScaleRef.current = nextScaleValue;
      setManualZoom(nextDesiredZoom);
      if (nextSemanticScale !== zoomScale) setZoomScale(nextSemanticScale);
      setPanOffset({ x: nextCameraX - nextBaseX, y: nextCameraY - nextBaseY });
      setCameraMotion(nextZoom > oldZoom ? "zoom-in" : "zoom-out");
      if (motionTimerRef.current) clearTimeout(motionTimerRef.current);
      motionTimerRef.current = setTimeout(() => setCameraMotion("idle"), 1450);
    };
    const handleGestureEnd = (event: Event) => {
      event.preventDefault();
      gestureScaleRef.current = 1;
    };
    viewport.addEventListener("gesturestart", handleGestureStart, { passive: false });
    viewport.addEventListener("gesturechange", handleGestureChange, { passive: false });
    viewport.addEventListener("gestureend", handleGestureEnd, { passive: false });
    return () => {
      viewport.removeEventListener("gesturestart", handleGestureStart);
      viewport.removeEventListener("gesturechange", handleGestureChange);
      viewport.removeEventListener("gestureend", handleGestureEnd);
    };
  }, [baseCameraX, baseCameraY, currentZoom, desiredZoom, focusFitZoom, focusX, focusY, panOffset.x, panOffset.y, viewportSize.height, viewportSize.width, zoomScale]);

  // ── Camera controls ────────────────────────────────────────────────

  const changeZoomScale = (scale: LifeScale) => {
    const nextRank = scaleRank(scale);
    const currentRank = scaleRank(zoomScale);
    setCameraMotion(nextRank > currentRank ? "zoom-in" : nextRank < currentRank ? "zoom-out" : "idle");
    setManualZoom(null);
    setPanOffset({ x: 0, y: 0 });
    setZoomScale(scale);
    if (motionTimerRef.current) clearTimeout(motionTimerRef.current);
    motionTimerRef.current = setTimeout(() => setCameraMotion("idle"), 1500);
  };

  const resetCamera = () => {
    setManualZoom(null);
    setPanOffset({ x: 0, y: 0 });
    setCameraMotion("idle");
  };

  const settleMotion = (delay = 950) => {
    if (motionTimerRef.current) clearTimeout(motionTimerRef.current);
    motionTimerRef.current = setTimeout(() => setCameraMotion("idle"), delay);
  };

  // ── Viewport wheel / pointer handlers ──────────────────────────────

  const handleViewportWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const absDeltaX = Math.abs(event.deltaX);
    const absDeltaY = Math.abs(event.deltaY);
    const isPinchZoom = event.ctrlKey || event.metaKey || (absDeltaY > 0 && absDeltaX < 2);
    const isFineTrackpadPan = !isPinchZoom && absDeltaX > absDeltaY * 0.8;
    if (isFineTrackpadPan) {
      setPanOffset((current) => ({ x: current.x - event.deltaX, y: current.y - event.deltaY }));
      setCameraMotion("pan");
      settleMotion(420);
      return;
    }
    const oldZoom = currentZoom;
    const oldDesiredZoom = desiredZoom;
    const boundedDeltaY = Math.max(-180, Math.min(180, event.deltaY));
    const nextDesiredZoom = clampZoom(oldDesiredZoom * Math.exp(-boundedDeltaY * 0.00115));
    const nextZoom = Math.min(nextDesiredZoom, focusFitZoom);
    const nextSemanticScale = scaleForZoom(nextDesiredZoom);
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const oldCameraX = baseCameraX + panOffset.x;
    const oldCameraY = baseCameraY + panOffset.y;
    const worldX = (pointerX - oldCameraX) / oldZoom;
    const worldY = (pointerY - oldCameraY) / oldZoom;
    const nextBaseX = viewportSize.width / 2 - focusX * nextZoom;
    const nextBaseY = viewportSize.height / 2 - focusY * nextZoom;
    const nextCameraX = pointerX - worldX * nextZoom;
    const nextCameraY = pointerY - worldY * nextZoom;
    setManualZoom(nextDesiredZoom);
    if (nextSemanticScale !== zoomScale) setZoomScale(nextSemanticScale);
    setPanOffset({ x: nextCameraX - nextBaseX, y: nextCameraY - nextBaseY });
    setCameraMotion(nextZoom > oldZoom ? "zoom-in" : "zoom-out");
    settleMotion(1450);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    setIsDragging(true);
    setLastPointer({ x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !lastPointer) return;
    const dx = event.clientX - lastPointer.x;
    const dy = event.clientY - lastPointer.y;
    setPanOffset((current) => ({ x: current.x + dx, y: current.y + dy }));
    setLastPointer({ x: event.clientX, y: event.clientY });
    setCameraMotion("pan");
    settleMotion(420);
  };

  const stopPointerPan = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    setLastPointer(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  // ── Node interaction handlers ──────────────────────────────────────

  const previewNode = (path: ForkPath) => {
    onPreview(path.id);
    if (path.id !== activePath.id) setFocusMode("single");
    resetCamera();
  };

  const cycleFocusMode = (path: ForkPath) => {
    onPreview(path.id);
    setPanOffset({ x: 0, y: 0 });
    setManualZoom(null);
    setFocusMode((current) =>
      path.id !== activePath.id ? "parent-self" : current === "single" ? "parent-self" : current === "parent-self" ? "self-children" : "single",
    );
  };

  const handleNodePointerDown = (event: PointerEvent<HTMLButtonElement>, node: LayoutNode) => {
    if (!node.path) return;
    event.stopPropagation();
    nodeDragMovedRef.current = false;
    setNodeDrag({ id: node.id, pointerId: event.pointerId, lastX: event.clientX, lastY: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleNodePointerMove = (event: PointerEvent<HTMLButtonElement>, node: LayoutNode) => {
    if (!nodeDrag || nodeDrag.id !== node.id || nodeDrag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const screenDx = event.clientX - nodeDrag.lastX;
    const screenDy = event.clientY - nodeDrag.lastY;
    if (Math.abs(screenDx) + Math.abs(screenDy) < 0.5) return;
    nodeDragMovedRef.current = true;
    setNodeOffsets((current) => {
      const previous = current[node.id] ?? { x: 0, y: 0 };
      return { ...current, [node.id]: { x: previous.x + screenDx / currentZoom, y: previous.y + screenDy / currentZoom } };
    });
    setCameraMotion("drag");
    settleMotion(520);
    setNodeDrag({ id: node.id, pointerId: event.pointerId, lastX: event.clientX, lastY: event.clientY });
  };

  const stopNodeDrag = (event: PointerEvent<HTMLButtonElement>, node: LayoutNode) => {
    if (!nodeDrag || nodeDrag.id !== node.id || nodeDrag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    setNodeDrag(null);
    if (nodeDragMovedRef.current) {
      suppressNodeClickRef.current = true;
      window.setTimeout(() => { suppressNodeClickRef.current = false; }, 0);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm tracking-[0.2em] text-blue">Life Simulation Map</p>
        <h3 className="mt-2 text-2xl">人生模拟地图</h3>
        <p className="mt-2 max-w-3xl text-sm text-mist">人生从左往右展开：出生、早年、关键过去节点和暗线汇入现在，未来分支从此刻继续向右生长。初始镜头锁定现在，但左侧能看见来路。</p>
      </div>

      <div className="rounded-[2rem] border border-white/15 bg-white/5 p-4 shadow-glow">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-2 pb-4 text-xs text-mist">
          <span>当前读取：{zoomFocusPath.futureSelfName}</span>
          <span>当前尺度：{scaleMeta[zoomScale].label}</span>
          <span>镜头模式：{focusModeLabel[focusMode]}</span>
          <span>视野单位：{frameByScale[zoomScale].width}×{frameByScale[zoomScale].height}</span>
          <span>读取框：{activeFrameWidth}×{activeFrameHeight}</span>
          <span>节点数：{allForks.length + historyPaths.length + 1}</span>
          <span>核心冲突：{selfSkill.semantic.innerConflict}</span>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr]">
          <aside className="space-y-3 rounded-[1.5rem] border border-white/10 bg-night/60 p-4">
            <p className="text-xs tracking-[0.18em] text-blue">SEMANTIC ZOOM</p>
            <div className="space-y-2">
              {scaleOrder.map((scale) => {
                const isActive = zoomScale === scale;
                return (
                  <button
                    key={scale}
                    onClick={() => changeZoomScale(scale)}
                    className={`w-full rounded-2xl border px-3 py-2 text-left text-sm transition ${
                      isActive ? "border-gold bg-gold/15 text-gold" : "border-white/10 bg-white/5 text-mist hover:border-blue/50 hover:text-ink"
                    }`}
                  >
                    <span className="block">{scaleMeta[scale].label}</span>
                    <span className="mt-1 block text-[11px] leading-4 opacity-80">{scaleMeta[scale].hint}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div
            ref={viewportRef}
            onWheel={handleViewportWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopPointerPan}
            onPointerCancel={stopPointerPan}
            className={`relative h-[520px] touch-none overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#050814]/90 md:h-[680px] ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(143,183,255,0.12),transparent_32%),linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[length:100%_100%,42px_42px,42px_42px]" />
            <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-full border border-white/15 bg-night/75 px-3 py-2 text-[11px] text-mist backdrop-blur">
              <span className={cameraMotion === "idle" ? "text-blue" : "text-gold"}>{cameraLabel}</span>
              <span className="mx-2 text-white/30">/</span>
              <span>{Math.round(currentZoom * 100)}%</span>
            </div>
            <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-2xl border border-white/10 bg-night/70 px-4 py-3 text-xs text-mist backdrop-blur">
              镜头：{focusModeLabel[focusMode]} · {zoomFocusPath.timeSpan?.durationLabel ?? scaleMeta[zoomFocusPath.scale ?? "life"].label} · {zoomFocusPath.title}
            </div>
            <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-2xl border border-white/10 bg-night/70 px-4 py-3 text-[11px] leading-5 text-mist backdrop-blur">
              左侧是来路 · 上层退到底图 · 下层在框内浮现
            </div>
            <button
              type="button"
              onClick={resetCamera}
              className="absolute bottom-4 right-4 z-20 rounded-full border border-white/15 bg-night/75 px-4 py-2 text-xs text-mist backdrop-blur hover:border-blue hover:text-blue"
            >
              重置镜头
            </button>
            <div className="pointer-events-none absolute inset-x-8 top-1/2 z-10 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
            <div className="pointer-events-none absolute inset-y-8 left-1/2 z-10 w-px bg-gradient-to-b from-transparent via-blue/20 to-transparent" />
            <div
              className="absolute left-0 top-0 will-change-transform"
              style={{
                width: layout.width,
                height: layout.height,
                transform: cameraTransform,
                transformOrigin: "0 0",
                transition: "transform 1450ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <svg className="pointer-events-none absolute inset-0" width={layout.width} height={layout.height} role="img" aria-label="LifeFork life simulation map connectors">
                <defs>
                  <filter id="life-map-glow">
                    <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {layout.links.map((link) => {
                  const fromBounds = connectorSourceBoundsForNode(link.from);
                  const toBounds = connectorTargetBoundsForNode(link.to);
                  if (!fromBounds || !toBounds) return null;
                  if (!visibleNodeIds.has(link.from.id) || !visibleNodeIds.has(link.to.id)) return null;
                  const linkRank = scaleRank(link.to.scale);
                  const fromRank = scaleRank(link.from.scale);
                  const detailGap = linkRank - visibleRank;
                  const isLineage = link.to.id === zoomFocusPath.id || (zoomFocusLineageIds.has(link.to.id) && (link.from.id === ROOT_NODE_ID || zoomFocusLineageIds.has(link.from.id)));
                  const isHistoryLink = link.from.id.startsWith("lifefork-history") || link.to.id.startsWith("lifefork-history");
                  const isDirectVisibleChild = visibleContainerChildIds.has(link.to.id);
                  const isFocusedScaleChild = focusedScaleChildIds.has(link.to.id);
                  const isRootToVisibleChild = link.from.id === ROOT_NODE_ID && isDirectVisibleChild;
                  const isNext = (link.from.id === zoomFocusPath.id && isDirectVisibleChild) || isFocusedScaleChild;
                  const isCurrentBand = isHistoryLink || isRootToVisibleChild || isDirectVisibleChild || isFocusedScaleChild || (isLineage && fromRank <= visibleRank + 1 && linkRank <= visibleRank + 1);
                  const linkId = makeLinkId(link.from.id, link.to.id);
                  const hasHighlightedRelation = highlightedLinkIds.size > 0;
                  const isHighlightedRelation = highlightedLinkIds.has(linkId);
                  const laneColor = link.to.lane ? laneMeta[link.to.lane].color : "#8FB7FF";
                  const stroke = isHighlightedRelation || isLineage ? "#D6A85C" : isNext ? "#B18CFF" : laneColor;
                  const opacity = hasHighlightedRelation
                    ? isHighlightedRelation ? 0.92 : 0.055
                    : isLineage || isNext || isCurrentBand ? 0.78 : Math.max(0.08, 0.24 - Math.max(0, detailGap - 1) * 0.05);
                  return (
                    <path
                      key={`${link.from.id}-${link.to.id}`}
                      d={connectorPath(fromBounds, toBounds)}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={isHighlightedRelation || isLineage ? 2.4 : 1.2}
                      opacity={opacity}
                      className="transition-all duration-[1450ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                      filter={isHighlightedRelation || (!hasHighlightedRelation && (isLineage || isNext)) ? "url(#life-map-glow)" : undefined}
                    />
                  );
                })}
              </svg>

              {layout.nodes.map((node) => {
                const isRoot = node.id === ROOT_NODE_ID;
                const isHistoryNode = node.id.startsWith("lifefork-history");
                const nodeRank = scaleRank(node.scale);
                const detailGap = nodeRank - visibleRank;
                const ancestorGap = visibleRank - nodeRank;
                const isFocus = node.id === zoomFocusPath.id;
                const isActive = node.id === activePath.id;
                const isLineage = zoomFocusLineageIds.has(node.id);
                const isFocusChild = focusMode === "self-children" && directChildIds.has(node.id);
                const isFocusedScaleChild = focusedScaleChildIds.has(node.id);
                const morphBounds = shouldUseContainerForNode(node) ? containerBoundsForNode(node) : undefined;
                const isContainerized = Boolean(morphBounds);
                const isInsideFocusSubtree = zoomFocusPath.id !== ROOT_NODE_ID && zoomFocusDescendantIds.has(node.id);
                const isDirectVisibleChild = visibleContainerChildIds.has(node.id);
                const isNext = isFocusChild || isDirectVisibleChild || isFocusedScaleChild;
                const status = isFocus ? "镜头中" : isRoot ? "现在" : isActive ? "读取中" : isContainerized ? (nodeRank === visibleRank ? "当前层" : "底图") : isLineage ? "已读取" : isNext ? "可进入" : "分支";
                const lane = node.lane ? laneMeta[node.lane] : undefined;
                const isCompact = !isContainerized && node.width <= 200;
                const isAncestorLayer = !isRoot && !isHistoryNode && Boolean(node.path?.scale) && nodeRank < visibleRank;
                const isCurrentScale = nodeRank === visibleRank;
                const isRelevantNode = visibleNodeIds.has(node.id) || isFocus || isActive || isLineage || isFocusChild || isDirectVisibleChild || isFocusedScaleChild;
                const isDeepHidden = !isRelevantNode;
                const isPreviewNode = false;
                const nodeOpacity = isDeepHidden ? 0 : isRoot || isFocus || isActive ? 1 : isHistoryNode ? Math.max(0.44, 0.82 - visibleRank * 0.055) : isLineage ? 0.92 : isContainerized ? (isCurrentScale ? 0.86 : isInsideFocusSubtree ? 0.48 : Math.max(0.12, 0.3 - ancestorGap * 0.045)) : isAncestorLayer ? Math.max(0.09, 0.28 - ancestorGap * 0.045) : isNext || isCurrentScale || isInsideFocusSubtree ? 0.96 : Math.max(0.055, 0.24 - Math.max(0, detailGap - 1) * 0.085);
                const displayBounds = morphBounds ?? { x: node.x + PAD_X, y: node.y + PAD_Y, width: node.width, height: node.height };
                const laneColor = lane?.color ?? (isHistoryNode ? "#8FB7FF" : "#B18CFF");
                const isMutedAncestor = isAncestorLayer && !isLineage && !isFocus && !isActive;
                const morphProgress = isContainerized ? Math.min(1, Math.max(0, ancestorGap / 3)) : 0;
                const containerLabelScale = isContainerized ? 1 + Math.min(1.2, Math.max(0, ancestorGap) * 0.2) : 1;
                const containerLabelFontSize = isContainerized
                  ? isCurrentScale || isFocus || isActive ? 14 * containerLabelScale : 11 * containerLabelScale
                  : 10;
                const containerLabelPaddingX = 16 + Math.max(0, ancestorGap) * 2.2;
                const containerLabelPaddingY = 7 + Math.max(0, ancestorGap) * 1.1;

                return (
                  <button
                    key={node.id}
                    type="button"
                    onPointerDown={(event) => handleNodePointerDown(event, node)}
                    onPointerMove={(event) => handleNodePointerMove(event, node)}
                    onPointerUp={(event) => stopNodeDrag(event, node)}
                    onPointerCancel={(event) => stopNodeDrag(event, node)}
                    onClick={() => {
                      if (suppressNodeClickRef.current) return;
                      if (!node.path) return;
                      const now = Date.now();
                      const isDoubleClick = lastNodeClickRef.current?.id === node.id && now - lastNodeClickRef.current.at < 360;
                      lastNodeClickRef.current = isDoubleClick ? null : { id: node.id, at: now };
                      if (isDoubleClick) cycleFocusMode(node.path);
                      else previewNode(node.path);
                    }}
                    className={`absolute border text-left transition ${isContainerized ? `rounded-[2rem] p-0 ${isCurrentScale ? "" : "border-dashed"}` : isCompact ? "overflow-hidden rounded-[1.1rem] p-3" : "overflow-hidden rounded-[1.35rem] p-4"} ${
                      isContainerized
                        ? isFocus || isActive ? "border-gold/70 bg-gold/[0.045] shadow-[inset_0_0_70px_rgba(214,168,92,0.09)]" : "border-white/15 bg-white/[0.018] hover:border-blue/45 hover:bg-blue/[0.035]"
                        : isRoot ? "cursor-default border-blue/50 bg-blue/15"
                        : isFocus ? "border-gold bg-gold/15 shadow-[0_0_28px_rgba(214,168,92,0.26)]"
                        : isActive ? "border-violet/60 bg-violet/10"
                        : isMutedAncestor ? "border-dashed border-white/10 bg-white/[0.025]"
                        : isLineage ? "border-blue/50 bg-blue/10"
                        : isNext ? "border-violet/60 bg-violet/10 hover:-translate-y-1 hover:bg-violet/15"
                        : `border-white/12 ${lane?.bg ?? "bg-white/[0.045]"} opacity-85 hover:-translate-y-1 hover:border-blue/60 hover:opacity-100`
                    }`}
                    style={{
                      left: displayBounds.x,
                      top: displayBounds.y,
                      width: displayBounds.width,
                      height: displayBounds.height,
                      opacity: nodeOpacity,
                      pointerEvents: isDeepHidden || isPreviewNode || (!isContainerized && nodeOpacity < 0.18) ? "none" : undefined,
                      transitionDuration: "1150ms",
                      borderColor: isContainerized ? rgba(isFocus || isActive ? "#D6A85C" : laneColor, isFocus || isActive ? 0.72 : Math.max(0.22, nodeOpacity * 0.72)) : undefined,
                      backgroundColor: isContainerized ? rgba(isFocus || isActive ? "#D6A85C" : laneColor, isFocus || isActive ? 0.05 : Math.max(0.014, nodeOpacity * 0.035)) : undefined,
                      boxShadow: isContainerized ? `inset 0 0 76px ${rgba(isFocus || isActive ? "#D6A85C" : laneColor, isFocus || isActive ? 0.1 : 0.045)}` : undefined,
                      zIndex: isContainerized ? 2 + nodeRank : isPreviewNode ? 8 + nodeRank : 30 + nodeRank,
                      cursor: nodeDrag?.id === node.id ? "grabbing" : "grab",
                      transition: "left 1450ms cubic-bezier(0.16, 1, 0.3, 1), top 1450ms cubic-bezier(0.16, 1, 0.3, 1), width 1450ms cubic-bezier(0.16, 1, 0.3, 1), height 1450ms cubic-bezier(0.16, 1, 0.3, 1), opacity 900ms ease, border-color 1450ms cubic-bezier(0.16, 1, 0.3, 1), background-color 1450ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 1450ms cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    {isContainerized ? (
                      <span
                        className="absolute rounded-full border bg-night/75 uppercase tracking-[0.18em] backdrop-blur"
                        style={{
                          left: 22 + morphProgress * 18,
                          top: 18 + morphProgress * 16,
                          maxWidth: Math.min(760, Math.max(420, displayBounds.width * 0.46)),
                          padding: `${containerLabelPaddingY}px ${containerLabelPaddingX}px`,
                          fontSize: containerLabelFontSize,
                          lineHeight: 1.35,
                          borderColor: rgba(isFocus || isActive ? "#D6A85C" : laneColor, 0.5),
                          color: isFocus || isActive ? "#D6A85C" : rgba(laneColor, 0.9),
                          transition: "all 1450ms cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                      >
                        {status} · {scaleMeta[node.scale ?? "life"].label} · {node.title} · 子节点 {node.children.length}
                      </span>
                    ) : isPreviewNode ? (
                      <span
                        className="absolute left-2 top-2 h-2 w-10 rounded-full border"
                        style={{ borderColor: rgba(laneColor, 0.5), backgroundColor: rgba(laneColor, 0.14) }}
                      />
                    ) : (
                      <>
                        <span
                          className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border bg-night shadow-[0_0_14px_rgba(255,255,255,0.2)]"
                          style={{ borderColor: isFocus ? "#D6A85C" : lane?.color ?? "#8FB7FF", backgroundColor: isFocus ? "#D6A85C" : undefined }}
                        />
                        <span className={`flex items-center justify-between gap-2 uppercase text-mist ${isCompact ? "text-[8px] tracking-[0.12em]" : "text-[10px] tracking-[0.18em]"}`}>
                          <span>{node.marker}</span>
                          <span className={isFocus ? "text-gold" : isActive || isNext ? "text-violet" : isLineage ? "text-blue" : "text-mist"}>{status}</span>
                        </span>
                        <span className={`mt-2 block leading-5 ${isCompact ? "text-xs" : "text-sm"}`}>{node.title}</span>
                        <span className={`mt-2 line-clamp-2 block text-mist ${isCompact ? "text-[10px] leading-4" : "text-xs leading-5"}`}>{node.subtitle}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-night/50 p-4">
          <p className="mb-3 text-xs text-blue">当前读取路线</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {zoomFocusLineage.map((path, index) => (
              <button key={path.id} onClick={() => previewNode(path)} className="rounded-full border border-white/15 px-3 py-1 text-mist hover:border-gold hover:text-gold">
                {index + 1}. {path.title.replace(/^第 \d+ [^：]*：/, "")}
              </button>
            ))}
          </div>
        </div>
      </div>

      <article className="rounded-[2rem] border border-white/15 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gold">
              {zoomFocusPath.timeSpan?.durationLabel ?? scaleMeta[zoomFocusPath.scale ?? "life"].label} · {zoomFocusLayoutNode ? `X${Math.round(zoomFocusLayoutNode.x)} / Y${Math.round(zoomFocusLayoutNode.y)}` : "已读取"}
            </p>
            <h4 className="mt-2 text-2xl">{zoomFocusPath.title}</h4>
            <p className="mt-1 text-mist">{zoomFocusPath.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {nextScale && (
              <button onClick={() => changeZoomScale(nextScale)} className="rounded-full border border-blue/40 px-5 py-3 text-blue hover:bg-blue/10">
                放大到{scaleMeta[nextScale].label}
              </button>
            )}
            {zoomFocusPath.id === ROOT_NODE_ID ? (
              <button type="button" disabled className="rounded-full border border-white/15 px-5 py-3 text-mist opacity-70">
                先选择一条岔路
              </button>
            ) : (
              <button aria-label={`和${zoomFocusPath.futureSelfName}聊聊：${zoomFocusPath.title}`} onClick={() => onSelect(zoomFocusPath)} className="rounded-full bg-gradient-to-r from-gold to-violet px-5 py-3 text-night">
                进入这个时间点的我
              </button>
            )}
          </div>
        </div>
        <p className="my-5 text-sm leading-7">{zoomFocusPath.summary}</p>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-blue/20 bg-blue/10 p-4">
              <p className="text-xs text-blue">这个节点可能带来</p>
              <ul className="mt-3 space-y-2 text-sm text-mist">
                {zoomFocusPath.gains.map((gain) => (
                  <li key={gain}>+ {gain}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-violet/20 bg-violet/10 p-4">
              <p className="text-xs text-violet">这个节点可能带走</p>
              <ul className="mt-3 space-y-2 text-sm text-mist">
                {zoomFocusPath.costs.map((cost) => (
                  <li key={cost}>- {cost}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-night/50 p-4">
            <p className="mb-3 text-xs text-gold">状态变量</p>
            <div className="grid gap-3">
              {zoomFocusPath.stateVector ? (
                stateLabels.map(([key, label]) => <StateBar key={key} label={label} value={zoomFocusPath.stateVector?.[key] ?? 0} warm={key === "regret" || key === "uncertainty"} />)
              ) : (
                <p className="text-sm text-mist">这个节点暂时没有状态变量。</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {zoomFocusPath.consequences?.slice(0, 4).map((item) => (
            <span key={item.label} className="rounded-full border border-white/15 px-3 py-1 text-mist">
              {item.label} {Object.values(item.delta)[0] && Object.values(item.delta)[0]! > 0 ? "+" : ""}
              {Object.values(item.delta)[0]}
            </span>
          ))}
          {zoomFocusPath.mergeInto && <span className="rounded-full border border-gold/40 px-3 py-1 text-gold">可能在后续与 {zoomFocusPath.mergeInto} 合流</span>}
        </div>
        <p className="mt-4 text-xs text-mist">这个时间点的语气：{zoomFocusPath.futureSelfVoice}</p>
      </article>
    </section>
  );
}
