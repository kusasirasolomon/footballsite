import { matchIdSchema } from '@/lib/security/validate';
import { adminDb } from '@/lib/firebase/admin';
import { getMatchById } from '@/lib/football-api/footballDataOrg';

export async function GET(request: Request, { params }: { params: { matchId: string } }) {
  const debugSteps: string[] = [];
  const debugMode = new URL(request.url).searchParams.get('debug') === '1' || request.headers.get('x-debug') === '1';

  const rawId = params?.matchId;
  debugSteps.push(`received_raw_id=${String(rawId)}`);

  const parsed = matchIdSchema.safeParse(rawId);
  if (!parsed.success) {
    debugSteps.push('id_validation=failed');
    const payload: any = { error: 'invalid_match_id' };
    if (debugMode) payload._debug = debugSteps;
    return new Response(JSON.stringify(payload), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const matchId = parsed.data;
  debugSteps.push(`id_validation=ok matchId=${matchId}`);

  // Try by document ID first
  const docRef = adminDb.collection('matches').doc(matchId);
  let doc: any = null;
  try {
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      doc = docSnap;
      debugSteps.push('firestore_lookup=found_by_id');
    } else {
      debugSteps.push('firestore_lookup=not_found_by_id');
    }
  } catch (err: any) {
    debugSteps.push(`firestore_lookup_error=${String(err?.message ?? err)}`);
    console.error('Firestore lookup error for matchId', matchId, err);
  }

  const now = Date.now();
  let lastSynced = 0;
  if (doc && doc.exists) {
    const data: any = doc.data();
    lastSynced = data?.lastSyncedAt && data.lastSyncedAt.toMillis ? data.lastSyncedAt.toMillis() : (data?.lastSyncedAt ? new Date(data.lastSyncedAt).getTime() : 0);
    debugSteps.push(`doc_lastSyncedAt=${lastSynced}`);
    if (lastSynced && now - lastSynced < 90 * 1000) {
      debugSteps.push('cache_fresh=true returning_cached_doc');
      const payload: any = doc.data();
      if (debugMode) payload._debug = debugSteps;
      return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    debugSteps.push('cache_fresh=false need_upstream');
  } else {
    debugSteps.push('no_local_doc_present');
  }

  // If the doc is missing or stale, try fetching from upstream
  let upstream: any = null;
  try {
    debugSteps.push('calling_upstream');
    upstream = await getMatchById(matchId);
    debugSteps.push(`upstream_result=${upstream ? 'ok' : 'null'}`);
  } catch (err: any) {
    debugSteps.push(`upstream_error=${String(err?.message ?? err)}`);
    console.error('Upstream fetch error for matchId', matchId, err);
    upstream = null;
  }

  if (upstream) {
    try {
      await docRef.set({ ...upstream, lastSyncedAt: new Date(), updatedAt: new Date(), createdAt: doc && doc.exists ? (doc.data()?.createdAt ?? new Date()) : new Date() }, { merge: true });
      debugSteps.push('wrote_upstream_to_firestore');
    } catch (err: any) {
      debugSteps.push(`firestore_write_error=${String(err?.message ?? err)}`);
      console.error('Error writing upstream match to Firestore for matchId', matchId, err);
    }

    const payload: any = upstream;
    if (debugMode) payload._debug = debugSteps;
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  // Upstream failed — attempt to resolve by slug if the incoming id looks like a slug
  try {
    debugSteps.push('attempting_slug_lookup');
    const slugQuery = await adminDb.collection('matches').where('slug', '==', matchId).limit(1).get();
    if (!slugQuery.empty) {
      const found = slugQuery.docs[0].data();
      debugSteps.push('slug_lookup=found');
      if (debugMode) (found as any)._debug = debugSteps;
      return new Response(JSON.stringify(found), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    debugSteps.push('slug_lookup=not_found');
  } catch (err: any) {
    debugSteps.push(`slug_lookup_error=${String(err?.message ?? err)}`);
    console.error('Slug lookup error for', matchId, err);
  }

  // If we had a stale doc, return it as fallback
  if (doc && doc.exists) {
    debugSteps.push('returning_stale_doc_as_fallback');
    const payload: any = doc.data();
    if (debugMode) payload._debug = debugSteps;
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  debugSteps.push('not_found_final');
  const payload: any = { error: 'not_found' };
  if (debugMode) payload._debug = debugSteps;
  return new Response(JSON.stringify(payload), { status: 404, headers: { 'Content-Type': 'application/json' } });
}
