import { useMemo } from "react";
import { ForkPath, SelfSkill } from "@/lib/types";

const ROOT_NODE_ID = "lifefork-save-root";
const NODE_WIDTH = 232;
const NODE_HEIGHT = 112;
const X_STEP = 294;
const Y_GAP = 34;
const PAD_X = 32;
const PAD_Y = 32;

type LayoutNode = {
  id: string;
  title: string;
  subtitle: string;
  futureSelfName: string;
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  path?: ForkPath;
  children: LayoutNode[];
};

type LayoutLink = {
  from: LayoutNode;
  to: LayoutNode;
};

function flattenForks(paths: ForkPath[]): ForkPath[] {
  return paths.flatMap((path) => [path, ...flattenForks(path.children ?? [])]);
}

function getAncestry(active: ForkPath, all: ForkPath[]) {
  const byId = new Map(all.map((path) => [path.id, path]));
  const lineage: ForkPath[] = [];
  let cursor: ForkPath | undefined = active;

  while (cursor) {
    lineage.unshift(cursor);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }

  return lineage;
}

function depthLabel(depth?: number) {
  if (!depth) return "起点";
  return `第 ${depth} 个可读节点`;
}

function toLayoutNode(path: ForkPath): LayoutNode {
  return {
    id: path.id,
    title: path.title,
    subtitle: path.subtitle,
    futureSelfName: path.futureSelfName,
    depth: path.depth ?? 1,
    x: 0,
    y: 0,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    path,
    children: (path.children ?? []).map(toLayoutNode),
  };
}

function buildTreeLayout(selfSkill: SelfSkill) {
  const root: LayoutNode = {
    id: ROOT_NODE_ID,
    title: "存档起点",
    subtitle: selfSkill.questions.currentChoice || "当前人生岔路",
    futureSelfName: "现在的你",
    depth: 0,
    x: 0,
    y: 0,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    children: selfSkill.forks.map(toLayoutNode),
  };

  let leafIndex = 0;

  const assign = (node: LayoutNode, depth: number) => {
    node.depth = depth;
    node.x = depth * X_STEP;

    if (!node.children.length) {
      node.y = leafIndex * (NODE_HEIGHT + Y_GAP);
      leafIndex += 1;
      return;
    }

    node.children.forEach((child) => assign(child, depth + 1));
    const first = node.children[0];
    const last = node.children[node.children.length - 1];
    node.y = (first.y + last.y) / 2;
  };

  assign(root, 0);

  const nodes: LayoutNode[] = [];
  const links: LayoutLink[] = [];

  const collect = (node: LayoutNode) => {
    nodes.push(node);
    node.children.forEach((child) => {
      links.push({ from: node, to: child });
      collect(child);
    });
  };

  collect(root);

  const maxX = Math.max(...nodes.map((node) => node.x + node.width));
  const maxY = Math.max(...nodes.map((node) => node.y + node.height));

  return {
    nodes,
    links,
    width: maxX + PAD_X * 2,
    height: maxY + PAD_Y * 2,
  };
}

function connectorPath(from: LayoutNode, to: LayoutNode) {
  const startX = from.x + from.width + PAD_X;
  const startY = from.y + from.height / 2 + PAD_Y;
  const endX = to.x + PAD_X;
  const endY = to.y + to.height / 2 + PAD_Y;
  const bend = Math.max(80, (endX - startX) * 0.42);

  return `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`;
}

