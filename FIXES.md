// Temporary quick fix: use relative import if TS paths still fail.
// Example: in src/app/api/matches/fixtures/route.ts replace:
// import { getOrFetchAndStore } from '@/lib/cache/firestoreCache';
// with:
// import { getOrFetchAndStore } from '../../../../../lib/cache/firestoreCache';

// But prefer the tsconfig.json fix above and restart the dev server.
