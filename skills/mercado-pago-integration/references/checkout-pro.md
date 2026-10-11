# Checkout Pro — Full Reference

Checkout Pro is Mercado Pago's hosted payment page. You create a **preference**, redirect the buyer to its `init_point`, and MP handles the payment UI, method selection, 3DS and fraud checks. You learn the outcome via webhooks. Lowest PCI burden, fastest go-live.

## Table of contents
1. End-to-end flow
2. Create preference — request fields
3. Response fields
4. Redirect / back URLs
5. Sandbox vs production
6. Reference implementation (Node & Python)

## 1. End-to-end flow

1. Buyer adds items on your site and starts checkout.
2. Your backend creates a preference and gets an `id` + `init_point`.
3. Redirect the buyer to `init_point` (or `sandbox_init_point` with test credentials).
4. Buyer pays on MP's page. MP redirects back to your `back_urls` — **this is UX only, not proof of payment**.
5. MP sends a webhook (`payment` topic). You fetch the payment by id and fulfill on `status: approved`.

## 2. Create preference — request fields

`POST https://api.mercadopago.com/checkout/preferences`
Headers: `Authorization: Bearer <ACCESS_TOKEN>`, `Content-Type: application/json`.

| Field | Type | Notes |
|-------|------|-------|
| `items[]` | array | **Required.** One entry per line item. |
| `items[].id` | string | Your SKU id. |
| `items[].title` | string | Shown to the buyer. |
| `items[].quantity` | int | |
| `items[].unit_price` | number | **Decimal** currency, e.g. `24.5` = R$24.50. |
| `items[].currency_id` | string | `BRL`, `ARS`, `MXN`, … |
| `items[].description`, `picture_url`, `category_id` | string | Optional presentation. |
| `payer` | object | `{ name, surname, email, phone: { area_code, number }, identification: { type, number }, address: { zip_code, street_name, street_number } }`. Prefills fields; `identification.type` is `CPF`/`CNPJ` (BR), `DNI` (AR), etc. |
| `back_urls` | object | `{ success, pending, failure }` — all must be **HTTPS**. |
| `auto_return` | string | `approved` or `all`. Requires an HTTPS `back_urls.success`. Auto-redirects the buyer. |
| `notification_url` | string | Webhook URL (≤248 chars). Append `?source_news=webhooks` to receive webhooks only (not legacy IPN). |
| `external_reference` | string | Your order/user id — the join key. Set it always. |
| `payment_methods` | object | `{ excluded_payment_methods:[{id}], excluded_payment_types:[{id}], installments, default_installments, default_payment_method_id }`. |
| `expires` | boolean | Whether the preference expires. |
| `expiration_date_from`, `expiration_date_to` | ISO date | Time-box the preference. |
| `binary_mode` | boolean | `true` → only `approved`/`rejected` (no `in_process`). |
| `statement_descriptor` | string | Text on the buyer's card statement. |
| `metadata` | object | Arbitrary key/values echoed back on the payment. |
| `shipments` | object | Shipping cost and `receiver_address` for physical goods. |
| `marketplace`, `marketplace_fee`, `differential_pricing`, `operation_type` | — | Advanced / marketplace splits. |

## 3. Response fields

| Field | Meaning |
|-------|---------|
| `id` | Preference id. |
| `init_point` | Production URL to start checkout. |
| `sandbox_init_point` | Test URL — use with `TEST-` credentials. |
| `client_id`, `collector_id`, `date_created`, `items`, … | Echo of the created preference. |

## 4. Redirect / back URLs

- `back_urls.success` fires on approved (and, for card payments with 3DS, after authentication).
- `back_urls.pending` fires for pending methods (PIX, Boleto, OXXO, bank transfer).
- `back_urls.failure` fires on rejection.
- **Do not grant entitlements here.** Verify via webhook + `GET /v1/payments/{id}`.

## 5. Sandbox vs production

| Credential | Use | Redirect to |
|-----------|-----|-------------|
| `TEST-...` | Development | `sandbox_init_point` |
| `APP_USR-...` | Production | `init_point` |

Testing through Checkout Pro must be done while logged in as a **test buyer user** (created in the panel). See `testing-and-credentials.md`.

## 6. Reference implementation

### Node / TypeScript
```ts
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
const preference = new Preference(client);

export async function createCheckout(order: { id: string; total: number; email: string }) {
  const result = await preference.create({
    body: {
      items: [{ id: order.id, title: `Order ${order.id}`, quantity: 1, unit_price: order.total, currency_id: 'BRL' }],
      payer: { email: order.email },
      external_reference: order.id,
      back_urls: {
        success: `${process.env.APP_URL}/checkout/success`,
        pending: `${process.env.APP_URL}/checkout/pending`,
        failure: `${process.env.APP_URL}/checkout/failure`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.API_URL}/api/mp/webhook?source_news=webhooks`,
    },
  });

  const base = process.env.MP_ENV === 'production' ? result.init_point : result.sandbox_init_point;
  return { preferenceId: result.id, checkoutUrl: base };
}
```

### Python
```python
import mercadopago, os

sdk = mercadopago.SDK(os.environ["MP_ACCESS_TOKEN"])

def create_checkout(order):
    result = sdk.preference().create({
        "items": [{"id": order["id"], "title": f"Order {order['id']}",
                   "quantity": 1, "unit_price": order["total"], "currency_id": "BRL"}],
        "payer": {"email": order["email"]},
        "external_reference": order["id"],
        "back_urls": {
            "success": f"{os.environ['APP_URL']}/checkout/success",
            "pending": f"{os.environ['APP_URL']}/checkout/pending",
            "failure": f"{os.environ['APP_URL']}/checkout/failure",
        },
        "auto_return": "approved",
        "notification_url": f"{os.environ['API_URL']}/api/mp/webhook?source_news=webhooks",
    })
    pref = result["response"]
    base = pref["init_point"] if os.environ.get("MP_ENV") == "production" else pref["sandbox_init_point"]
    return {"preference_id": pref["id"], "checkout_url": base}
```
