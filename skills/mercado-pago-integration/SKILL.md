---
name: mercado-pago-integration
description: "Implement Mercado Pago payment processing for Latin America — Checkout Pro (hosted redirect), Checkout Bricks / Checkout API (transparent card + PIX/Boleto), subscriptions (preapproval), refunds, and signed webhooks. Use this skill whenever the user mentions Mercado Pago, MercadoPago, MP, PIX, Boleto, pagamentos, checkout preferences, preapproval, or payment integration for a Brazilian / LatAm app, even if they just say 'add payments' for a Brazil-based product without naming a provider. Also use when porting a Stripe-style integration to Mercado Pago, or when debugging Mercado Pago webhooks, credentials, test users, or payment statuses. Do NOT use for other gateways (Stripe, PagSeguro, Pagar.me, Braintree, Apple Pay / Google Pay); if the user asks for a neutral cross-gateway comparison, contribute only the Mercado Pago side."
---

# Mercado Pago Integration

Mercado Pago (MP) is Mercado Libre's payments platform and the dominant gateway across Latin America — Brazil (PIX, Boleto, cards), Argentina, Mexico (SPEI, OXXO), Chile, Colombia, Peru and Uruguay. This skill covers PCI-conscious integration for Checkout Pro, Checkout Bricks / Checkout API, Subscriptions, refunds, and webhooks, with first-class Node/TypeScript and Python examples.

## Do not use this skill when

- The payment provider is **not** Mercado Pago (use the relevant provider skill, e.g. `stripe-integration` for Stripe).
- The task is unrelated to payments, checkout, subscriptions, or billing.

## Use this skill when

- Integrating online payments in a web/mobile app for a LatAm market, especially Brazil.
- Choosing between Checkout Pro, Checkout Bricks, and Checkout API.
- Adding PIX and/or Boleto (offline) payments.
- Setting up recurring billing / subscriptions (MP calls these **preapproval**).
- Handling webhooks, signature verification, refunds, disputes, or payment reconciliation.
- Debugging MP credentials, test users, test cards, or payment status transitions.

## The 60-second mental model

| You want… | MP solution | Key API object |
|-----------|-------------|----------------|
| Fastest go-live, hosted page, lowest PCI scope | **Checkout Pro** | `preference` → `init_point` |
| Branded embedded UI, many payment methods | **Checkout Bricks** | client-side JS SDK + server `payment` |
| Full control / custom card form | **Checkout API** | `payment` (card token) |
| Recurring / subscription billing | **Subscriptions** | `preapproval` (+ `preapproval_plan`) |
| Notifications back to your server | **Webhooks** | signed HTTP POST |

**Two credentials, two roles:**
- **Access Token** (`TEST-...` or `APP_USR-...`) — server-side only. Authorizes every API call.
- **Public Key** (`TEST-...` / `APP_USR-...`) — frontend only. Used by the JS SDK to tokenize cards.

> **Never put the Access Token in client code.** Card data only ever goes from the browser to MP's tokenizer; your server sees nothing but a single-use token.

## The two differences that trip up Stripe developers

1. **Amounts are decimal currency, not integer cents.** MP uses `unit_price: 24.5` for R$24.50 and `transaction_amount: 24.5`. Sending `2450` charges R$2,450.00. This is the single most common MP bug.
2. **Subscriptions are called `preapproval`.** There is no `subscription` object. Lifecycle flows through `/preapproval`; each recurring charge is an `authorized_payment`.

## Quick Start

### Node / TypeScript

```bash
npm install mercadopago   # v2+ SDK
```

```ts
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
  options: { timeout: 5000 },
});

const preference = new Preference(client);
const result = await preference.create({
  body: {
    items: [
      { id: 'sku-1', title: 'Premium plan', quantity: 1, unit_price: 24.5, currency_id: 'BRL' },
    ],
    back_urls: {
      success: 'https://yourdomain.com/success',
      pending: 'https://yourdomain.com/pending',
      failure: 'https://yourdomain.com/failure',
    },
    auto_return: 'approved',
    external_reference: 'order_123',          // your join key
    notification_url: 'https://yourdomain.com/api/mp/webhook?source_news=webhooks',
  },
});

// Redirect the buyer to result.init_point (use result.sandbox_init_point with TEST- creds)
console.log(result.init_point);
```

### Python

