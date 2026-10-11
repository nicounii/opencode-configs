# Checkout Bricks & Checkout API — Reference

Use these when you need a **branded, embedded** checkout instead of a redirect. Both keep raw card data away from your server: the browser tokenizes the card with the Public Key; your backend only ever sees a single-use `token`.

- **Checkout Bricks** — MP-provided, prebuilt UI components (card form, wallet button, payment-method picker, status screen, security-code). Fastest embedded route; MP handles tokenization and 3DS. Recommended for most embedded needs.
- **Checkout API** — you build the UI; you call `createCardToken` yourself and post the token to `POST /v1/payments`. Maximum control.

## Table of contents
1. Card tokenization (frontend)
2. Create a payment (backend)
3. Payment statuses and `status_detail`
4. 3DS (authentication)
5. Installments (parcelamento)
6. Bricks quick reference

## 1. Card tokenization (frontend)

MercadoPago.js v2:
```html
<script src="https://sdk.mercadopago.com/js/v2"></script>
<script>
  const mp = new MercadoPago('YOUR_PUBLIC_KEY', { locale: 'pt-BR' });

  const cardToken = await mp.createCardToken({
    cardNumber: '4235647728025682',
    cardholderName: 'APRO',
    cardExpirationMonth: '11',
    cardExpirationYear: '2030',
    securityCode: '123',
    identificationType: 'CPF',
    identificationNumber: '12345678909',
  });
  // send cardToken.id to your backend
</script>
```

With Bricks you skip this: the `<CardPayment>` brick produces a `formData` object you pass to your backend, and your backend calls `mp.bricks().create("cardPayment", ...)` — but the simplest Bricks flow is: brick collects data → you call the SDK's `createCardToken` for cards → create payment server-side.

The token is **single-use** and short-lived; create a fresh one per attempt.

## 2. Create a payment (backend)

`POST https://api.mercadopago.com/v1/payments`

```jsonc
{
  "transaction_amount": 24.5,       // decimal currency, NOT cents
  "token": "<card_token_id>",
  "description": "Premium plan",
  "installments": 1,
  "payment_method_id": "master",    // visa, master, amex, elo, pix, bolbradesco...
  "issuer_id": "24",                // optional
  "payer": {
    "email": "buyer@example.com",
    "first_name": "APRO",
    "identification": { "type": "CPF", "number": "12345678909" }
  },
  "external_reference": "order_123",
  "notification_url": "https://yourdomain.com/api/mp/webhook?source_news=webhooks",
  "statement_descriptor": "MYSTORE",
  "three_d_secure_mode": "optional"   // optional
}
```

Node:
```ts
import { MercadoPagoConfig, Payment } from 'mercadopago';
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
const payment = new Payment(client);

const res = await payment.create({
  body: {
    transaction_amount: 24.5,
    token,
    description: 'Premium plan',
    installments: 1,
    payment_method_id: 'master',
    payer: { email: 'buyer@example.com', identification: { type: 'CPF', number: '12345678909' } },
    external_reference: 'order_123',
  },
  requestOptions: { idempotencyKey: 'order_123' },
});
```

Python:
```python
import mercadopago, os
sdk = mercadopago.SDK(os.environ["MP_ACCESS_TOKEN"])

opts = mercadopago.config.RequestOptions()
opts.custom_headers = {"x-idempotency-key": "order_123"}

result = sdk.payment().create({
    "transaction_amount": 24.5,
    "token": card_token_id,
    "description": "Premium plan",
    "installments": 1,
    "payment_method_id": "master",
    "payer": {"email": "buyer@example.com",
              "identification": {"type": "CPF", "number": "12345678909"}},
    "external_reference": "order_123",
}, opts)
payment = result["response"]
```

## 3. Payment statuses and `status_detail`

| `status` | Meaning | Action |
|----------|---------|--------|
| `approved` | Paid. | Fulfill. |
| `in_process` / `pending` | Awaiting confirmation (PIX, Boleto, 3DS review, manual review). | Show pending UI; wait for webhook. |
| `rejected` | Declined/cancelled/failed. | Read `status_detail`; show reason. |
| `refunded` / `charged_back` | Reversed. | Revoke entitlements. |

Common `status_detail`: `accredited`, `pending_waiting_payment`, `cc_rejected_insufficient_amount`, `cc_rejected_bad_filled_card_number`, `cc_rejected_call_for_authorize`, `cc_rejected_high_risk`, `rejected_insufficient_data`. Always surface it in logs.

## 4. 3DS (authentication)

MP may require 3D Secure for card payments (mandatory in Brazil for many cases). Two modes:
- `three_d_secure_mode: "optional"` — challenge only when the issuer requires it.
- `three_d_secure_mode: "not_supported"` — skip (may raise decline rates).

When 3DS is triggered the payment comes back `in_process` with `status_detail: pending_challenge`, and the response carries `three_ds_info` with a `creds`/`external_resource_url` you must present (iframe/redirect) to complete the challenge. Finish it, then the payment settles to `approved`/`rejected`.

## 5. Installments (parcelamento)

Brazilian buyers usually pay in installments. Discover options with the method's `installments` and any `payer_costs`:
```
GET /v1/payment_methods/installments?payment_method_id=visa&amount=100&public_key=<PUBLIC_KEY>
```
Pass the chosen `installments` (and `issuer_id` if returned) into the payment. `installments: 1` = full price ("à vista").

## 6. Bricks quick reference

| Brick | Purpose |
|-------|---------|
| `cardPayment` | Card form + tokenization + 3DS. |
| `payment` | Full payment-method picker (cards + PIX + Boleto). |
| `wallet` | "Pay with Mercado Pago" button. |
| `statusScreen` | Renders the payment result. |
| `securityCode` | CVV capture for saved cards. |

Initialize on the frontend with your Public Key, then create the payment server-side from the `formData` the brick produces.
