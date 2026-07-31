import type { LifeScale } from "@/lib/types";
import { scaleMeta, scaleOrder } from "./constants";

type ScaleSidebarProps = {
  zoomScale: LifeScale;
  onChangeScale: (scale: LifeScale) => void;
};

export function ScaleSidebar({ zoomScale, onChangeScale }: ScaleSidebarProps) {
  return (
    <aside className="min-w-0 overflow-hidden rounded-lg border border-night/10 bg-deep/70 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1">
        <span className="shrink-0 text-xs text-blue">尺度</span>
        {scaleOrder.map((scale) => {
          const isActive = zoomScale === scale;
          return (
            <button
              type="button"
              key={scale}
              onClick={() => onChangeScale(scale)}
              title={scaleMeta[scale].hint}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs transition ${
                isActive ? "border-night bg-night text-deep" : "border-night/10 bg-[oklch(0.99_0.004_92)] text-mist hover:border-blue/40 hover:text-blue"
              }`}
            >
              {scaleMeta[scale].label}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
