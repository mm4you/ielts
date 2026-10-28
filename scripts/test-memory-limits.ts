import assert from 'node:assert/strict';
import { BoundedCache } from '../lib/bounded-cache';
import { rateLimit } from '../lib/rate-limit';

const originalNow = Date.now;
let now = 1000;
Date.now = () => now;
try {
  const cache = new BoundedCache<string, number>(2, 100);
  cache.set('a', 1); cache.set('b', 2);
  assert.equal(cache.get('a'), 1);
  cache.set('c', 3);
  assert.equal(cache.size, 2);
  assert.equal(cache.get('b'), undefined);
  now += 100;
  assert.equal(cache.get('a'), undefined);
  assert.equal(cache.get('c'), undefined);
  assert.equal(cache.size, 0);
  assert.equal(rateLimit('one', 1, 100).success, true);
  assert.equal(rateLimit('one', 1, 100).success, false);
  now += 100;
  assert.equal(rateLimit('one', 1, 100).success, true);
  for (let i = 0; i < 4999; i++) assert.equal(rateLimit(`key-${i}`, 1, 100).success, true);
  assert.equal(rateLimit('overflow', 1, 100).success, false);
  assert.equal(rateLimit('one', 1, 100).success, false);
  now += 100;
  assert.equal(rateLimit('overflow', 1, 100).success, true);
  console.log('Memory limits: LRU eviction, TTL, exact window reset, capacity and fail-closed rate limiting passed.');
} finally { Date.now = originalNow; }
