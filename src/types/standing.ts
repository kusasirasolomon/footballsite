export type StandingRow = {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
};

export type Standing = {
  competitionId: string;
  groupName: string;
  table: StandingRow[];
  lastSyncedAt?: string;
};
