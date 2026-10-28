/** Small process-local LRU cache; entries expire even when they are frequently read. */
export class BoundedCache<K, V> {
  private readonly entries = new Map<K, { value: V; expires: number }>();
  constructor(private readonly capacity: number, private readonly ttlMs: number) {
    if (capacity < 1 || ttlMs < 1) throw new Error('Cache limits must be positive');
  }
  get size() { return this.entries.size; }
  get(key: K): V | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    this.entries.delete(key);
    if (entry.expires <= Date.now()) return undefined;
    this.entries.set(key, entry);
    return entry.value;
  }
  set(key: K, value: V) {
    this.entries.delete(key);
    if (this.entries.size >= this.capacity) this.entries.delete(this.entries.keys().next().value as K);
    this.entries.set(key, { value, expires: Date.now() + this.ttlMs });
  }
  delete(key: K) { this.entries.delete(key); }
}
