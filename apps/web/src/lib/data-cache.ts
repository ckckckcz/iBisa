const store = new Map<string, unknown>();

export function dataGet<T>(key: string): T | null {
  return store.has(key) ? (store.get(key) as T) : null;
}

export function dataSet<T>(key: string, value: T): void {
  store.set(key, value);
}

export function dataClear(key: string): void {
  store.delete(key);
}