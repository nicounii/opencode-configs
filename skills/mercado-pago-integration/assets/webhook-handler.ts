/**
 * Mercado Pago webhook handler — Express.
 *
 * Install: npm install express mercadopago
 * Env:     MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET
 *
 * Behavior: verify signature -> ack 200 fast -> fetch the real resource -> act on
 * confirmed status -> dedupe so retries are idempotent.
 */
import express, { type Request, type Response } from 'express';
import crypto from 'node:crypto';
import { WebhookSignatureValidator, InvalidWebhookSignatureError } from 'mercadopago';

const app = express();
app.use(express.json());

const MP_API = 'https://api.mercadopago.com';

// --- Plug your own persistence here -----------------------------------------
const processedEvents = new Set<string>(); // swap for a DB / Redis in production
async function alreadyProcessed(id: string) {
  return processedEvents.has(id);
}
async function markProcessed(id: string) {
  processedEvents.add(id);
}
async function fulfill(externalReference: string | undefined, payment: any) {
  // TODO: mark order paid, grant access, send receipt, etc.
  console.log('fulfill', externalReference, payment.status);
}
// ---------------------------------------------------------------------------

app.post('/api/mp/webhook', async (req: Request, res: Response) => {
  // 1. Verify signature
  try {
    WebhookSignatureValidator.validate({
      xSignature: req.header('x-signature'),
      xRequestId: req.header('x-request-id'),
      dataId: String(req.query['data.id'] ?? req.body?.data?.id ?? ''),
      secret: process.env.MP_WEBHOOK_SECRET!,
      toleranceSeconds: 300,
    });
  } catch (err) {
    if (err instanceof InvalidWebhookSignatureError) return res.sendStatus(401);
    throw err;
  }

  // 2. Ack fast so MP doesn't retry while we do work
  res.sendStatus(200);

  // 3. Fetch truth and act
  try {
    const { type, data } = req.body ?? {};
    if (type !== 'payment' || !data?.id) return;
    if (await alreadyProcessed(String(data.id))) return;

    const payment = await fetchPayment(String(data.id));
    if (payment.status === 'approved') {
      await fulfill(payment.external_reference, payment);
    }
    await markProcessed(String(data.id));
  } catch (err) {
    console.error('webhook processing failed', err);
  }
});

async function fetchPayment(id: string) {
  const r = await fetch(`${MP_API}/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });
  if (!r.ok) throw new Error(`fetch payment ${id} failed: ${r.status}`);
  return r.json();
}

/**
 * Manual verification (no SDK) — use when you cannot use the helper:
 *
 *   const xSig = req.header('x-signature') ?? '';
 *   const ts = xSig.match(/ts=([^,]+)/)?.[1];
 *   const v1 = xSig.match(/v1=([^,]+)/)?.[1];
 *   const manifest = `id:${req.query['data.id']};request-id:${req.header('x-request-id')};ts:${ts};`;
 *   const expected = crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET!)
 *     .update(manifest).digest('hex');
 *   if (v1 !== expected) return res.sendStatus(401);
 */
export function verifyManually(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  secret: string,
): boolean {
  const ts = xSignature.match(/ts=([^,]+)/)?.[1];
  const v1 = xSignature.match(/v1=([^,]+)/)?.[1];
  if (!ts || !v1) return false;
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
}

export default app;
