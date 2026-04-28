import type { LifeScale, ForkPath, SelfSkill } from "@/lib/types";
import type { LayoutNode, LayoutBounds, NodeOffset } from "./types";
import {
  ROOT_NODE_ID, HISTORY_BIRTH_ID, HISTORY_EARLY_ID, HISTORY_PAST_ID, HISTORY_HIDDEN_ID,
  ROOT_FRAME, PAD_X, PAD_Y,
  scaleOrder, scaleMeta, cameraZoom, MIN_CAMERA_ZOOM, MAX_CAMERA_ZOOM,
  frameByScale,
} from "./constants";

// ── Scale utilities ───────────────────────────────────────────────────

export function scaleRank(scale?: LifeScale) {
  return Math.max(0, scaleOrder.indexOf(scale ?? "life"));
}

export function clampZoom(value: number) {
  return Math.min(MAX_CAMERA_ZOOM, Math.max(MIN_CAMERA_ZOOM, value));
}

export function scaleForZoom(zoom: number): LifeScale {
  for (let index = 0; index < scaleOrder.length - 1; index += 1) {
    const current = scaleOrder[index];
    const next = scaleOrder[index + 1];
    const threshold = (cameraZoom[current] + cameraZoom[next]) / 2;
    if (zoom < threshold) return current;
  }

  return scaleOrder[scaleOrder.length - 1];
}

// ── Color utilities ──────────────────────────────────────────────────

export function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  const normalized = value.length === 3 ? value.split("").map((char) => char + char).join("") : value;
  const parsed = Number.parseInt(normalized, 16);

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

export function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Path data creation ───────────────────────────────────────────────

export function createCurrentPath(selfSkill: SelfSkill): ForkPath {
  return {
    id: ROOT_NODE_ID,
    parentId: HISTORY_HIDDEN_ID,
    nodeType: "life-node",
    scale: "hour",
    timeSpan: { startLabel: "此刻", durationLabel: "现在" },
    title: "现在的生活点",
    subtitle: selfSkill.questions.currentChoice || "你此刻正在站立的地方",
    summary: "这里是过去时间线抵达此刻的交汇点。出生、早年、关键记忆和暗线从左侧汇入这里，未来的分支从这里继续向右长出。",
    gains: ["所有选择从这里开始", "可以向外观察不同尺度", "能随时回到现在校准方向"],
    costs: ["还没有替你做出选择", "需要你继续把真实材料放进来", "未来仍然保持开放"],
    futureSelfName: "现在的你",
    futureSelfVoice: "贴近、清醒，像刚把地图摊开",
    children: selfSkill.forks,
  };
}

export function createHistoryPaths(selfSkill: SelfSkill): ForkPath[] {
  const pastNode = selfSkill.timeline.find((node) => node.yearLabel === "过去") ?? selfSkill.timeline[0];
  const hiddenNode = selfSkill.timeline.find((node) => node.yearLabel === "暗线") ?? selfSkill.timeline[1];

  return [
    {
      id: HISTORY_BIRTH_ID,
      nodeType: "life-node",
      scale: "decade",
      timeSpan: { startLabel: "出生", durationLabel: "生命开始" },
      title: "出生：第一条时间线开始",
      subtitle: "你还没有做出选择，但已经进入世界。",
      summary: "人生地图的最左端。这里不承载判断，只标记一条从身体、家庭和环境开始的连续线。",
      gains: ["生命线被放到地图上", "所有后续节点有了起点", "过去和未来可以被同一条轴连接"],
      costs: ["细节仍需要你补充", "这只是 V0 的粗粒度起点", "早期记忆需要之后继续细化"],
      futureSelfName: "最早的你",
      futureSelfVoice: "安静、模糊，像一张尚未显影的底片",
      stateVector: { autonomy: 10, stability: 48, intimacy: 60, creation: 18, energy: 55, regret: 0, uncertainty: 90 },
    },
    {
      id: HISTORY_EARLY_ID,
      parentId: HISTORY_BIRTH_ID,
      nodeType: "life-node",
      scale: "year",
      timeSpan: { startLabel: "早年", durationLabel: "成长阶段" },
      title: "早年：被世界塑形",
      subtitle: "一些说法、习惯和期待开始进入你。",
      summary: "这一段代表你逐渐学会如何表达、退让、争取、隐藏和适应。后续的很多选择，会带着这里留下的语气。",
      gains: ["形成基本安全感", "学会理解别人", "开始长出自己的表达方式"],
      costs: ["也会学会压下某些愿望", "一些边界还没有名字", "早期期待会影响后来的选择"],
      futureSelfName: "早年的你",
      futureSelfVoice: "轻、试探、容易把真实话收回去",
      stateVector: { autonomy: 24, stability: 56, intimacy: 66, creation: 30, energy: 62, regret: 8, uncertainty: 76 },
    },
    {
      id: HISTORY_PAST_ID,
      parentId: HISTORY_EARLY_ID,
      nodeType: "life-node",
      scale: "year",
      timeSpan: { startLabel: pastNode?.yearLabel ?? "过去", durationLabel: "关键过去节点" },
      title: pastNode?.title || "一个尚未被重新理解的节点",
      subtitle: pastNode?.emotion || "复杂、迟疑、仍有回声",
      summary: pastNode?.pattern || "这里可能藏着你后来很多选择的原型。",
      gains: ["过去节点被放回时间轴", "当前选择有了来处", "可以继续补充证据"],
      costs: ["回看会带来情绪波动", "V0 还不能还原所有细节", "有些解释需要你修正"],
      futureSelfName: "过去节点里的你",
      futureSelfVoice: pastNode?.voice?.description ?? "带着当时的语气，谨慎地重新开口",
      stateVector: { autonomy: 42, stability: 50, intimacy: 54, creation: 44, energy: 48, regret: 38, uncertainty: 66 },
    },
    {
      id: HISTORY_HIDDEN_ID,
      parentId: HISTORY_PAST_ID,
      nodeType: "life-node",
      scale: "month",
      timeSpan: { startLabel: "暗线", durationLabel: "隐藏自我" },
      title: hiddenNode?.title || "一个没有被充分表达的自己",
      subtitle: hiddenNode?.emotion || "压抑、等待、想被看见",
      summary: hiddenNode?.pattern || "你把某部分自己藏了起来，但它仍在影响你的选择。",
      gains: ["隐藏愿望被命名", "现在的张力更容易被理解", "未来分支有了心理来源"],
      costs: ["承认它需要勇气", "它可能挑战现有生活叙事", "你需要决定如何安放它"],
      futureSelfName: "暗线里的你",
      futureSelfVoice: hiddenNode?.voice?.description ?? "敏感、低声，但比表面更真实",
      stateVector: { autonomy: 54, stability: 46, intimacy: 52, creation: 58, energy: 45, regret: 46, uncertainty: 58 },
    },
  ];
}

