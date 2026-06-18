import { getOrFetchAndStore } from '@/lib/cache/firestoreCache';
import { footballDataOrgAdapter } from '@/lib/football-api/footballDataOrg';

export async function GET() {
  // Simple fixtures route that uses the cache helper and provider adapter.
  const provider = footballDataOrgAdapter();

  const fixtures = await getOrFetchAndStore({
    cacheKey: 'fixtures_wc_default',
    fetcher: async () => await provider.getFixtures('2000'), // 2000 is a placeholder competition id
    ttlSeconds: 60 * 10, // 10 minutes
  });

  return new Response(JSON.stringify({ fixtures }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
