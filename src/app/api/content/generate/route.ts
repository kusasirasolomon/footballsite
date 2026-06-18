import { adminDb } from '@/lib/firebase/admin';
import { z } from 'zod';
import { generateContentBodySchema } from '@/lib/security/validate';

const llmResponseSchema = z.object({
  recapText: z.string().min(10).max(5000),
  keyPlayers: z.array(z.object({ name: z.string(), teamId: z.string(), note: z.string() })).optional(),
  highlightsText: z.string().optional(),
});

export async function POST(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '') || '';
  if (!secret || secret !== process.env.CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const body = await request.json().catch(() => null);
  const parse = generateContentBodySchema.safeParse(body);
  if (!parse.success) {
    return new Response(JSON.stringify({ error: 'invalid_body', details: parse.error.flatten() }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const { matchId } = parse.data;

  const matchRef = adminDb.collection('matches').doc(matchId);
  const doc = await matchRef.get();
  if (!doc.exists) {
    return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
  const match = doc.data();
  if (!match) return new Response(JSON.stringify({ error: 'empty_match' }), { status: 500 });

  if (match.content && match.content.recapGeneratedAt) {
    return new Response(JSON.stringify({ message: 'already_generated' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  // Build a grounded prompt using available match data
  const prompt = `You are a factual football editor. Given the structured data below, write a concise 2-4 sentence recap, a short list of 2-3 key players with notes, and 1-2 highlight sentences. Do NOT invent goal scorers or statistics that are not provided.\n\nDATA:\n${JSON.stringify(match)}\n\nOutput JSON with keys: recapText, keyPlayers (array), highlightsText.`;

  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'llm_not_configured' }), { status: 501, headers: { 'Content-Type': 'application/json' } });
  }

  // Call OpenAI-compatible Chat Completions
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: process.env.LLM_MODEL || 'gpt-3.5-turbo', messages: [{ role: 'system', content: 'You are a helpful football editor.' }, { role: 'user', content: prompt }], temperature: 0.2, max_tokens: 800 }),
  });

  if (!res.ok) {
    const text = await res.text();
    return new Response(JSON.stringify({ error: 'llm_error', details: text }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }

  const payload = await res.json();
  const reply = payload.choices?.[0]?.message?.content;
  if (!reply) {
    return new Response(JSON.stringify({ error: 'empty_llm_reply' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }

  // Try to parse JSON out of the reply
  let parsed: any = null;
  try {
    parsed = JSON.parse(reply);
  } catch (err) {
    // Try to extract JSON substring
    const m = reply.match(/\{[\s\S]*\}/);
    if (m) {
      try { parsed = JSON.parse(m[0]); } catch (e) { parsed = null; }
    }
  }

  if (!parsed) {
    return new Response(JSON.stringify({ error: 'invalid_llm_json', reply }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }

  const v = llmResponseSchema.safeParse(parsed);
  if (!v.success) {
    return new Response(JSON.stringify({ error: 'llm_schema_mismatch', details: v.error.flatten() }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }

  // Persist to Firestore
  const content = {
    recapGeneratedAt: new Date(),
    recapText: v.data.recapText,
    keyPlayers: v.data.keyPlayers || [],
    highlightsText: v.data.highlightsText || null,
  };

  await matchRef.set({ content }, { merge: true });

  return new Response(JSON.stringify({ ok: true, content }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
