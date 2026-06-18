/*
  Lightweight Firestore-backed rate limiter.
  - Hashes fingerprint (ip + user-agent) using SHA-256 and stores a small counter doc.
  - Sliding window is implemented with a windowStart timestamp and requestCount.
  - If Admin SDK is not available (local dev), falls back to an in-memory Map.

  Usage: const allowed = await rateLimit(request, { max: 60, windowSeconds: 60 });
  If allowed === false, return 429.
*/

import crypto from 'crypto';

let inMemory = new Map<string, { windowStart: number; requestCount: number }>();

async function getAdminDb() {
  try {
    const adminModule = await import('@/lib/firebase/admin');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (adminModule as any).adminDb;
  } catch (err) {
    return null;
  }
}

export async function rateLimit(request: Request, opts?: { max?: number; windowSeconds?: number }): Promise<{ allowed: boolean; remaining: number }> {
  const max = opts?.max ?? 60;
  const windowSeconds = opts?.windowSeconds ?? 60;

  const xfwd = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '0.0.0.0';
  const ua = request.headers.get('user-agent') || 'unknown';
  const fingerprint = crypto.createHash('sha256').update(`${xfwd}|${ua}`).digest('hex');

  const now = Date.now();
  const windowStart = Math.floor(now / (windowSeconds * 1000)) * (windowSeconds * 1000);

  const adminDb = await getAdminDb();
  if (!adminDb) {
    const entry = inMemory.get(fingerprint);
    if (!entry || entry.windowStart !== windowStart) {
      inMemory.set(fingerprint, { windowStart, requestCount: 1 });
      return { allowed: true, remaining: max - 1 };
    }
    if (entry.requestCount + 1 > max) {
      return { allowed: false, remaining: 0 };
    }
    entry.requestCount += 1;
    inMemory.set(fingerprint, entry);
    return { allowed: true, remaining: max - entry.requestCount };
  }

  const docRef = adminDb.collection('rateLimits').doc(fingerprint);
  try {
    const res = await adminDb.runTransaction(async (tx: any) => {
      const d = await tx.get(docRef);
      if (!d.exists) {
        tx.set(docRef, { fingerprint, windowStart: new Date(windowStart), requestCount: 1 });
        return { allowed: true, remaining: max - 1 };
      }
      const data = d.data();
      const docWindowStart = data.windowStart?.toMillis ? data.windowStart.toMillis() : new Date(data.windowStart).getTime();
      if (docWindowStart !== windowStart) {
        tx.set(docRef, { fingerprint, windowStart: new Date(windowStart), requestCount: 1 });
        return { allowed: true, remaining: max - 1 };
      }
      if ((data.requestCount ?? 0) + 1 > max) {
        return { allowed: false, remaining: 0 };
      }
      tx.update(docRef, { requestCount: (data.requestCount ?? 0) + 1 });
      return { allowed: true, remaining: max - ((data.requestCount ?? 0) + 1) };
    });
    return res;
  } catch (err) {
    // On failure, be permissive to avoid taking site down
    return { allowed: true, remaining: max };
  }
}
