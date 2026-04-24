interface BadgeToastProps {
  badge: string | null;
}

export function BadgeToast({ badge }: BadgeToastProps) {
  if (!badge) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-gold/30 bg-deep/90 px-4 py-3 text-sm text-ink shadow-glow">
      🏅 {badge}
    </div>
  );
}
