import { footballDataOrgAdapter } from '@/lib/football-api/footballDataOrg';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '') || '';
  if (!secret || secret !== process.env.CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const competitionId = process.env.FOOTBALL_COMPETITION_ID || '2000';
  const provider = footballDataOrgAdapter();

  const standings = await provider.getStandings(competitionId);
  if (!standings || standings.length === 0) {
    return new Response(JSON.stringify({ message: 'No standings fetched' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  const batch = adminDb.batch();
  let written = 0;

  for (const s of standings) {
    const id = `${s.competitionId}_${(s.groupName || 'table').replace(/\s+/g, '_')}`;
    const ref = adminDb.collection('standings').doc(id);
    batch.set(ref, { ...s, lastSyncedAt: new Date() }, { merge: true });
    written += 1;
  }

  await batch.commit();

  return new Response(JSON.stringify({ written }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
