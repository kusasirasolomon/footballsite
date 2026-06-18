import './globals.css';
import React from 'react';

export const metadata = {
  title: 'LiveScore.site — World Cup Live Scores',
  description: 'Near-live World Cup scores, standings, and match recaps. Built on free-tier infrastructure.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-white text-slate-900">
        <header className="border-b py-4 px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <a href="/" className="text-xl font-semibold">LiveScore.site</a>
            <nav className="space-x-4">
              <a href="/world-cup" className="text-sm text-slate-600">World Cup</a>
              <a href="/world-cup/trending" className="text-sm text-slate-600">Trending</a>
            </nav>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-6">{children}</main>

        <footer className="border-t py-6 mt-12">
          <div className="max-w-4xl mx-auto text-sm text-slate-500">
            © {new Date().getFullYear()} LiveScore.site — near-live World Cup scores
          </div>
        </footer>
      </body>
    </html>
  );
}
