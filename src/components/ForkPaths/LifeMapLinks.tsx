import { laneMeta } from "./constants";
import type { StableLifeMapScene } from "./model/stableScene";
import type { SceneVisibility } from "./model/visibility";

type LifeMapLinksProps = {
  scene: StableLifeMapScene;
  visibility: SceneVisibility;
  zoom: number;
};

function connectorPath(
  source: { x: number; y: number },
  target: { x: number; y: number },
) {
  const distance = Math.max(56, Math.abs(target.x - source.x) * 0.42);
  return `M ${source.x} ${source.y} C ${source.x + distance} ${source.y}, ${target.x - distance} ${target.y}, ${target.x} ${target.y}`;
}

export function LifeMapLinks({ scene, visibility, zoom }: LifeMapLinksProps) {
  const hasFocusedRelationship = visibility.highlightedLinkIds.size > 0;

  return (
    <svg
      className="pointer-events-none absolute inset-0 overflow-visible"
      width={scene.worldBounds.x + scene.worldBounds.width}
      height={scene.worldBounds.y + scene.worldBounds.height}
      aria-hidden="true"
    >
      {scene.links.map((link) => {
        if (!visibility.visibleIds.has(link.fromId) || !visibility.visibleIds.has(link.toId)) return null;

        const from = scene.nodeById.get(link.fromId);
        const to = scene.nodeById.get(link.toId);
        if (!from || !to) return null;

        const fromExpanded = visibility.expandedIds.has(from.id);
        const toExpanded = visibility.expandedIds.has(to.id);
        const targetRect = toExpanded
          ? visibility.containerById.get(to.id) ?? to.container
          : to.card;
        const sourceRect = fromExpanded
          ? visibility.containerById.get(from.id) ?? from.container
          : from.card;
        const source = fromExpanded
          ? {
              x: sourceRect.x + 34,
              y: targetRect.y + Math.min(targetRect.height / 2, 54),
            }
          : {
              x: sourceRect.x + sourceRect.width,
              y: sourceRect.y + sourceRect.height / 2,
            };
        const target = toExpanded
          ? {
              x: targetRect.x + 28,
              y: targetRect.y + 44,
            }
          : {
              x: targetRect.x,
              y: targetRect.y + targetRect.height / 2,
            };
        const focused = visibility.highlightedLinkIds.has(link.id);
        const lineage =
          visibility.lineageIds.has(link.fromId) &&
          visibility.lineageIds.has(link.toId);
        const laneColor = to.path.lane ? laneMeta[to.path.lane].color : "oklch(0.68 0.12 245)";
        const opacity = hasFocusedRelationship
          ? focused
            ? 0.94
            : 0.08
          : lineage
            ? 0.72
            : link.kind === "history"
              ? 0.48
              : 0.36;

        return (
          <path
            key={link.id}
            d={connectorPath(source, target)}
            fill="none"
            stroke={focused ? "var(--lf-gold)" : laneColor}
            strokeWidth={(focused ? 2.2 : 1.35) / Math.max(0.42, zoom)}
            opacity={opacity}
            vectorEffect="non-scaling-stroke"
            style={{
              transition: "opacity 180ms ease-out, stroke 180ms ease-out",
            }}
          />
        );
      })}
    </svg>
  );
}
