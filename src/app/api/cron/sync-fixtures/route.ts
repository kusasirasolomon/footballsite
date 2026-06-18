import { footballDataOrgAdapter } from '@/lib/football-api/footballDataOrg';
import { adminDb } from '@/lib/firebase/admin';
import { getOrFetchAndStore } from '@/lib/cache/firestoreCache';

export async function GET(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '') || '';
  if (!secret || secret !== process.env.CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  // competition id can be set via env, fallback to '2000' placeholder
  const competitionId = process.env.FOOTBALL_COMPETITION_ID || '2000';
  const provider = footballDataOrgAdapter();

  // fetch fixtures from upstream
  const fixtures = await provider.getFixtures(competitionId);

  if (!fixtures || fixtures.length === 0) {
    return new Response(JSON.stringify({ message: 'No fixtures fetched' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  const batch = adminDb.batch();
  let written = 0;

  for (const m of fixtures) {
    const matchRef = adminDb.collection('matches').doc(m.matchId);
    batch.set(matchRef, { ...m, createdAt: new Date(), updatedAt: new Date() }, { merge: true });

    // write teams
    const homeRef = adminDb.collection('teams').doc(m.homeTeam.id);
    batch.set(homeRef, { teamId: m.homeTeam.id, name: m.homeTeam.name, shortName: m.homeTeam.shortName ?? null, crestUrl: m.homeTeam.crestUrl ?? null }, { merge: true });
    const awayRef = adminDb.collection('teams').doc(m.awayTeam.id);
    batch.set(awayRef, { teamId: m.awayTeam.id, name: m.awayTeam.name, shortName: m.awayTeam.shortName ?? null, crestUrl: m.awayTeam.crestUrl ?? null }, { merge: true });

    written += 1;
  }

  await batch.commit();

  return new Response(JSON.stringify({ written }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
