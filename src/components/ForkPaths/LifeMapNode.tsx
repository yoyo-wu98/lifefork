import type { PointerEvent } from "react";
import { laneMeta, ROOT_NODE_ID, scaleMeta } from "./constants";
import type { SceneRect, StableSceneNode } from "./model/stableScene";

type LifeMapNodeProps = {
  node: StableSceneNode;
  displayContainer?: SceneRect;
  zoom: number;
  expanded: boolean;
  active: boolean;
  lineage: boolean;
  context: boolean;
  editLayout: boolean;
  dragging: boolean;
  onPreview: (id: string) => void;
  onCycleFocus: (id: string) => void;
  onDragStart: (event: PointerEvent<HTMLButtonElement>, id: string) => void;
};

export function LifeMapNode({
  node,
  displayContainer,
  zoom,
  expanded,
  active,
  lineage,
  context,
  editLayout,
  dragging,
  onPreview,
  onCycleFocus,
  onDragStart,
}: LifeMapNodeProps) {
  const lane = node.path.lane ? laneMeta[node.path.lane] : laneMeta.experiment;
  const container = displayContainer ?? node.container;
  const card = node.card;
  const cardX = card.x - container.x;
  const cardY = card.y - container.y;
  const readableTitleSize = Math.min(30, Math.max(13, 15 / Math.max(0.48, zoom)));
  const readableBodySize = Math.min(26, Math.max(11.5, 13 / Math.max(0.48, zoom)));
  const readableMetaSize = Math.min(22, Math.max(10, 11 / Math.max(0.48, zoom)));
  const opacity = context ? 0.28 : active ? 1 : lineage ? 0.82 : 0.76;
  const status = active ? "当前节点" : context ? "其他方案" : lineage ? "过去经历" : "可查看";
  const scaleLabel = node.id === ROOT_NODE_ID ? "现在" : scaleMeta[node.path.scale ?? "life"].label;

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: container.x,
        top: container.y,
        width: container.width,
        height: container.height,
        zIndex: expanded ? 8 + node.depth : 20 + node.depth,
        opacity,
      }}
      data-scene-node={node.id}
    >
      <div
        className="absolute inset-0 rounded-lg border border-dashed"
        style={{
          borderColor: active ? "oklch(0.72 0.12 78)" : lane.color,
          background: "color-mix(in oklch, var(--lf-map), transparent 22%)",
          opacity: expanded ? 1 : 0,
          transform: expanded ? "scale(1)" : "scale(0.985)",
          transformOrigin: "center",
          transition:
            "transform 380ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms ease-out, border-color 220ms ease-out",
        }}
      />
      <div
        className="absolute rounded-lg border bg-[var(--lf-map-card)]"
        style={{
          left: cardX,
          top: cardY,
          width: card.width,
          height: card.height,
          borderColor: active ? "oklch(0.72 0.12 78)" : lane.color,
          opacity: expanded ? 0 : 1,
          transform: expanded ? "scale(0.96)" : "scale(1)",
          transformOrigin: "center",
          transition:
            "transform 320ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease-out, border-color 180ms ease-out",
        }}
      />

      {expanded ? (
        <button
          type="button"
          data-map-node={node.id}
          className="pointer-events-auto absolute overflow-hidden rounded-lg border bg-[var(--lf-map-label)] px-4 py-3 text-left text-[var(--lf-map-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--lf-blue)]"
          style={{
            left: cardX,
            top: cardY,
            width: card.width,
            minHeight: Math.min(card.height, 96),
            borderColor: active ? "var(--lf-gold)" : lane.color,
            fontSize: readableBodySize,
            lineHeight: 1.4,
          }}
          aria-label={`${node.path.title}，时间容器`}
          onClick={() => {
            if (!editLayout && !dragging) onPreview(node.id);
          }}
          onDoubleClick={(event) => {
            if (editLayout) return;
            event.preventDefault();
            onCycleFocus(node.id);
          }}
          onPointerDown={(event) => {
            if (editLayout) onDragStart(event, node.id);
          }}
        >
          <span className="block text-[var(--lf-map-muted)]" style={{ fontSize: readableMetaSize }}>
            {scaleLabel} · 包含 {node.childrenIds.length} 个直接节点
          </span>
          <span className="mt-1 block font-semibold">{node.path.title}</span>
        </button>
      ) : (
        <button
          type="button"
          data-map-node={node.id}
          className={`pointer-events-auto absolute overflow-hidden rounded-lg border-0 bg-transparent p-4 text-left text-[var(--lf-map-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--lf-blue)] ${
            editLayout ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
          }`}
          style={{
            left: cardX,
            top: cardY,
            width: card.width,
            height: card.height,
          }}
          aria-label={`${node.path.title}，${status}`}
          onClick={() => {
            if (!editLayout && !dragging) onPreview(node.id);
          }}
          onDoubleClick={(event) => {
            if (editLayout) return;
            event.preventDefault();
            onCycleFocus(node.id);
          }}
          onPointerDown={(event) => {
            if (editLayout) onDragStart(event, node.id);
          }}
        >
          <span
            className="flex items-center justify-between gap-3 text-[var(--lf-map-muted)]"
            style={{ fontSize: readableMetaSize, lineHeight: 1.25 }}
          >
            <span>{scaleLabel}</span>
            <span style={{ color: active ? "var(--lf-gold)" : lane.color }}>{status}</span>
          </span>
          <span
            className="mt-2 block font-semibold"
            style={{ fontSize: readableTitleSize, lineHeight: 1.3 }}
          >
            {node.path.title}
          </span>
          <span
            className="mt-2 line-clamp-2 block text-[var(--lf-map-muted)]"
            style={{ fontSize: readableBodySize, lineHeight: 1.45 }}
          >
            {node.path.subtitle}
          </span>
        </button>
      )}
    </div>
  );
}
