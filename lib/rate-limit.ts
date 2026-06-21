import { logger } from './logger';

const trackers = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(ip: string, limit: number = 10, windowMs: number = 60000) {
  const now = Date.now();
  const record = trackers.get(ip);

  // Periodic cleanup of expired entries to prevent memory leaks
  if (trackers.size > 1000) {
    for (const [key, val] of trackers.entries()) {
      if (now > val.resetTime) {
        trackers.delete(key);
      }
    }
  }

  if (!record) {
    trackers.set(ip, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return { success: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    logger.warn({ ip, count: record.count }, 'Rate limit exceeded');
    return { success: false, remaining: 0 };
  }

  record.count++;
  return { success: true, remaining: limit - record.count };
}