export function ForkPaths({
  selfSkill,
  activePathId,
  onPreview,
  onSelect,
}: {
  selfSkill: SelfSkill;
  activePathId?: string;
  onPreview: (path: ForkPath) => void;
  onSelect: (path: ForkPath) => void;
}) {
  const allForks = useMemo(() => flattenForks(selfSkill.forks), [selfSkill.forks]);
  const activeId = activePathId ?? "node-test-first";
  const activePath = useMemo(() => allForks.find((path) => path.id === activeId) ?? selfSkill.forks[0], [activeId, allForks, selfSkill.forks]);
  const layout = useMemo(() => buildTreeLayout(selfSkill), [selfSkill]);
  const lineage = getAncestry(activePath, allForks);
  const lineageIds = new Set(lineage.map((path) => path.id));
  const directChildIds = new Set((activePath.children ?? []).map((path) => path.id));
  const activeLayoutNode = layout.nodes.find((node) => node.id === activePath.id);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm tracking-[0.2em] text-blue">Chapter Save Flow</p>
        <h3 className="mt-2 text-2xl">人生存档读取树</h3>
        <p className="mt-2 max-w-3xl text-sm text-mist">
          每个发光节点都是一个可读取的存档点。你可以在任意人生节点停下、回看前序路线、读取那个阶段的自己。
        </p>
      </div>

      <div className="rounded-[2rem] border border-white/15 bg-white/5 p-4 shadow-glow">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-2 pb-4 text-xs text-mist">
          <span>当前读取：{activePath.futureSelfName}</span>
          <span>节点数：{allForks.length + 1}</span>
          <span>核心冲突：{selfSkill.semantic.innerConflict}</span>
        </div>

        <div className="mt-4 max-h-[680px] overflow-auto rounded-[1.5rem] border border-white/10 bg-[#050814]/90">
          <div className="relative" style={{ width: layout.width, height: layout.height }}>
            <svg className="pointer-events-none absolute inset-0" width={layout.width} height={layout.height} role="img" aria-label="LifeFork life branch tree connectors">
              <defs>
                <filter id="tree-glow">
                  <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {layout.links.map((link) => {
                const isLineage = link.to.id === activePath.id || (lineageIds.has(link.to.id) && (link.from.id === ROOT_NODE_ID || lineageIds.has(link.from.id)));
                const isNext = link.from.id === activePath.id;
                const stroke = isLineage ? "#D6A85C" : isNext ? "#B18CFF" : "rgba(143,183,255,0.24)";
                const opacity = isLineage || isNext ? 0.95 : 0.42;

                return (
                  <path
                    key={`${link.from.id}-${link.to.id}`}
                    d={connectorPath(link.from, link.to)}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={isLineage ? 2.4 : 1.4}
                    opacity={opacity}
                    filter={isLineage || isNext ? "url(#tree-glow)" : undefined}
                  />
                );
              })}
            </svg>

            {layout.nodes.map((node) => {
              const isRoot = node.id === ROOT_NODE_ID;
              const isActive = node.id === activePath.id;
              const isLineage = lineageIds.has(node.id);
              const isNext = directChildIds.has(node.id);
              const status = isRoot ? "存档起点" : isActive ? "读取中" : isLineage ? "已读取" : isNext ? "可继续" : "未探索";

              return (
                <button
                  key={node.id}
                  type="button"
                  disabled={isRoot}
                  onClick={() => node.path && onPreview(node.path)}
                  className={`absolute rounded-[1.35rem] border p-4 text-left transition ${
                    isRoot
                      ? "cursor-default border-blue/50 bg-blue/15"
                      : isActive
                        ? "border-gold bg-gold/15 shadow-[0_0_28px_rgba(214,168,92,0.26)]"
                        : isLineage
                          ? "border-blue/50 bg-blue/10"
                          : isNext
                            ? "border-violet/60 bg-violet/10 hover:-translate-y-1 hover:bg-violet/15"
                            : "border-white/12 bg-white/[0.045] opacity-80 hover:-translate-y-1 hover:border-blue/60 hover:opacity-100"
                  }`}
                  style={{ left: node.x + PAD_X, top: node.y + PAD_Y, width: NODE_WIDTH, height: NODE_HEIGHT }}
                >
                  <span
                    className={`absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border ${
                      isActive ? "border-gold bg-gold shadow-[0_0_18px_rgba(214,168,92,0.75)]" : isLineage ? "border-blue bg-blue/80" : isNext ? "border-violet bg-violet/80" : "border-white/20 bg-night"
                    }`}
                  />
                  <span className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.18em] text-mist">
                    <span>{isRoot ? "SAVE ROOT" : node.futureSelfName}</span>
                    <span className={isActive ? "text-gold" : isNext ? "text-violet" : isLineage ? "text-blue" : "text-mist"}>{status}</span>
                  </span>
                  <span className="mt-2 block text-sm leading-5">{node.title}</span>
                  <span className="mt-2 line-clamp-2 block text-xs leading-5 text-mist">{node.subtitle}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-night/50 p-4">
          <p className="mb-3 text-xs text-blue">当前读取路线</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {lineage.map((path, index) => (
              <button key={path.id} onClick={() => onPreview(path)} className="rounded-full border border-white/15 px-3 py-1 text-mist hover:border-gold hover:text-gold">
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
              {depthLabel(activePath.depth)} · {activeLayoutNode ? `X${Math.round(activeLayoutNode.x)} / Y${Math.round(activeLayoutNode.y)}` : "已读取"}
            </p>
            <h4 className="mt-2 text-2xl">{activePath.title}</h4>
            <p className="mt-1 text-mist">{activePath.subtitle}</p>
          </div>
          <button aria-label={`和${activePath.futureSelfName}聊聊：${activePath.title}`} onClick={() => onSelect(activePath)} className="rounded-full bg-gradient-to-r from-gold to-violet px-5 py-3 text-night">
            进入这个节点的我
          </button>
        </div>
        <p className="my-5 text-sm leading-7">{activePath.summary}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-blue/20 bg-blue/10 p-4">
            <p className="text-xs text-blue">这个节点可能带来</p>
            <ul className="mt-3 space-y-2 text-sm text-mist">
              {activePath.gains.map((gain) => (
                <li key={gain}>+ {gain}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-violet/20 bg-violet/10 p-4">
            <p className="text-xs text-violet">这个节点可能带走</p>
            <ul className="mt-3 space-y-2 text-sm text-mist">
              {activePath.costs.map((cost) => (
                <li key={cost}>- {cost}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-4 text-xs text-mist">这个节点的语气：{activePath.futureSelfVoice}</p>
      </article>
    </section>
  );
}
