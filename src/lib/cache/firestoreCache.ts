/**
 * firestoreCache.ts
 * Generic get-or-fetch-and-store helper that uses Firebase Admin SDK when available.
 * - Avoids importing admin at module top-level so local dev without credentials works.
 * - Fallback: simple in-memory cache (Map) with TTL for local development.
 *
 * Usage:
 * const data = await getOrFetchAndStore({
 *   cacheKey: 'fixtures_wc2026',
 *   fetcher: async () => await fetchUpstream(),
 *   ttlSeconds: 300
 * });
 */

type CacheRecord = { payload: any; fetchedAt: number; expiresAt: number };

const inMemoryCache = new Map<string, CacheRecord>();

async function getAdminDb() {
  try {
    const adminModule = await import('@/lib/firebase/admin');
    // adminDb is exported from admin.ts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (adminModule as any).adminDb;
  } catch (err) {
    // Admin SDK not configured (local dev). Fall back to in-memory cache.
    return null;
  }
}

export async function getOrFetchAndStore<T>({
  cacheKey,
  fetcher,
  ttlSeconds = 300,
}: {
  cacheKey: string;
  fetcher: () => Promise<T>;
  ttlSeconds?: number;
}): Promise<T> {
  const now = Date.now();
  const expiresAt = now + ttlSeconds * 1000;

  // Try in-memory cache first (fast, works regardless of Firebase)
  const mem = inMemoryCache.get(cacheKey);
  if (mem && mem.expiresAt > now) {
    return mem.payload as T;
  }

  const adminDb = await getAdminDb();
  if (!adminDb) {
    // No admin available — fetch fresh and store in-memory
    const payload = await fetcher();
    inMemoryCache.set(cacheKey, { payload, fetchedAt: now, expiresAt });
    return payload;
  }

  // Using Firestore as cache-of-record
  const docRef = adminDb.collection('apiCache').doc(cacheKey);
  const doc = await docRef.get();
  if (doc.exists) {
    const data = doc.data() as any;
    if (data.expiresAt && data.expiresAt.toMillis) {
      const expires = data.expiresAt.toMillis();
      if (expires > now) {
        return data.payload as T;
      }
    }
  }

  // Cache miss or expired: fetch upstream and persist
  const payload = await fetcher();
  await docRef.set(
    {
      cacheKey,
      provider: process.env.FOOTBALL_PROVIDER || 'football-data-org',
      payload,
      fetchedAt: new Date(now),
      expiresAt: new Date(expiresAt),
    },
    { merge: true }
  );

  return payload;
}
