/**
 * Render's health check (render.yaml, healthCheckPath). It only says the server answers:
 * no data file, no keys, no outside service, so a slow or failing AI, Channel3 or PayPal never takes the site down.
 */
export async function GET() {
  return Response.json({ ok: true });
}
