import type { LifeScale } from "@/lib/types";
import { cameraZoom, MAX_CAMERA_ZOOM, MIN_CAMERA_ZOOM, scaleOrder } from "../constants";
import type { ScenePoint, SceneRect } from "./stableScene";

export type LifeMapCamera = ScenePoint & {
  zoom: number;
};

export function clampCameraZoom(zoom: number) {
  return Math.max(MIN_CAMERA_ZOOM, Math.min(MAX_CAMERA_ZOOM, zoom));
}

export function semanticScaleForZoom(zoom: number): LifeScale {
  for (let index = 0; index < scaleOrder.length - 1; index += 1) {
    const current = scaleOrder[index];
    const next = scaleOrder[index + 1];
    if (zoom < (cameraZoom[current] + cameraZoom[next]) / 2) return current;
  }
  return scaleOrder.at(-1) ?? "hour";
}

export function fitCameraToRect(
  rect: SceneRect,
  viewport: { width: number; height: number },
  options: { padding?: number; minZoom?: number; maxZoom?: number } = {},
): LifeMapCamera {
  const padding = options.padding ?? 54;
  const availableWidth = Math.max(1, viewport.width - padding * 2);
  const availableHeight = Math.max(1, viewport.height - padding * 2);
  const zoom = clampCameraZoom(
    Math.max(
      options.minZoom ?? MIN_CAMERA_ZOOM,
      Math.min(
        options.maxZoom ?? MAX_CAMERA_ZOOM,
        Math.min(availableWidth / Math.max(1, rect.width), availableHeight / Math.max(1, rect.height)),
      ),
    ),
  );
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;

  return {
    zoom,
    x: viewport.width / 2 - centerX * zoom,
    y: viewport.height / 2 - centerY * zoom,
  };
}

export function centerCameraOnRect(
  rect: SceneRect,
  viewport: { width: number; height: number },
  zoom: number,
): LifeMapCamera {
  return {
    zoom,
    x: viewport.width / 2 - (rect.x + rect.width / 2) * zoom,
    y: viewport.height / 2 - (rect.y + rect.height / 2) * zoom,
  };
}

export function zoomCameraAroundPoint(
  camera: LifeMapCamera,
  point: ScenePoint,
  nextZoom: number,
): LifeMapCamera {
  const zoom = clampCameraZoom(nextZoom);
  const worldX = (point.x - camera.x) / camera.zoom;
  const worldY = (point.y - camera.y) / camera.zoom;

  return {
    zoom,
    x: point.x - worldX * zoom,
    y: point.y - worldY * zoom,
  };
}
