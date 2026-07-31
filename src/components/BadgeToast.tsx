"use client";

import { useLifeforkStore } from "@/lib/stores/lifeforkStore";

/**
 * Toast notification for achievement badges.
 * Auto-reads from zustand store.
 */
export function BadgeToast() {
  const badge = useLifeforkStore((s) => s.badge);

  if (!badge) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] px-4 py-3 text-sm text-ink shadow-quiet">
      已记录: {badge}
    </div>
  );
}
