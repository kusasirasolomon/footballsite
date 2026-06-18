import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '') || '';
  if (!secret || secret !== process.env.CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  // Placeholder trends sync. If google-trends integration is added later, replace this.
  const watchlist = (process.env.TRENDS_WATCHLIST || 'Argentina,Brazil,France,England,Germany,Spain').split(',').map(s => s.trim());
  const batch = adminDb.batch();
  const now = new Date();
  let written = 0;

  for (const subject of watchlist) {
    const id = `trend_${subject.toLowerCase().replace(/\s+/g, '-')}_${now.toISOString().slice(0,10)}`;
    const ref = adminDb.collection('trending').doc(id);
    const doc = {
      trendId: id,
      subjectType: 'team',
      subjectName: subject,
      subjectSlug: subject.toLowerCase().replace(/\s+/g, '-'),
      score: Math.floor(Math.random() * 50) + 10, // placeholder random score
      source: 'placeholder',
      windowStart: now,
      windowEnd: new Date(now.getTime() + 1000*60*60),
      aiSummary: null,
      aiSummaryGeneratedAt: null,
      createdAt: now,
    };
    batch.set(ref, doc, { merge: true });
    written += 1;
  }

  await batch.commit();
  return new Response(JSON.stringify({ written }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
