"use client";

import { useLifeforkStore } from "@/lib/stores/lifeforkStore";

/**
 * Toast notification for transient status messages.
 * Auto-reads from zustand store.
 */
export function BadgeToast() {
  const badge = useLifeforkStore((s) => s.badge);

  if (!badge) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 right-6 z-50 max-w-[calc(100vw-3rem)] rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] px-4 py-3 text-sm text-ink shadow-quiet"
    >
      {badge}
    </div>
  );
}
