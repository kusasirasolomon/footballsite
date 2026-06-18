import type { Match } from '@/types/match';

type Props = { params: Promise<{ matchSlug: string }> };

export default async function MatchPage({ params }: Props) {
  const { matchSlug } = await params;

  let match: Match | null = null;
  // Attempt to fetch via our API route if NEXT_PUBLIC_SITE_URL is configured
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL;
    if (base) {
      const res = await fetch(`${base.replace(/\/$/, '')}/api/matches/${encodeURIComponent(matchSlug)}`, { cache: 'no-store' });
      if (res.ok) {
        match = await res.json();
      }
    } else {
      // Fallback: server-side lookup using Admin SDK
      const adminModule = await import('@/lib/firebase/admin');
      const adminDb = (adminModule as any).adminDb;
      const q = await adminDb.collection('matches').where('slug', '==', matchSlug).limit(1).get();
      if (!q.empty) match = q.docs[0].data() as Match;
    }
  } catch (err) {
    console.error('match fetch error', err);
    match = null;
  }

  if (!match) {
    return (
      <section className="text-center py-12">
        <h1 className="text-2xl font-semibold mb-2">Match data unavailable</h1>
        <p className="text-slate-600">We couldn't load this match right now. Try again in a moment.</p>
      </section>
    );
  }

  const kickoff = new Date(match.kickoffUtc);
  const isLive = match.status === 'LIVE';
  const isFinished = match.status === 'FINISHED';

  const statusBadge = (status: string) => {
    const cls = status === 'LIVE' ? 'bg-red-100 text-red-700' : status === 'FINISHED' ? 'bg-slate-100 text-slate-700' : 'bg-sky-100 text-sky-700';
    return <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${cls}`}>{status}</span>;
  };

  return (
    <section className="max-w-3xl mx-auto p-6">
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <img src={match.homeTeam.crestUrl ?? '/favicon.svg'} alt={`${match.homeTeam.name} crest`} className="w-20 h-20 mx-auto mb-2 object-contain" />
              <div className="text-lg font-semibold">{match.homeTeam.name}</div>
            </div>
          </div>

          <div className="w-full md:w-48 text-center">
            <div className="text-sm text-slate-500">{match.competition} · {match.stage}</div>

            <div className="my-4">
              {isLive ? (
                <div className="text-4xl font-bold">{match.score.home ?? 0} - {match.score.away ?? 0}</div>
              ) : isFinished ? (
                <div className="text-4xl font-bold">{match.score.home ?? 0} - {match.score.away ?? 0}</div>
              ) : (
                <div className="text-2xl font-semibold">{kickoff.toLocaleString()}</div>
              )}
            </div>

            <div className="mt-2">{statusBadge(match.status)}</div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <img src={match.awayTeam.crestUrl ?? '/favicon.svg'} alt={`${match.awayTeam.name} crest`} className="w-20 h-20 mx-auto mb-2 object-contain" />
              <div className="text-lg font-semibold">{match.awayTeam.name}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-slate-600">
          <div>{match.venue ?? 'Venue not available'}</div>
          <div className="mt-1">Kickoff: {kickoff.toLocaleString()}</div>
        </div>

        {match.content?.recapText ? (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Match Recap</h3>
            <p className="text-slate-700">{match.content.recapText}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
