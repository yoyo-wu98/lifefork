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
  const storeSet = useLifeforkStore.setState;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<string[]>([]);

  if (!selfSkill) return null;

  const nodes = selfSkill.timeline;

  const setNodes = (updated: TimelineNode[]) => {
    storeSet({ selfSkill: { ...selfSkill, timeline: updated } });
  };

  const handleNext = () => {
    setBadge("第三条路发现者");
    setStep("forks");
  };

  return (
    <section className="space-y-4">
      <h3 className="text-2xl">你的人生时间线</h3>
      <div className="space-y-4 border-l border-blue/40 pl-4">
        {nodes.map((node) => (
          <article key={node.id} className="rounded-2xl border border-white/15 bg-white/5 p-4">
            <p className="text-xs text-blue">{node.yearLabel}</p>
            {editingId === node.id ? (
              <div className="space-y-2">
                <input
                  className="w-full rounded border border-white/15 bg-deep/70 p-2"
                  value={node.title}
                  onChange={(e) =>
                    setNodes(nodes.map((n) => (n.id === node.id ? { ...n, title: e.target.value } : n)))
                  }
                />
                <input
                  className="w-full rounded border border-white/15 bg-deep/70 p-2"
                  value={node.emotion}
                  onChange={(e) =>
                    setNodes(nodes.map((n) => (n.id === node.id ? { ...n, emotion: e.target.value } : n)))
                  }
                />
                <textarea
                  className="w-full rounded border border-white/15 bg-deep/70 p-2"
                  value={node.pattern}
                  onChange={(e) =>
                    setNodes(nodes.map((n) => (n.id === node.id ? { ...n, pattern: e.target.value } : n)))
                  }
                />
              </div>
            ) : (
              <>
                <p className="text-lg">{node.title}</p>
                <p className="text-sm text-mist">情绪：{node.emotion}</p>
                <p className="text-sm text-mist">{node.pattern}</p>
                {node.voice && (
                  <div className="mt-3 rounded-2xl border border-gold/20 bg-gold/10 p-3 text-xs">
                    <p className="text-gold">这个阶段的语气：{node.voice.toneName}</p>
                    <p className="mt-1 text-mist">{node.voice.description}</p>
                    <p className="mt-1 text-blue">&ldquo;{node.voice.sampleLine}&rdquo;</p>
                  </div>
                )}
              </>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <button
                className={`rounded-full border px-3 py-1 transition ${
                  confirmedIds.includes(node.id)
                    ? "border-gold bg-gold/15 text-gold"
                    : "border-green-500/50"
                }`}
                onClick={() =>
                  setConfirmedIds((ids) =>
                    ids.includes(node.id) ? ids : [...ids, node.id],
                  )
                }
              >
                {confirmedIds.includes(node.id) ? "已确认 ✓" : "这很准 ✓"}
              </button>
              <button
                className="rounded-full border border-white/20 px-3 py-1"
                onClick={() => setEditingId(editingId === node.id ? null : node.id)}
              >
                我要修改
              </button>
              <button
                className="rounded-full border border-red-400/50 px-3 py-1"
                onClick={() => setNodes(nodes.filter((n) => n.id !== node.id))}
              >
                删除
              </button>
            </div>
          </article>
        ))}
      </div>
      <button
        onClick={handleNext}
        className="rounded-full bg-gradient-to-r from-blue to-violet px-6 py-3"
      >
        继续，打开人生地图
      </button>
    </section>
  );
}
