const CACHE = new Map<string, { data: unknown; ts: number }>();
const INFLIGHT = new Map<string, Promise<unknown>>();
const TTL_MS = 5 * 60 * 1000;

export function peekCache<T>(url: string): T | undefined {
  const entry = CACHE.get(url);
  return entry && Date.now() - entry.ts < TTL_MS ? (entry.data as T) : undefined;
}

export function cachedJson<T>(
  url: string,
  init: RequestInit,
  onError: (status: number, url: string) => Error
): Promise<T> {
  const entry = CACHE.get(url);
  if (entry && Date.now() - entry.ts < TTL_MS) return Promise.resolve(entry.data as T);

  const inflight = INFLIGHT.get(url) as Promise<T> | undefined;
  if (inflight) return inflight;

  const p = fetch(url, init)
    .then(async (res) => {
      if (!res.ok) throw onError(res.status, url);
      const data = (await res.json()) as T;
      CACHE.set(url, { data, ts: Date.now() });
      return data;
    })
    .finally(() => INFLIGHT.delete(url));

  INFLIGHT.set(url, p as Promise<unknown>);
  return p;
}
