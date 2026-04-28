/**
 * Single state-vector progress bar.
 * Renders a label, numeric value, and percentage-fill bar.
 */
export function StateBar({ label, value, warm }: { label: string; value: number; warm?: boolean }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-mist">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${warm ? "bg-gold" : "bg-blue"}`}
          style={{ width: `${Math.max(4, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
