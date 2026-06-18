export default function WorldCupHub() {
  return (
    <section>
      <h1 className="text-2xl font-bold mb-3">World Cup Hub</h1>
      <p className="text-slate-600 mb-6">Fixtures, groups, teams, and live matches for the World Cup.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="/world-cup/trending" className="p-4 border rounded">Trending</a>
        <a href="/world-cup/teams" className="p-4 border rounded">Teams</a>
        <a href="/world-cup/groups" className="p-4 border rounded">Groups / Standings</a>
        <a href="/match/example-vs-opponent" className="p-4 border rounded">Example match</a>
      </div>
    </section>
  );
}
