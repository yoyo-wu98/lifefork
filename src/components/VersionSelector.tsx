"use client";

import { useLifeforkStore } from "@/lib/stores/lifeforkStore";
import type { SelfVersion } from "@/lib/types";

const options: { id: SelfVersion; title: string; desc: string }[] = [
  { id: "future", title: "未来的我", desc: "看看五年后的你会怎样回望今天。" },
  { id: "past", title: "过去的我", desc: "重新理解那个曾经做出选择的自己。" },
  { id: "fork", title: "另一条路上的我", desc: "和未选择人生中的你短暂重逢。" },
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
    setBadge("第一声回音");
    setStep("questions");
  };

  return (
    <section className="space-y-6">
      <h2 className="text-2xl">你今天想见哪个版本的自己？</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.id}
            className={`rounded-3xl border p-5 text-left transition ${
              selectedVersion === option.id
                ? "border-blue bg-blue/15"
                : "border-white/15 bg-white/5 hover:bg-white/10"
            }`}
            onClick={() => setSelectedVersion(option.id)}
          >
            <p className="mb-2 text-lg">{option.title}</p>
            <p className="text-sm text-mist">{option.desc}</p>
          </button>
        ))}
      </div>
      <button
        disabled={!selectedVersion}
        className="rounded-full bg-gradient-to-r from-blue to-violet px-6 py-3 disabled:opacity-40"
        onClick={handleNext}
      >
        继续进入这条时间线
      </button>
    </section>
  );
}
