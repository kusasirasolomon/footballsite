import { footballDataOrgAdapter } from '@/lib/football-api/footballDataOrg';
import { getOrFetchAndStore } from '@/lib/cache/firestoreCache';

export async function GET() {
  const provider = footballDataOrgAdapter();
  const live = await getOrFetchAndStore({ cacheKey: 'live_matches', fetcher: async () => await provider.getLiveMatches(), ttlSeconds: 30 });
  return new Response(JSON.stringify({ live }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
