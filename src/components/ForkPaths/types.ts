import type { ForkPath, LifeLane, LifeScale } from "@/lib/types";

export type LayoutNode = {
  id: string;
  title: string;
  subtitle: string;
  marker: string;
  scale?: LifeScale;
  lane?: LifeLane;
  x: number;
  y: number;
  width: number;
  height: number;
  container?: LayoutBounds;
  path?: ForkPath;
  children: LayoutNode[];
};

export type LayoutLink = {
  from: LayoutNode;
  to: LayoutNode;
};

export type LayoutFrame = {
  id: string;
  title: string;
  label: string;
  scale: LifeScale;
  lane?: LifeLane;
  x: number;
  y: number;
  width: number;
  height: number;
  childCount: number;
};

export type LayoutBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type NodeOffset = {
  x: number;
  y: number;
};

export type FocusMode = "single" | "parent-self" | "self-children";

export type NodeDragState = {
  id: string;
  pointerId: number;
  lastX: number;
  lastY: number;
};
