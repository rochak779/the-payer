// Reads one purchase back from PayPal's sandbox API, read-only, for the video's "PayPal's record" card.
// Nobody can log in at sandbox.paypal.com (BRIEF.md), so the API is the honest view of PayPal's side.
//
//   node --env-file=../.env.local scripts/paypal-record.mjs <hold (authorization) id> [--out src/data/paypal-record.json]
//
// Hold → its order (supplementary_data.related_ids.order_id) → the order with every hold and capture.
// Prints and saves only ids, statuses and amounts. Credentials come from the environment and are never printed.
import fs from 'node:fs';

const API = 'https://api-m.sandbox.paypal.com'; // sandbox only, fixed
const [holdId, flag, out] = process.argv.slice(2);
if (!holdId || !/^[A-Z0-9]{10,25}$/.test(holdId)) throw new Error('Usage: paypal-record.mjs <hold id> [--out file]');
const { PAYPAL_CLIENT_ID: id, PAYPAL_CLIENT_SECRET: secret } = process.env;
if (!id || !secret) throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set');

const tokenRes = await fetch(`${API}/v1/oauth2/token`, {
  method: 'POST',
  headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'grant_type=client_credentials',
});
if (!tokenRes.ok) throw new Error(`PayPal sign-in failed: ${tokenRes.status}`);
const { access_token: token } = await tokenRes.json();
const get = async (path) => {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
};

const hold = await get(`/v2/payments/authorizations/${holdId}`);
const orderId = hold.supplementary_data?.related_ids?.order_id;
if (!orderId) throw new Error('The hold has no order id');
const order = await get(`/v2/checkout/orders/${orderId}`);
const unit = order.purchase_units?.[0] ?? {};
const money = (a) => (a ? { value: a.value, currency: a.currency_code } : null);

const record = {
  source: 'PayPal sandbox API, GET /v2/payments/authorizations/{id} and GET /v2/checkout/orders/{id}',
  readAt: new Date().toISOString(),
  order: { id: order.id, status: order.status, intent: order.intent, amount: money(unit.amount) },
  holds: (unit.payments?.authorizations ?? []).map((h) => ({ id: h.id, status: h.status, amount: money(h.amount) })),
  captures: (unit.payments?.captures ?? []).map((c) => ({ id: c.id, status: c.status, amount: money(c.amount), finalCapture: c.final_capture ?? null })),
};
console.log(JSON.stringify(record, null, 2));
if (flag === '--out' && out) fs.writeFileSync(out, JSON.stringify(record, null, 2) + '\n');
