import type { ForkPath } from "@/lib/types";

type CurrentRouteBarProps = {
  lineage: ForkPath[];
  onPreviewNode: (path: ForkPath) => void;
};

export function CurrentRouteBar({ lineage, onPreviewNode }: CurrentRouteBarProps) {
  return (
    <div className="mt-5 rounded-lg border border-night/10 bg-deep/70 p-4">
      <p className="mb-3 text-xs font-medium text-blue">当前查看路径</p>
      <div className="flex flex-wrap gap-2 text-xs">
        {lineage.map((path, index) => (
          <button type="button" key={path.id} onClick={() => onPreviewNode(path)} className="rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] px-3 py-1 text-mist hover:border-gold/40 hover:text-gold">
            {index + 1}. {path.title.replace(/^第 \d+ [^：]*：/, "")}
          </button>
        ))}
      </div>
    </div>
  );
}
