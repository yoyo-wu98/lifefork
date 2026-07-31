import "server-only";

interface RateEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

const MAX_BUCKETS = 10_000;

const globalRateStore = globalThis as typeof globalThis & {
  __lifeforkRateLimits?: Map<string, RateEntry>;
};

const rateStore =
  globalRateStore.__lifeforkRateLimits ??
  (globalRateStore.__lifeforkRateLimits = new Map<string, RateEntry>());

function pruneExpired(now: number) {
  if (rateStore.size < 1_000) return;

  for (const [key, entry] of rateStore) {
    if (entry.resetAt <= now) rateStore.delete(key);
  }

  if (rateStore.size <= MAX_BUCKETS) return;
  const overflow = rateStore.size - MAX_BUCKETS;
  let removed = 0;
  for (const key of rateStore.keys()) {
    rateStore.delete(key);
    removed += 1;
    if (removed >= overflow) break;
  }
}

export function consumeRateLimit({
  sessionId,
  bucket,
  limit,
  windowMs,
}: {
  sessionId: string;
  bucket: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  pruneExpired(now);
  const key = `${bucket}:${sessionId}`;
  const current = rateStore.get(key);
  const entry: RateEntry =
    current && current.resetAt > now
      ? current
      : { count: 0, resetAt: now + windowMs };

  entry.count += 1;
  rateStore.set(key, entry);

  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}
