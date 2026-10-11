# Webhooks & Signature Security — Reference

Mercado Pago notifies your server via signed HTTP POST requests. A notification tells you **something happened**; it is never the source of truth. Fetch the resource it names, then act on the confirmed state.

## Table of contents
1. Notification shape
2. Signature verification (manifest & HMAC)
3. Configuration methods
4. Topics → fetch endpoints
5. Idempotency & ack discipline
6. Full handlers (Node & Python)
7. Reconciliation backstop
8. Troubleshooting

## 1. Notification shape

```json
{
  "id": 12345,
  "live_mode": true,
  "type": "payment",
  "action": "payment.created",
  "date_created": "2015-03-25T10:04:58.396-04:00",
  "user_id": 44444,
  "api_version": "v1",
  "data": { "id": "999999999" }
}
```

- `type` is the **topic** (`payment`, `orders`, `subscription_preapproval`, `subscription_authorized_payment`, …).
- `data.id` is the resource id. It is also mirrored in the query string as `?data.id=...`.
- `action` gives a hint (`payment.created`, `payment.updated`), but do not branch on it — fetch the resource.

## 2. Signature verification (manifest & HMAC)

Headers:
- `x-signature: ts=1704908010,v1=618c85345248dd820d5fd456117c2ab2eb8a8f63d0f4c0d7b8b31e6f7d3a9c2a`
- `x-request-id: <uuid>`
- `data.id` in the query string.

The signed manifest is exactly:
```
id:<data.id>;request-id:<x-request-id>;ts:<ts>;
```

Compute `HMAC-SHA256(secret, manifest)` as hex and compare in constant time to `v1`. Reject on mismatch with `401`. The secret is generated per application in **Your integrations → Webhooks → Configure notifications**.

Pass `data.id` lower-cased as MP does; if the resource id is alphanumeric, normalize case before building the manifest (the official SDKs handle this).

## 3. Configuration methods

| Method | Where | Notes |
|--------|-------|-------|
| **Your integrations** | Panel → Webhooks → Configure | Per-application URLs + events; generates the signing secret. Separate test/production URLs. |
| **During payment creation** | `notification_url` field on preference/payment/order | Per-transaction. Takes precedence. Append `?source_news=webhooks` to get webhooks (not legacy IPN). Not available for QR/Point/Subscriptions-via-panel. |

Subscriptions and QR Code require the per-transaction method.

## 4. Topics → fetch endpoints

| Topic | Fetch |
|-------|-------|
| `payment` | `GET /v1/payments/{id}` |
| `orders` | `GET /v1/orders/{id}` |
| `subscription_preapproval` | `GET /preapproval/search` (by `external_reference`) / `GET /preapproval/{id}` |
| `subscription_preapproval_plan` | `GET /preapproval_plan/search` |
| `subscription_authorized_payment` | `GET /authorized_payments/{id}` |
| `topic_merchant_order_wh` | `GET /merchant_orders/{id}` (deprecated) |
| `topic_chargebacks_wh` | `GET /v1/chargebacks/{id}` |
| `topic_claims_integration_wh` | `GET /post-purchase/v1/claims/{id}` |

## 5. Idempotency & ack discipline

- **Ack fast:** return `200` or `201` immediately, before heavy work. MP retries anything it doesn't see acked → duplicates.
- **Process out of band:** enqueue the work (job/queue) after acking so slow DB writes don't cause redelivery.
- **Dedupe:** store processed event ids (or resource id + `action`) and skip repeats. At-least-once delivery is guaranteed, exactly-once is not.
- **Verify before trusting:** always validate `x-signature` first.

## 6. Full handlers

### Node / Express
```ts
import express from 'express';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { WebhookSignatureValidator, InvalidWebhookSignatureError } from 'mercadopago';

const app = express();
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

app.post('/api/mp/webhook', express.json(), async (req, res) => {
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

  res.sendStatus(200);                       // ack first

  const { type, data } = req.body;
  if (type !== 'payment') return;
  if (await alreadyProcessed(String(data.id))) return;

  const r = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });
  const payment = await r.json();
  if (payment.status === 'approved') await fulfill(payment.external_reference, payment);
  await markProcessed(String(data.id));
});
```

Manual (no SDK) verification:
```ts
import crypto from 'node:crypto';
const [ts, v1] = ['ts', 'v1'].map(k => req.header('x-signature')!.match(new RegExp(`${k}=([^,]+)`))![1]);
const manifest = `id:${req.query['data.id']};request-id:${req.header('x-request-id')};ts:${ts};`;
const expected = crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET!).update(manifest).digest('hex');
if (v1 !== expected) return res.sendStatus(401);
```

### Python / FastAPI
```python
from fastapi import FastAPI, Request, Response
from mercadopago.webhook import WebhookSignatureValidator, InvalidWebhookSignatureError
import httpx, os

app = FastAPI()

@app.post("/api/mp/webhook")
async def webhook(request: Request):
    try:
        WebhookSignatureValidator.validate(
            x_signature=request.headers.get("x-signature"),
            x_request_id=request.headers.get("x-request-id"),
            data_id=request.query_params.get("data.id"),
            secret=os.environ["MP_WEBHOOK_SECRET"],
            tolerance_seconds=300,
        )
    except InvalidWebhookSignatureError as e:
        print("rejected:", e.reason, e.request_id, e.timestamp)
        return Response(status_code=401)

    body = await request.json()
    # ack fast; enqueue the real work
    if body.get("type") == "payment":
        pid = body["data"]["id"]
        async with httpx.AsyncClient() as c:
            r = await c.get(
                f"https://api.mercadopago.com/v1/payments/{pid}",
                headers={"Authorization": f"Bearer {os.environ['MP_ACCESS_TOKEN']}"},
            )
            payment = r.json()
            if payment["status"] == "approved":
                await fulfill(payment["external_reference"], payment)
    return Response(status_code=200)
```

## 7. Reconciliation backstop

Webhooks get dropped. Run a scheduled job:
- `GET /v1/payments/search?external_reference=<order>` for recent orders stuck `pending`.
- `GET /preapproval/search` for subscriptions whose local state disagrees with MP.
- `GET /merchant_orders/{id}` for Checkout Pro orders.

Reconcile local state to MP's confirmed state, never the reverse.

## 8. Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| 401 on every webhook | Secret mismatch, or `data.id` case not normalized. |
| Duplicate fulfillment | Not deduping events, or doing work before ack causing redelivery. |
| No webhooks at all | `notification_url` not HTTPS, unreachable, or IPN instead of webhooks (add `?source_news=webhooks`). |
| Webhook fires but status stale | Reading the notification body instead of fetching the resource. |
| Subscriptions never notify | Using panel config; subscriptions need per-transaction `notification_url`. |
