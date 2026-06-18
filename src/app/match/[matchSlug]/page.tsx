import { use } from 'react';

type Props = { params: { matchSlug: string } };

export default function MatchPage({ params }: Props) {
  const { matchSlug } = params;
  return (
    <section>
      <h1 className="text-2xl font-bold mb-3">Match: {matchSlug.replace(/-/g, ' ')}</h1>
      <div className="p-4 border rounded">
        <p className="text-slate-600 mb-2">This is a placeholder match page. When the fixture sync runs, this page will render real match data from Firestore.</p>
        <p className="text-sm text-slate-500">If you want, I can wire this to the API route /api/matches/[matchId] next.</p>
      </div>
    </section>
  );
}
