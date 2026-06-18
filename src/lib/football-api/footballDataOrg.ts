/*
  Minimal football-data.org adapter skeleton.
  - Implements FootballDataProvider interface and normalizes to our Match types.
  - Keeps concrete HTTP calls isolated so swapping providers is trivial.
  - This implementation intentionally avoids throwing on missing API key — it will
    return empty arrays so the site remains functional in dev without keys.
*/

import type { FootballDataProvider } from '@/lib/football-api/provider';
import type { Match } from '@/types/match';

const API_BASE = 'https://api.football-data.org/v2';

function safeIso(date?: string | number): string {
  if (!date) return new Date().toISOString();
  return new Date(date).toISOString();
}

export const footballDataOrgAdapter = (): FootballDataProvider => {
  const key = process.env.FOOTBALL_DATA_ORG_API_KEY;

  async function fetchJson(path: string) {
    if (!key) return null;
    const res = await fetch(`${API_BASE}${path}`, { headers: { 'X-Auth-Token': key } });
    if (!res.ok) return null;
    return res.json();
  }

  return {
    async getLiveMatches(): Promise<Match[]> {
      // football-data.org has a "matches" endpoint that can be filtered by status=LIVE
      const json = await fetchJson('/matches?status=LIVE');
      if (!json || !Array.isArray(json.matches)) return [];

      return json.matches.map((m: any) => {
        const match: Match = {
          matchId: String(m.id ?? `${m.utcDate}-${m.homeTeam?.name}-${m.awayTeam?.name}`),
          slug: `${(m.homeTeam?.name || 'home').toLowerCase().replace(/\s+/g, '-')}-vs-${(m.awayTeam?.name || 'away').toLowerCase().replace(/\s+/g, '-')}`,
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
        };
        return match;
      });
    },

    async getFixtures(competitionId: string): Promise<Match[]> {
      // Map competitionId to football-data.org competition code if needed
      const json = await fetchJson(`/competitions/${competitionId}/matches?status=SCHEDULED`);
      if (!json || !Array.isArray(json.matches)) return [];
      return json.matches.map((m: any) => ({
        matchId: String(m.id ?? `${m.utcDate}-${m.homeTeam?.name}-${m.awayTeam?.name}`),
        slug: `${(m.homeTeam?.name || 'home').toLowerCase().replace(/\s+/g, '-')}-vs-${(m.awayTeam?.name || 'away').toLowerCase().replace(/\s+/g, '-')}`,
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
      const json = await fetchJson(`/competitions/${competitionId}/standings`);
      if (!json || !Array.isArray(json.standings)) return [];
      // Normalize minimal standings shape
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
