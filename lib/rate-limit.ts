const trackers = new Map<string, { count: number; resetTime: number }>();
const maxTrackers = 5000;

export function rateLimit(ip: string, limit: number = 10, windowMs: number = 60000) {
  const now = Date.now();

  // Periodic cleanup of expired entries to prevent memory leaks
  if (trackers.size > 1000) {
    for (const [key, val] of trackers.entries()) {
      if (now >= val.resetTime) {
        trackers.delete(key);
      }
    }
  }

  const record = trackers.get(ip);

  if (!record) {
    // Reject new keys when full rather than evict active limits that can be bypassed.
    if (trackers.size >= maxTrackers) return { success: false, remaining: 0 };
    trackers.set(ip, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (now >= record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return { success: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 };
  }

  record.count++;
  return { success: true, remaining: limit - record.count };
}
