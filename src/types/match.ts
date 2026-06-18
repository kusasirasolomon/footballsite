/* Types: match.ts
   Core Match data shape used across the project.
*/
export type TeamRef = {
  id: string;
  name: string;
  shortName?: string;
  crestUrl?: string | null;
};

export type Score = {
  home: number | null;
  away: number | null;
  halfTimeHome?: number | null;
  halfTimeAway?: number | null;
};

export type MatchContent = {
  recapGeneratedAt?: string | null; // ISO
  recapText?: string | null;
  keyPlayers?: Array<{ name: string; teamId: string; note: string }>;
  highlightsText?: string | null;
};

export type Match = {
  matchId: string;
  slug: string;
  competition: string;
  stage: string;
  status: 'SCHEDULED' | 'LIVE' | 'PAUSED' | 'FINISHED' | 'POSTPONED';
  kickoffUtc: string; // ISO string
  venue?: string;
  homeTeam: TeamRef;
  awayTeam: TeamRef;
  score: Score;
  lastSyncedAt?: string; // ISO
  source?: string;
  seo?: {
    title: string;
    description: string;
    ogImageUrl?: string | null;
  };
  content?: MatchContent;
  createdAt?: string;
  updatedAt?: string;
};
