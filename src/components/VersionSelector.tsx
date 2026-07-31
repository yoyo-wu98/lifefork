"use client";

import { useLifeforkStore } from "@/lib/stores/lifeforkStore";
import type { SelfVersion } from "@/lib/types";

const options: { id: SelfVersion; title: string; desc: string }[] = [
  { id: "future", title: "分析未来方案", desc: "比较当前选择在未来几年的可能影响。" },
  { id: "past", title: "分析过去经历", desc: "查看过去经历如何影响现在的判断。" },
  { id: "fork", title: "比较另一种选择", desc: "查看没有选择的方案可能带来什么结果。" },
];

/**
 * Version selector — past self / future self / counterfactual self.
 */
export function VersionSelector() {
  const selectedVersion = useLifeforkStore((s) => s.selectedVersion);
  const setSelectedVersion = useLifeforkStore((s) => s.setSelectedVersion);
  const setStep = useLifeforkStore((s) => s.setStep);
  const setBadge = useLifeforkStore((s) => s.setBadge);

  const handleNext = () => {
    setBadge("已选择分析类型");
    setStep("questions");
  };

  return (
    <section className="space-y-6">
      <h2 className="text-2xl">你先想分析哪类问题？</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.id}
            className={`rounded-lg border p-5 text-left transition ${
              selectedVersion === option.id
                ? "border-night bg-night text-deep"
                : "border-night/10 bg-[oklch(0.99_0.004_92)] hover:bg-deep"
            }`}
            onClick={() => setSelectedVersion(option.id)}
          >
            <p className="mb-2 text-lg">{option.title}</p>
            <p className={`text-sm ${selectedVersion === option.id ? "text-deep/80" : "text-mist"}`}>{option.desc}</p>
          </button>
        ))}
      </div>
      <button
        disabled={!selectedVersion}
        className="rounded-lg bg-night px-5 py-3 text-sm font-medium text-deep shadow-quiet disabled:opacity-40"
        onClick={handleNext}
      >
        开始回答问题
      </button>
    </section>
  );
}
