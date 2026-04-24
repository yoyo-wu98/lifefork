import { generationLines } from "@/lib/copy";

export function GeneratingScreen() {
  return (
    <section className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-8 text-center">
      <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-gradient-to-r from-gold via-blue to-violet" />
      <h3 className="text-2xl">正在召唤你的 Self Skill...</h3>
      <ul className="space-y-2 text-mist">
        {generationLines.map((line, idx) => (
          <li key={line} className="animate-[pulse_2s_ease-in-out_infinite]" style={{ animationDelay: `${idx * 180}ms` }}>
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}
