import Link from 'next/link';

export default function HomePage() {
  return (
    <section>
      <h1 className="text-3xl font-bold mb-4">LiveScore.site</h1>
      <p className="text-slate-600 mb-6">Near-live World Cup scores, standings, and match recaps. Auto-refresh during live matches.</p>

      <div className="space-y-4">
        <Link href="/world-cup" className="block p-4 border rounded hover:bg-slate-50">World Cup hub</Link>
        <Link href="/world-cup/trending" className="block p-4 border rounded hover:bg-slate-50">Trending teams & players</Link>
        <Link href="/match/example-vs-opponent" className="block p-4 border rounded hover:bg-slate-50">Example match page</Link>
      </div>
    </section>
  );
}
