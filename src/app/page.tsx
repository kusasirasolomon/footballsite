import HeroSection from '@/components/home/HeroSection';
import MatchCard from '@/components/match/MatchCard';

export default function HomePage() {
  const exampleMatch = {
    matchId: 'example-1',
    slug: 'example-vs-opponent',
    competition: 'FIFA World Cup',
    stage: 'Group A',
    status: 'SCHEDULED',
    kickoffUtc: new Date().toISOString(),
    homeTeam: { id: 'home-1', name: 'Example', shortName: 'EX', crestUrl: null },
    awayTeam: { id: 'away-1', name: 'Opponent', shortName: 'OPP', crestUrl: null },
    score: { home: null, away: null }
  };

  return (
    <section>
      <HeroSection />

      <h2 className="mt-8 text-xl font-semibold">Upcoming</h2>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <MatchCard match={exampleMatch} />
      </div>
    </section>
  );
}
