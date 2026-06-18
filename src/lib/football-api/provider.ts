/* Copilot instructions:
   This file defines the provider interface for football API adapters.
   Keep this interface small and stable so adapters (footballDataOrg.ts,
   apiFootball.ts) can implement it. When switching providers, change
   only the adapter implementation and a small config flag.
*/
import type { Match } from '@/types/match';
import type { Standing } from '@/types/standing';

export interface FootballDataProvider {
  // Return a list of matches that are currently LIVE or recently finished.
  getLiveMatches(): Promise<Match[]>;

  // Return upcoming fixtures for a competition (e.g., competitionId='WC2026')
  getFixtures(competitionId: string): Promise<Match[]>;

  // Return standings for the competition/group
  getStandings(competitionId: string): Promise<Standing[]>;
}
