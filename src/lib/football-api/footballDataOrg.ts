/*
  footballDataOrg.ts
  - Adds a helper to fetch a single match by upstream ID and normalize it into our Match type.
  - The existing footballDataOrgAdapter factory remains for bulk ops.
*/

import type { FootballDataProvider } from '@/lib/football-api/provider';
import type { Match } from '@/types/match';

const API_BASE = 'https://api.football-data.org/v2';

function safeIso(date?: string | number): string {
  if (!date) return new Date().toISOString();
  return new Date(date).toISOString();
}

function slugifyTeamPair(home?: any, away?: any) {
  const h = (home?.name || 'home').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
  const a = (away?.name || 'away').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
  return `${h}-vs-${a}`;
}

async function fetchJsonWithKey(path: string) {
  const key = process.env.FOOTBALL_DATA_ORG_API_KEY;
  if (!key) return null;
  const res = await fetch(`${API_BASE}${path}`, { headers: { 'X-Auth-Token': key } });
  if (!res.ok) return null;
  return res.json();
}

export const footballDataOrgAdapter = (): FootballDataProvider => {
  return {
    async getLiveMatches(): Promise<Match[]> {
      const json = await fetchJsonWithKey('/matches?status=LIVE');
      if (!json || !Array.isArray(json.matches)) return [];
      return json.matches.map((m: any) => ({
        matchId: String(m.id ?? `${m.utcDate}-${m.homeTeam?.name}-${m.awayTeam?.name}`),
        slug: slugifyTeamPair(m.homeTeam, m.awayTeam),
        competition: m.competition?.name ?? 'Unknown',
        stage: m.stage ?? m.group ?? 'Match',
        status: (m.status as any) ?? 'SCHEDULED',
        kickoffUtc: safeIso(m.utcDate),
        venue: m.venue ?? null,
        homeTeam: { id: String(m.homeTeam?.id ?? 'home'), name: m.homeTeam?.name ?? 'Home', shortName: m.homeTeam?.shortName ?? m.homeTeam?.name, crestUrl: null },
        awayTeam: { id: String(m.awayTeam?.id ?? 'away'), name: m.awayTeam?.name ?? 'Away', shortName: m.awayTeam?.shortName ?? m.awayTeam?.name, crestUrl: null },
        score: { home: m.score?.fullTime?.home ?? null, away: m.score?.fullTime?.away ?? null },
        lastSyncedAt: new Date().toISOString(),
        source: 'football-data-org',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    },

    async getFixtures(competitionId: string): Promise<Match[]> {
      const json = await fetchJsonWithKey(`/competitions/${competitionId}/matches?status=SCHEDULED`);
      if (!json || !Array.isArray(json.matches)) return [];
      return json.matches.map((m: any) => ({
        matchId: String(m.id ?? `${m.utcDate}-${m.homeTeam?.name}-${m.awayTeam?.name}`),
        slug: slugifyTeamPair(m.homeTeam, m.awayTeam),
        competition: m.competition?.name ?? 'Unknown',
        stage: m.stage ?? m.group ?? 'Match',
        status: (m.status as any) ?? 'SCHEDULED',
        kickoffUtc: safeIso(m.utcDate),
        venue: m.venue ?? null,
        homeTeam: { id: String(m.homeTeam?.id ?? 'home'), name: m.homeTeam?.name ?? 'Home', shortName: m.homeTeam?.shortName ?? m.homeTeam?.name, crestUrl: null },
        awayTeam: { id: String(m.awayTeam?.id ?? 'away'), name: m.awayTeam?.name ?? 'Away', shortName: m.awayTeam?.shortName ?? m.awayTeam?.name, crestUrl: null },
        score: { home: m.score?.fullTime?.home ?? null, away: m.score?.fullTime?.away ?? null },
        lastSyncedAt: new Date().toISOString(),
        source: 'football-data-org',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    },

    async getStandings(competitionId: string) {
      const json = await fetchJsonWithKey(`/competitions/${competitionId}/standings`);
      if (!json || !Array.isArray(json.standings)) return [];
      const result: any[] = [];
      for (const s of json.standings) {
        if (!Array.isArray(s.table)) continue;
        result.push({ competitionId, groupName: s.group ?? s.type ?? 'Table', table: s.table.map((r: any, idx: number) => ({
          teamId: String(r.team?.id ?? r.team?.name),
          teamName: r.team?.name ?? 'Team',
          played: r.playedGames ?? 0,
          won: r.won ?? 0,
          draw: r.draw ?? 0,
          lost: r.lost ?? 0,
          goalsFor: r.goalsFor ?? 0,
          goalsAgainst: r.goalsAgainst ?? 0,
          goalDifference: r.goalDifference ?? 0,
          points: r.points ?? 0,
          position: r.position ?? idx + 1,
        })) });
      }
      return result;
    },
  };
};

export async function getMatchById(matchId: string): Promise<Match | null> {
  if (!matchId) return null;
  const key = process.env.FOOTBALL_DATA_ORG_API_KEY;
  if (!key) return null;

  const res = await fetch(`${API_BASE}/matches/${encodeURIComponent(matchId)}`, { headers: { 'X-Auth-Token': key } });
  if (!res.ok) return null;
  const json = await res.json();
  const m = json.match ?? json; // some responses nest under 'match'
  if (!m) return null;

  try {
    const normalized: Match = {
      matchId: String(m.id ?? `${m.utcDate}-${m.homeTeam?.name}-${m.awayTeam?.name}`),
      slug: slugifyTeamPair(m.homeTeam, m.awayTeam),
      competition: m.competition?.name ?? 'Unknown',
      stage: m.stage ?? m.group ?? 'Match',
      status: (m.status as any) ?? 'SCHEDULED',
      kickoffUtc: safeIso(m.utcDate),
      venue: m.venue ?? null,
      homeTeam: { id: String(m.homeTeam?.id ?? 'home'), name: m.homeTeam?.name ?? 'Home', shortName: m.homeTeam?.shortName ?? m.homeTeam?.name, crestUrl: null },
      awayTeam: { id: String(m.awayTeam?.id ?? 'away'), name: m.awayTeam?.name ?? 'Away', shortName: m.awayTeam?.shortName ?? m.awayTeam?.name, crestUrl: null },
      score: { home: m.score?.fullTime?.home ?? null, away: m.score?.fullTime?.away ?? null, halfTimeHome: m.score?.halfTime?.home ?? null, halfTimeAway: m.score?.halfTime?.away ?? null },
      lastSyncedAt: new Date().toISOString(),
      source: 'football-data-org',
      seo: {
        title: `${m.homeTeam?.name ?? 'Home'} vs ${m.awayTeam?.name ?? 'Away'} — ${m.competition?.name ?? ''}`,
        description: `Live score, lineups, and recap for ${m.homeTeam?.name ?? 'Home'} vs ${m.awayTeam?.name ?? 'Away'}`,
        ogImageUrl: null,
      },
      content: {
        recapGeneratedAt: null,
        recapText: null,
        keyPlayers: [],
        highlightsText: null,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return normalized;
  } catch (err) {
    return null;
  }
}
