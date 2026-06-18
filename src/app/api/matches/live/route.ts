export async function GET() {
  const payload = { live: [] };
  return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