```bash
pip install mercadopago
```

```python
import mercadopago

sdk = mercadopago.SDK("YOUR_ACCESS_TOKEN")  # server-side only

preference_data = {
    "items": [
        {"id": "sku-1", "title": "Premium plan", "quantity": 1,
         "unit_price": 24.5, "currency_id": "BRL"},
    ],
    "back_urls": {
        "success": "https://yourdomain.com/success",
        "pending": "https://yourdomain.com/pending",
        "failure": "https://yourdomain.com/failure",
    },
    "auto_return": "approved",
    "external_reference": "order_123",
    "notification_url": "https://yourdomain.com/api/mp/webhook?source_news=webhooks",
}

result = sdk.preference().create(preference_data)
preference = result["response"]
print(preference["init_point"])   # redirect the buyer here
```

`auto_return: 'approved'` only takes effect when `back_urls.success` is an HTTPS URL — the buyer is auto-redirected on approval. Always keep a "return to site" path too.

## Payment Implementation Patterns

### Pattern 1 — Checkout Pro (hosted, recommended default)
Create a `preference` per order (see Quick Start). The buyer pays on MP's page; you learn the outcome from **webhooks**, not the redirect. The redirect (`back_urls`) is a UX courtesy only — a user can fake it, and it can fire before settlement. Never grant access off the redirect.

Useful preference fields:
- `items[]` — `id, title, quantity, unit_price, currency_id`. One item per line; `unit_price` is decimal.
- `payment_methods` — `excluded_payment_methods`, `excluded_payment_types` (e.g. `{"id": "ticket"}`), `installments` (max), `default_installments`.
- `payer` — prefill `email`, `name`, `identification` (`{"type": "CPF", "number": "..."}`).
- `shipments` — shipping cost and receiver address (if you ship physical goods).
- `expires` / `expiration_date_from` / `expiration_date_to` — time-box the preference.
- `binary_mode` — when `true`, the payment is only `approved` or `rejected` (no `in_process`).
- `metadata` / `external_reference` — attach your order/user ids.

### Pattern 2 — Checkout API (transparent card)
Card data is tokenized in the browser (JS SDK or Bricks); the server creates the payment with the token.

Frontend (MercadoPago.js v2):
```html
<script src="https://sdk.mercadopago.com/js/v2"></script>
<script>
  const mp = new MercadoPago('YOUR_PUBLIC_KEY', { locale: 'pt-BR' });
  const cardToken = await mp.createCardToken(cardFormData); // from your form fields
  // POST { token: cardToken.id, ... } to your backend
</script>
```

Backend (Node):
```ts
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
const payment = new Payment(client);

const result = await payment.create({
  body: {
    transaction_amount: 24.5,       // decimal, NOT cents
    token: cardTokenId,
    description: 'Premium plan',
    installments: 1,
    payment_method_id: 'master',    // or 'visa','pix','bolbradesco'...
    payer: {
      email: 'buyer@example.com',
      identification: { type: 'CPF', number: '19119119100' },
    },
    external_reference: 'order_123',
    notification_url: 'https://yourdomain.com/api/mp/webhook?source_news=webhooks',
  },
  requestOptions: { idempotencyKey: 'order_123' },   // prevents duplicate charges on retry
});

switch (result.status) {
  case 'approved':    /* fulfill */ break;
  case 'in_process':  /* show pending UI */ break;
  case 'rejected':    /* show result.status_detail */ break;
}
```

### Pattern 3 — PIX (Brazil, offline/pending)
PIX is created like any payment with `payment_method_id: 'pix'`. The response carries the QR code under `point_of_interaction.transaction_data`. The payment stays `pending` until the buyer pays; confirm via webhook.

```ts
const result = await payment.create({
  body: {
    transaction_amount: 24.5,
    description: 'Premium plan',
    payment_method_id: 'pix',
    payer: { email: 'buyer@example.com', identification: { type: 'CPF', number: '19119119100' } },
    external_reference: 'order_123',
  },
});

const data = result.point_of_interaction.transaction_data;
// data.qr_code        -> copy-paste PIX string
// data.qr_code_base64 -> base64 PNG to render
// data.ticket_url     -> hosted PIX page
```

Boleto works the same way with `payment_method_id: 'bolbradesco'`; the payload includes a `barcode`/`ticket_url` and ends `pending`.

