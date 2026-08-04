"use client";

import { useState } from "react";
import { useLifeforkStore } from "@/lib/stores/lifeforkStore";
import type { TimelineNode } from "@/lib/types";

/**
 * Editable life timeline.
 * Users can confirm, edit, or delete timeline nodes generated from their answers.
 */
export function TimelineView() {
  const selfSkill = useLifeforkStore((s) => s.selfSkill);
  const setStep = useLifeforkStore((s) => s.setStep);
  const setBadge = useLifeforkStore((s) => s.setBadge);
  const setTimelineNodes = useLifeforkStore((s) => s.setTimelineNodes);
  const deleteTimelineNode = useLifeforkStore((s) => s.deleteTimelineNode);

  const [editingId, setEditingId] = useState<string | null>(null);

  if (!selfSkill) return null;

  const nodes = selfSkill.timeline;
  const confirmedIds = selfSkill.confirmedTimelineNodeIds ?? [];

  const setNodes = (updated: TimelineNode[]) => {
    setTimelineNodes(updated);
  };

  const toggleConfirmed = (nodeId: string) => {
    const next = confirmedIds.includes(nodeId)
      ? confirmedIds.filter((item) => item !== nodeId)
      : [...confirmedIds, nodeId];
    useLifeforkStore.setState((state) => ({
      selfSkill: state.selfSkill
        ? { ...state.selfSkill, confirmedTimelineNodeIds: next }
        : state.selfSkill,
    }));
    // Persist via the existing selfSkill save path.
    const updated = useLifeforkStore.getState().selfSkill;
    if (updated) {
      import("@/lib/storage").then(({ saveSelfSkill }) => saveSelfSkill(updated));
    }
  };

  const addNode = () => {
    const newNode: TimelineNode = {
      id: `user-added-${crypto.randomUUID()}`,
      yearLabel: "新增节点",
      title: "",
      emotion: "",
      pattern: "",
    };
    setNodes([...nodes, newNode]);
    setEditingId(newNode.id);
  };

  const handleNext = () => {
    setBadge("方案对比已生成");
    setStep("forks");
  };

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-medium text-blue">时间线</p>
        <h3 className="mt-1 text-2xl font-semibold text-ink">影响当前选择的时间线</h3>
        <p className="mt-2 text-sm leading-6 text-mist">
          请检查每个节点是否准确。修改会立即更新个人分析和方案地图；已经生成的方案不会自动重算——如需让方案匹配新的时间线，请回到首页重新生成。
        </p>
        <p className="mt-2 text-xs text-mist">
          已确认 {confirmedIds.length} / {nodes.length} 个节点。确认只是自我核对辅助，不影响后续生成。
        </p>
      </div>
      <div className="space-y-4 border-l border-night/15 pl-4">
        {nodes.map((node) => (
          <article key={node.id} className="rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] p-4 shadow-sm">
            <p className="text-xs font-medium text-blue">{node.yearLabel}</p>
            {editingId === node.id ? (
              <div className="space-y-2">
                <input
                  className="w-full rounded-lg border border-night/10 bg-deep/70 p-2 text-sm outline-none focus:border-blue"
                  aria-label={`${node.yearLabel}节点年份/阶段`}
                  maxLength={40}
                  value={node.yearLabel}
                  placeholder="例如：2019 · 20 岁"
                  onChange={(e) =>
                    setNodes(nodes.map((n) => (n.id === node.id ? { ...n, yearLabel: e.target.value } : n)))
                  }
                />
                <input
                  className="w-full rounded-lg border border-night/10 bg-deep/70 p-2 text-sm outline-none focus:border-blue"
                  aria-label={`${node.yearLabel}节点标题`}
                  maxLength={160}
                  value={node.title}
                  placeholder="这段经历的一句话概括"
                  onChange={(e) =>
                    setNodes(nodes.map((n) => (n.id === node.id ? { ...n, title: e.target.value } : n)))
                  }
                />
                <input
                  className="w-full rounded-lg border border-night/10 bg-deep/70 p-2 text-sm outline-none focus:border-blue"
                  aria-label={`${node.yearLabel}节点情绪`}
                  maxLength={120}
                  value={node.emotion}
                  placeholder="当时的情绪，例如：紧张、兴奋、迷茫"
                  onChange={(e) =>
                    setNodes(nodes.map((n) => (n.id === node.id ? { ...n, emotion: e.target.value } : n)))
                  }
                />
                <textarea
                  className="w-full rounded-lg border border-night/10 bg-deep/70 p-2 text-sm outline-none focus:border-blue"
                  aria-label={`${node.yearLabel}节点模式`}
                  maxLength={300}
                  value={node.pattern}
                  placeholder="这段经历形成的模式，例如：遇到压力先回避"
                  onChange={(e) =>
                    setNodes(nodes.map((n) => (n.id === node.id ? { ...n, pattern: e.target.value } : n)))
                  }
                />
              </div>
            ) : (
              <>
                <p className="mt-1 text-lg font-medium text-ink">{node.title}</p>
                <p className="mt-2 text-sm text-mist">情绪：{node.emotion}</p>
                <p className="mt-1 text-sm leading-6 text-mist">{node.pattern}</p>
                {node.voice && (
                  <div className="mt-3 rounded-lg border border-gold/20 bg-gold/10 p-3 text-xs">
                    <p className="font-medium text-gold">这个阶段的语气：{node.voice.toneName}</p>
                    <p className="mt-1 text-mist">{node.voice.description}</p>
                    <p className="mt-1 text-blue">&ldquo;{node.voice.sampleLine}&rdquo;</p>
                  </div>
                )}
              </>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                className={`min-h-11 rounded-lg border px-4 py-2 transition ${
                  confirmedIds.includes(node.id)
                    ? "border-gold/30 bg-gold/10 text-gold"
                    : "border-emerald-500/40 text-emerald-700 hover:bg-emerald-50"
                }`}
                onClick={() => toggleConfirmed(node.id)}
              >
                {confirmedIds.includes(node.id) ? "已确认 ✓" : "内容准确"}
              </button>
              <button
                type="button"
                className="min-h-11 rounded-lg border border-night/15 px-4 py-2 text-mist hover:bg-deep hover:text-ink"
                onClick={() => setEditingId(editingId === node.id ? null : node.id)}
              >
                {editingId === node.id ? "完成编辑" : "我要修改"}
              </button>
              <button
                type="button"
                className="min-h-11 rounded-lg border border-red-300/50 px-4 py-2 text-red-700 hover:bg-red-50"
                onClick={() => deleteTimelineNode(node.id)}
              >
                删除
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={addNode}
          className="rounded-lg border border-night/15 px-5 py-3 text-sm text-ink hover:bg-deep"
        >
          ＋ 添加一个节点
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="rounded-lg bg-night px-5 py-3 text-sm font-medium text-deep shadow-quiet"
        >
          继续查看方案地图
        </button>
      </div>
    </section>
  );
}

