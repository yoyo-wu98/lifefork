import { ForkPath } from "@/lib/types";

export function ForkPaths({ paths, onSelect }: { paths: ForkPath[]; onSelect: (path: ForkPath) => void }) {
  return (
    <section className="space-y-4">
      <h3 className="text-2xl">人生岔路模拟</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {paths.map((path) => (
          <article key={path.id} className={`rounded-3xl border p-5 ${path.id === "path-c" ? "border-gold bg-gold/10" : "border-white/15 bg-white/5"}`}>
            <p className="mb-2 text-lg">{path.title}</p>
            <p className="text-sm text-mist">{path.subtitle}</p>
            <p className="my-3 text-sm">{path.summary}</p>
            <p className="text-xs text-blue">你可能得到</p>
            <ul className="mb-3 text-sm text-mist">{path.gains.map((g) => <li key={g}>+ {g}</li>)}</ul>
            <p className="text-xs text-violet">你可能付出</p>
            <ul className="mb-3 text-sm text-mist">{path.costs.map((g) => <li key={g}>- {g}</li>)}</ul>
            <button onClick={() => onSelect(path)} className="rounded-full bg-gradient-to-r from-blue to-violet px-4 py-2 text-sm">
              和这个版本的我聊聊
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
