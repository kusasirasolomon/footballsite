import React from 'react';

export default function HeroSection() {
  return (
    <div className="rounded-lg bg-gradient-to-r from-sky-50 to-white p-6 border">
      <h1 className="text-3xl font-bold">LiveScore.site</h1>
      <p className="mt-2 text-slate-600">Near-live World Cup scores, standings, and match recaps. Auto-refresh during live matches.</p>
      <div className="mt-4 flex gap-3">
        <a href="/world-cup" className="inline-block rounded bg-sky-600 text-white px-4 py-2">World Cup Hub</a>
        <a href="/world-cup/trending" className="inline-block rounded border px-4 py-2">Trending</a>
      </div>
    </div>
  );
}
