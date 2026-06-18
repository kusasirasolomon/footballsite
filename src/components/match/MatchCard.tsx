import React from 'react';
import Link from 'next/link';

export default function MatchCard({ match }: { match: any }) {
  return (
    <Link href={`/match/${match.slug}`} className="block p-4 border rounded hover:shadow">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">{match.competition} · {match.stage}</div>
          <div className="text-lg font-semibold">{match.homeTeam.name} vs {match.awayTeam.name}</div>
          <div className="text-sm text-slate-500">{new Date(match.kickoffUtc).toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-500">Status</div>
          <div className="font-mono">{match.status}</div>
        </div>
      </div>
    </Link>
  );
}