### Pattern 4 — Subscriptions (preapproval)
Two-step: tokenize the card client-side → create the preapproval server-side. `status: 'authorized'` charges immediately; `status: 'pending'` does not.

```ts
import { MercadoPagoConfig, PreApproval } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
const preApproval = new PreApproval(client);

const sub = await preApproval.create({
  body: {
    reason: 'Pro plan — monthly',
    external_reference: 'user_4821',       // your join key
    payer_email: 'payer@example.com',
    card_token_id: cardTokenId,
    back_url: 'https://app.example.com/billing/return',
    status: 'authorized',
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',             // days | months
      transaction_amount: 29.9,             // decimal
      currency_id: 'BRL',
      start_date: '2026-07-01T00:00:00.000-03:00',
      end_date: '2027-07-01T00:00:00.000-03:00',
    },
  },
});
// Persist sub.id (MP id) + external_reference immediately.
```

Lifecycle is webhook-driven. Subscribe to `subscription_preapproval` (state: authorized/paused/cancelled) and `subscription_authorized_payment` (each charge attempt). **Cancel both directions**: when a user cancels in your app, call the cancel endpoint (`PUT /preapproval/{id}` with `{"status": "cancelled"}`); when they cancel inside MP, react to the `cancelled` webhook and revoke access.

### Pattern 5 — Refunds
```ts
import { MercadoPagoConfig, PaymentRefund } from 'mercadopago';
const refund = new PaymentRefund(new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! }));

// Full refund
await refund.create({ payment_id: 123456789 });

// Partial refund
await refund.create({ payment_id: 123456789, body: { amount: 10.0 } });
```
Python: `sdk.refund().create(payment_id)` (full) or `sdk.refund().create(payment_id, body)`.

### Pattern 6 — Reconciliation (search by your id)
When a match is uncertain, search rather than guess:
- `GET /v1/payments/search?external_reference=order_123`
- `GET /merchant_orders/{id}` (Checkout Pro / QR, deprecated but still common)
- `GET /preapproval/search?external_reference=user_4821`

## Webhook Handling

MP signs notifications with an `x-signature` header (`ts=<unix>,v1=<hmac>`), sends `x-request-id`, and puts the resource id in the query as `data.id`. The manifest is:

```
id:<data.id>;request-id:<x-request-id>;ts:<ts>;
```

Hashed with HMAC-SHA256 using your webhook **secret** and compared in constant time.

**The golden rule:** a notification is a *hint*, not truth. Return `200`/`201` fast, then fetch the resource by id and act on the confirmed status. Never branch on the notification body alone, and never fulfill off the browser redirect.

### Node / Express

