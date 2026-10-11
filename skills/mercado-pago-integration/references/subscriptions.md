# Subscriptions (preapproval) — Reference

Mercado Pago calls recurring billing **preapproval**. There are two objects:

- **`preapproval_plan`** — a reusable plan (price, frequency) you can link many subscribers to. Good for standard tiers.
- **`preapproval`** — the per-subscriber agreement. Created with or without a plan. Carries the payer, card token, and schedule.

## Table of contents
1. Create a subscription
2. Plans vs plan-less
3. Webhooks & lifecycle
4. Cancellation (both directions)
5. Failed charges & dunning
6. Proration & trials
7. Management endpoints

## 1. Create a subscription

`POST https://api.mercadopago.com/preapproval`

Tokenize the card **client-side** first (Bricks or `createCardToken`), then create the preapproval server-side.

```jsonc
{
  "reason": "Pro plan — monthly",
  "external_reference": "user_4821",        // your join key — set it first
  "payer_email": "payer@example.com",
  "card_token_id": "<card_token_id>",
  "back_url": "https://app.example.com/billing/return",
  "status": "authorized",                    // charges now; "pending" does not
  "auto_recurring": {
    "frequency": 1,
    "frequency_type": "months",              // "days" | "months"
    "transaction_amount": 29.9,              // decimal currency
    "currency_id": "BRL",
    "start_date": "2026-07-01T00:00:00.000-03:00",
    "end_date": "2027-07-01T00:00:00.000-03:00",
    "free_trial": { "frequency": 14, "frequency_type": "days" }   // optional
  }
}
```

Node:
```ts
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
const preApproval = new PreApproval(new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! }));

const sub = await preApproval.create({
  body: {
    reason: 'Pro plan — monthly',
    external_reference: 'user_4821',
    payer_email: 'payer@example.com',
    card_token_id: cardTokenId,
    back_url: 'https://app.example.com/billing/return',
    status: 'authorized',
    auto_recurring: {
      frequency: 1, frequency_type: 'months',
      transaction_amount: 29.9, currency_id: 'BRL',
      start_date: '2026-07-01T00:00:00.000-03:00',
      end_date: '2027-07-01T00:00:00.000-03:00',
    },
  },
});
// Persist sub.id (MP id) + external_reference together, immediately.
```

Python:
```python
result = sdk.preapproval().create({
    "reason": "Pro plan — monthly",
    "external_reference": "user_4821",
    "payer_email": "payer@example.com",
    "card_token_id": card_token_id,
    "back_url": "https://app.example.com/billing/return",
    "status": "authorized",
    "auto_recurring": {
        "frequency": 1, "frequency_type": "months",
        "transaction_amount": 29.9, "currency_id": "BRL",
        "start_date": "2026-07-01T00:00:00.000-03:00",
        "end_date": "2027-07-01T00:00:00.000-03:00",
    },
})
sub = result["response"]
```

> `status: "authorized"` charges immediately. `"pending"` creates the subscription without charging — use it when you want the payer to complete authorization later (e.g. redirect to `back_url`/`init_point`).

## 2. Plans vs plan-less

Create a plan once, then reference it per subscriber:
```jsonc
// POST /preapproval_plan
{ "reason": "Pro plan", "auto_recurring": { "frequency": 1, "frequency_type": "months", "transaction_amount": 29.9, "currency_id": "BRL" },
  "back_url": "https://app.example.com/billing/return" }
```
Then `POST /preapproval` with `"preapproval_plan_id": "<plan_id>"` plus `payer_email` + `card_token_id`. If you allow the payer to choose the amount (donations), use plan-less preapproval and set `transaction_amount` per subscriber.

## 3. Webhooks & lifecycle

Subscribe to three topics:

| Topic | Fires on | Use for |
|-------|----------|---------|
| `subscription_preapproval` | Subscription created/updated — `authorized`, `paused`, `cancelled` | Grant/revoke access on lifecycle changes. |
| `subscription_authorized_payment` | Each recurring charge attempt (approved or failed) | Extend/reduce the billing period. |
| `payment` | The underlying payment for each charge | Canonical payment status. |

**Treat webhooks as truth.** On every notification: verify signature → ack 200 → fetch the resource by id → branch on the confirmed `status`.

- `subscription_preapproval` → `GET https://api.mercadopago.com/preapproval/search` with `external_reference`, or `GET /preapproval/{id}`.
- `subscription_authorized_payment` → `GET https://api.mercadopago.com/authorized_payments/{id}` (the invoice; its `status` reflects the cycle outcome).

## 4. Cancellation (both directions)

**User cancels in your app** → you must tell MP:
```
PUT https://api.mercadopago.com/preapproval/{id}
{ "status": "cancelled" }        # or "paused" to suspend
```
Skip this and you keep billing a churned user → chargebacks.

**User cancels inside Mercado Pago** → you hear it via `subscription_preapproval` with `status: cancelled`. Fetch to confirm, then revoke access. Do **not** wait for "the next failed charge" — there won't be one.

Wire both directions and keep a reconciliation job as a backstop.

## 5. Failed charges & dunning

MP retries failed charges on its **own** schedule — you don't drive retries. You learn each attempt via `subscription_authorized_payment`. Pattern:

1. On approved cycle → extend the paid-through date.
2. On failure → enter a grace window (keep access briefly).
3. After repeated failures → revoke.

Confirm current retry cadence in the dashboard; treat it as configuration, not a constant.

## 6. Proration & trials

- `free_trial` inside `auto_recurring` gives a trial period before the first charge.
- Proration is configured when changing plans/amounts; MP computes the delta for the current period. Verify exact field names against the current API reference for your region before shipping.

## 7. Management endpoints

| Action | Endpoint |
|--------|----------|
| Create | `POST /preapproval` |
| Get by id | `GET /preapproval/{id}` |
| Update (pause/cancel/amount) | `PUT /preapproval/{id}` |
| Search | `GET /preapproval/search?external_reference=...` |
| Create plan | `POST /preapproval_plan` |
| Get invoice/charge | `GET /authorized_payments/{id}` |
