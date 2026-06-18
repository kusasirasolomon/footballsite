export async function GET() {
  const payload = {
    fixtures: [
      {
        matchId: 'example-1',
        slug: 'example-vs-opponent',
        competition: 'FIFA World Cup',
        stage: 'Group A',
        status: 'SCHEDULED',
        kickoffUtc: new Date().toISOString(),
        homeTeam: { id: 'home-1', name: 'Example', shortName: 'EX', crestUrl: null },
        awayTeam: { id: 'away-1', name: 'Opponent', shortName: 'OPP', crestUrl: null },
        score: { home: null, away: null }
      }
    ]
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