```ts
import express from 'express';
import { WebhookSignatureValidator, InvalidWebhookSignatureError } from 'mercadopago';

const app = express();
app.use(express.json());

app.post('/api/mp/webhook', async (req, res) => {
  try {
    WebhookSignatureValidator.validate({
      xSignature: req.header('x-signature'),
      xRequestId: req.header('x-request-id'),
      dataId: String(req.query['data.id'] ?? req.body?.data?.id),
      secret: process.env.MP_WEBHOOK_SECRET!,
      toleranceSeconds: 300,
    });
  } catch (err) {
    if (err instanceof InvalidWebhookSignatureError) return res.sendStatus(401);
    throw err;
  }

  res.sendStatus(200);   // ack before doing work

  const { type, data } = req.body;
  if (type === 'payment') {
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });
    const payment = await r.json();       // confirmed status lives here
    if (payment.status === 'approved') await fulfill(payment.external_reference, payment);
  }
});
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
    except InvalidWebhookSignatureError:
        return Response(status_code=401)

    body = await request.json()
    # ack fast; do the work async in a queue/task
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

**Finance best practices for webhooks:** verify signature first, ack within a few seconds, fetch-and-branch on the real resource, process idempotently (dedupe on event `id`/resource id), and run a daily reconciliation job as a backstop for missed deliveries. MP retries un-acked notifications, so a slow handler causes duplicates.

## Payment Methods (Brazil-first, LatAm-aware)

| Market | `payment_method_id` / type | Notes |
|--------|----------------------------|-------|
| Brazil | `pix` | Instant, offline/pending, QR code |
| Brazil | `bolbradesco` (Boleto) | Offline/pending, barcode |
| Brazil / global | `visa`, `master`, `amex`, `elo`, `hipercard` | Cards, installments (parcelamento) |
| Argentina | `rapipago`, `pagofacil` | Cash |
| Mexico | `oxxo` (OXXO), `spei` | Cash / bank transfer |
| Chile/Colombia/Peru | local cash + bank transfers | Region portal differs |

Payment ids and availability depend on the seller's country and account. Get them at runtime with `GET /v1/payment_methods?access_token=...` rather than hard-coding.

## Testing & Credentials

- Get credentials in **Your integrations → your application** (`/developers/panel/app`). Use `TEST-` credentials while developing, `APP_USR-` (production) when live.
- Create **test users** (a test buyer and a test seller) from the panel; log in as the test buyer to run the flow.
- **Test cards** (any expiry in the future, CVV `123`, Amex `1234`):

| Flag | Number | Type |
|------|--------|------|
| Mastercard | `5480 8328 0103 3311` | credit |
| Visa | `4235 6477 2802 5682` | credit |
| American Express | `3753 651535 56885` | credit |
| Elo | `5067 7667 8388 8311` | debit |

**The cardholder name drives the result.** Use `APRO` (approved), `OTHE` (general error), `CONT` (pending), `FUND` (insufficient), `SECU` (bad CVV), `OTHE`, `CALL` (validation), etc. Use CPF `12345678909` for approved/declined identities. With `TEST-` credentials the response includes `sandbox_init_point` — redirect there instead of `init_point`.

`status_detail` is where the real reason lives (`accredited`, `cc_rejected_insufficient_amount`, `pending_waiting_payment`, …). Log it.

## Best Practices

1. **Never trust the client.** Fulfill only on a confirmed server-side resource fetched after a webhook, never on the `back_urls` redirect.
2. **Amounts are decimal.** `24.5` = R$24.50. Re-check every amount you write.
3. **Set `external_reference` on day one.** It is your only reliable join key back to your own order/user row.
4. **Send an idempotency key** (`x-idempotency-key`, or Node `requestOptions.idempotencyKey`) on every create call.
5. **Verify `x-signature`** on every webhook and reject mismatches with 401.
6. **Ack webhooks fast (200/201)** and do the work out of band; MP retries un-acked events and you'll get duplicates.
7. **Subscribe to the right topics** (`payment`, `subscription_preapproval`, `subscription_authorized_payment`, …) and handle cancellations in both directions.
8. **Use `TEST-` credentials + test users** to exercise pending/declined/approved before going live.
9. **Keep the Access Token server-side; tokenize cards in the browser** with the Public Key.

## Common Pitfalls

- **Passing cents** (`2450` instead of `24.5`) — charges 100× too much.
- **Fulfilling on the redirect** (`back_urls.success`) — spoofable and premature.
- **Not subscribing to `payment`** — thinking the preference redirect is enough; it isn't.
- **Ignoring `status_detail`** — you log "rejected" with no reason.
- **No idempotency key** — transient errors + client retries create duplicate payments.
- **Hard-coding `payment_method_id`s** — they vary by country/account; fetch them.
- **Skipping signature verification** — anyone can POST to your webhook URL.
- **One-directional cancellation** — user cancels in MP, your app keeps billing/entitling (or vice versa).
- **Confusing `init_point` vs `sandbox_init_point`** — with `TEST-` creds you must use the sandbox URL.

## Resources

Load these only when you need the depth:

- `references/checkout-pro.md` — full preference field reference and Checkout Pro flow.
- `references/checkout-api-bricks.md` — Checkout Bricks & Checkout API (card tokenization, 3DS, installments).
- `references/subscriptions.md` — preapproval plans, schedules, proration, lifecycle, cancellation.
- `references/webhooks-security.md` — signature manifest, topics table, idempotency, reconciliation.
- `references/testing-and-credentials.md` — credentials, test users, full test-card matrix and statuses.

Production-ready starters:

- `assets/mercado-pago-client.ts` — typed Node client wrapper (preference, payment, preapproval, refund, search).
- `assets/mercado-pago-client.py` — Python client wrapper (`sdk.preference()`, `sdk.payment()`, …).
- `assets/webhook-handler.ts` — Express webhook with signature verification + fetch-by-id.
- `assets/webhook_handler.py` — FastAPI webhook with signature verification + fetch-by-id.
