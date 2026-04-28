import type { LayoutBounds } from "./types";
import { getBoundsCenter, pointOnHorizontalEdgeToward } from "./utils";

/**
 * Generates an SVG cubic bezier path string connecting two LayoutBounds.
 * Handles both nested (containerized) and horizontal edge-to-edge connectors.
 */
export function connectorPath(fromBounds: LayoutBounds, toBounds: LayoutBounds) {
  const fromCenter = getBoundsCenter(fromBounds);
  const toCenter = getBoundsCenter(toBounds);

  const isNested =
    toBounds.x >= fromBounds.x &&
    toBounds.x + toBounds.width <= fromBounds.x + fromBounds.width &&
    toBounds.y >= fromBounds.y &&
    toBounds.y + toBounds.height <= fromBounds.y + fromBounds.height;

  if (isNested) {
    const innerStartX = fromBounds.x + Math.min(112, Math.max(46, fromBounds.width * 0.08));
    const edgePadding = Math.min(28, Math.max(10, fromBounds.height * 0.08));
    const start = {
      x: innerStartX,
      y: Math.min(fromBounds.y + fromBounds.height - edgePadding, Math.max(fromBounds.y + edgePadding, toCenter.y)),
    };
    const end = pointOnHorizontalEdgeToward(toBounds, start);
    const bend = Math.max(58, Math.abs(end.x - start.x) * 0.34);
    return `M ${start.x} ${start.y} C ${start.x + bend} ${start.y}, ${end.x - bend} ${end.y}, ${end.x} ${end.y}`;
  }

  const start = pointOnHorizontalEdgeToward(fromBounds, toCenter);
  const end = pointOnHorizontalEdgeToward(toBounds, fromCenter);
  const dx = end.x - start.x;
  const bend = Math.max(64, Math.abs(dx) * 0.38);
  const direction = dx >= 0 ? 1 : -1;

  return `M ${start.x} ${start.y} C ${start.x + bend * direction} ${start.y}, ${end.x - bend * direction} ${end.y}, ${end.x} ${end.y}`;
}
