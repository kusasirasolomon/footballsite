import { matchIdSchema } from '@/lib/security/validate';
import { adminDb } from '@/lib/firebase/admin';
import { getMatchById } from '@/lib/football-api/footballDataOrg';

export async function GET(request: Request, { params }: { params: { matchId: string } }) {
  const rawId = params?.matchId;

  const parsed = matchIdSchema.safeParse(rawId);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'invalid_match_id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const matchId = parsed.data;

  // Try by document ID first
  const docRef = adminDb.collection('matches').doc(matchId);
  const doc = await docRef.get();
  const now = Date.now();

  if (doc.exists) {
    const data: any = doc.data();
    const lastSynced = data?.lastSyncedAt && data.lastSyncedAt.toMillis ? data.lastSyncedAt.toMillis() : (data?.lastSyncedAt ? new Date(data.lastSyncedAt).getTime() : 0);
    if (lastSynced && now - lastSynced < 90 * 1000) {
      return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  }

  // If the doc is missing or stale, try fetching from upstream
  const upstream = await getMatchById(matchId).catch(() => null);

  if (upstream) {
    // Write normalized doc to Firestore
    await docRef.set({ ...upstream, lastSyncedAt: new Date(), updatedAt: new Date(), createdAt: doc.exists ? (doc.data()?.createdAt ?? new Date()) : new Date() }, { merge: true });
    return new Response(JSON.stringify(upstream), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  // Upstream failed — attempt to resolve by slug if the incoming id looks like a slug
  const slugQuery = await adminDb.collection('matches').where('slug', '==', matchId).limit(1).get();
  if (!slugQuery.empty) {
    const found = slugQuery.docs[0].data();
    return new Response(JSON.stringify(found), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  // If we had a stale doc, return it as fallback
  if (doc.exists) {
    return new Response(JSON.stringify(doc.data()), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
}
