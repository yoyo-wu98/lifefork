import { TimelineNode } from "@/lib/types";
import { useState } from "react";

export function TimelineView({ nodes, setNodes, onNext }: { nodes: TimelineNode[]; setNodes: (nodes: TimelineNode[]) => void; onNext: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <section className="space-y-4">
      <h3 className="text-2xl">你的人生时间线</h3>
      <div className="space-y-4 border-l border-blue/40 pl-4">
        {nodes.map((node) => (
          <article key={node.id} className="rounded-2xl border border-white/15 bg-white/5 p-4">
            <p className="text-xs text-blue">{node.yearLabel}</p>
            {editingId === node.id ? (
              <div className="space-y-2">
                <input className="w-full rounded border border-white/15 bg-deep/70 p-2" value={node.title} onChange={(e) => setNodes(nodes.map((n) => (n.id === node.id ? { ...n, title: e.target.value } : n)))} />
                <input className="w-full rounded border border-white/15 bg-deep/70 p-2" value={node.emotion} onChange={(e) => setNodes(nodes.map((n) => (n.id === node.id ? { ...n, emotion: e.target.value } : n)))} />
                <textarea className="w-full rounded border border-white/15 bg-deep/70 p-2" value={node.pattern} onChange={(e) => setNodes(nodes.map((n) => (n.id === node.id ? { ...n, pattern: e.target.value } : n)))} />
              </div>
            ) : (
              <>
                <p className="text-lg">{node.title}</p>
                <p className="text-sm text-mist">情绪：{node.emotion}</p>
                <p className="text-sm text-mist">{node.pattern}</p>
              </>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <button className="rounded-full border border-green-500/50 px-3 py-1">这很准 ✓</button>
              <button className="rounded-full border border-white/20 px-3 py-1" onClick={() => setEditingId(editingId === node.id ? null : node.id)}>
                我要修改
              </button>
              <button className="rounded-full border border-red-400/50 px-3 py-1" onClick={() => setNodes(nodes.filter((n) => n.id !== node.id))}>
                删除
              </button>
            </div>
          </article>
        ))}
      </div>
      <button onClick={onNext} className="rounded-full bg-gradient-to-r from-blue to-violet px-6 py-3">
        继续，查看人生岔路
      </button>
    </section>
  );
}
