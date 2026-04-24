import { SelfVersion } from "@/lib/types";

const options: { id: SelfVersion; title: string; desc: string }[] = [
  { id: "future", title: "未来的我", desc: "看看五年后的你会怎样回望今天。" },
  { id: "past", title: "过去的我", desc: "重新理解那个曾经做出选择的自己。" },
  { id: "fork", title: "另一条路上的我", desc: "和未选择人生中的你短暂重逢。" },
];

export function VersionSelector({ selected, onSelect, onNext }: { selected: SelfVersion | null; onSelect: (v: SelfVersion) => void; onNext: () => void }) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl">你今天想见哪个版本的自己？</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.id}
            className={`rounded-3xl border p-5 text-left transition ${selected === option.id ? "border-blue bg-blue/15" : "border-white/15 bg-white/5 hover:bg-white/10"}`}
            onClick={() => onSelect(option.id)}
          >
            <p className="mb-2 text-lg">{option.title}</p>
            <p className="text-sm text-mist">{option.desc}</p>
          </button>
        ))}
      </div>
      <button disabled={!selected} className="rounded-full bg-gradient-to-r from-blue to-violet px-6 py-3 disabled:opacity-40" onClick={onNext}>
        继续进入这条时间线
      </button>
    </section>
  );
}
