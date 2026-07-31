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
  const [confirmedIds, setConfirmedIds] = useState<string[]>([]);

  if (!selfSkill) return null;

  const nodes = selfSkill.timeline;

  const setNodes = (updated: TimelineNode[]) => {
    setTimelineNodes(updated);
  };

  const handleNext = () => {
    setBadge("方案对比已生成");
    setStep("forks");
  };

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-medium text-blue">Timeline</p>
        <h3 className="mt-1 text-2xl font-semibold text-ink">影响当前选择的时间线</h3>
        <p className="mt-2 text-sm leading-6 text-mist">
          请检查每个节点是否准确。修改会立即更新个人分析和方案地图；已经生成的方案不会自动重算。
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
                  aria-label={`${node.yearLabel}节点标题`}
                  maxLength={160}
                  value={node.title}
                  onChange={(e) =>
                    setNodes(nodes.map((n) => (n.id === node.id ? { ...n, title: e.target.value } : n)))
                  }
                />
                <input
                  className="w-full rounded-lg border border-night/10 bg-deep/70 p-2 text-sm outline-none focus:border-blue"
                  aria-label={`${node.yearLabel}节点情绪`}
                  maxLength={120}
                  value={node.emotion}
                  onChange={(e) =>
                    setNodes(nodes.map((n) => (n.id === node.id ? { ...n, emotion: e.target.value } : n)))
                  }
                />
                <textarea
                  className="w-full rounded-lg border border-night/10 bg-deep/70 p-2 text-sm outline-none focus:border-blue"
                  aria-label={`${node.yearLabel}节点模式`}
                  maxLength={300}
                  value={node.pattern}
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
                className={`rounded-lg border px-3 py-1 transition ${
                  confirmedIds.includes(node.id)
                    ? "border-gold/30 bg-gold/10 text-gold"
                    : "border-emerald-500/40 text-emerald-700 hover:bg-emerald-50"
                }`}
                onClick={() =>
                  setConfirmedIds((ids) =>
                    ids.includes(node.id) ? ids : [...ids, node.id],
                  )
                }
              >
                {confirmedIds.includes(node.id) ? "已确认 ✓" : "内容准确"}
              </button>
              <button
                type="button"
                className="rounded-lg border border-night/15 px-3 py-1 text-mist hover:bg-deep hover:text-ink"
                onClick={() => setEditingId(editingId === node.id ? null : node.id)}
              >
                {editingId === node.id ? "完成编辑" : "我要修改"}
              </button>
              <button
                type="button"
                className="rounded-lg border border-red-300/50 px-3 py-1 text-red-700 hover:bg-red-50"
                onClick={() => deleteTimelineNode(node.id)}
              >
                删除
              </button>
            </div>
          </article>
        ))}
      </div>
      <button
        type="button"
        onClick={handleNext}
        className="rounded-lg bg-night px-5 py-3 text-sm font-medium text-deep shadow-quiet"
      >
        继续查看方案地图
      </button>
    </section>
  );
}