// ── Bounds utility functions ──────────────────────────────────────────

export function nodeBounds(node?: LayoutNode): LayoutBounds | undefined {
  if (!node) return undefined;

  return {
    x: node.x + PAD_X,
    y: node.y + PAD_Y,
    width: node.width,
    height: node.height,
  };
}

export function collectLayoutDescendants(node: LayoutNode): LayoutNode[] {
  return node.children.flatMap((child) => [child, ...collectLayoutDescendants(child)]);
}

export function containerBoundsForNode(node: LayoutNode | undefined): LayoutBounds | undefined {
  return node?.container;
}

export function mergeBounds(bounds: Array<LayoutBounds | undefined>): LayoutBounds | undefined {
  const existing = bounds.filter((item): item is LayoutBounds => Boolean(item));
  if (!existing.length) return undefined;

  const minX = Math.min(...existing.map((item) => item.x));
  const minY = Math.min(...existing.map((item) => item.y));
  const maxX = Math.max(...existing.map((item) => item.x + item.width));
  const maxY = Math.max(...existing.map((item) => item.y + item.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function fitZoomForBounds(bounds: LayoutBounds | undefined, viewport: { width: number; height: number }) {
  if (!bounds) return MAX_CAMERA_ZOOM;

  const horizontalRoom = Math.max(280, viewport.width - 150);
  const verticalRoom = Math.max(260, viewport.height - 150);
  const fitZoom = Math.min(horizontalRoom / Math.max(1, bounds.width), verticalRoom / Math.max(1, bounds.height));

  return clampZoom(fitZoom);
}

export function getBoundsCenter(bounds: LayoutBounds) {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
}

export function pointOnHorizontalEdgeToward(bounds: LayoutBounds, target: { x: number; y: number }) {
  const center = getBoundsCenter(bounds);
  const edgePadding = Math.min(28, Math.max(10, bounds.height * 0.12));

  return {
    x: target.x >= center.x ? bounds.x + bounds.width : bounds.x,
    y: Math.min(bounds.y + bounds.height - edgePadding, Math.max(bounds.y + edgePadding, target.y)),
  };
}

// ── Fork tree utilities ──────────────────────────────────────────────

export function flattenForks(paths: ForkPath[]): ForkPath[] {
  return paths.flatMap((path) => [path, ...flattenForks(path.children ?? [])]);
}

export function getAncestry(active: ForkPath, all: ForkPath[]) {
  const byId = new Map(all.map((path) => [path.id, path]));
  const lineage: ForkPath[] = [];
  let cursor: ForkPath | undefined = active;

  while (cursor) {
    lineage.unshift(cursor);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }

  return lineage;
}

// ── Node display utilities ────────────────────────────────────────────

export function getNodeMarker(path: ForkPath) {
  const scale = path.scale ?? "life";
  const time = path.timeSpan;
  if (time?.startLabel && time?.endLabel) return `${scaleMeta[scale].label} · ${time.startLabel} → ${time.endLabel}`;
  if (time?.startLabel) return `${scaleMeta[scale].label} · ${time.startLabel}`;
  return scaleMeta[scale].label;
}

export function getFrameSize(scale?: LifeScale) {
  return scale ? frameByScale[scale] : { ...ROOT_FRAME, label: "Now Frame" };
}
