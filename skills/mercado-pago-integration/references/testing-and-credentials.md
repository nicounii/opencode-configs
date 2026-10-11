# Testing & Credentials — Reference

## Table of contents
1. Credentials (Access Token vs Public Key)
2. Where to get them
3. Test users
4. Test cards
5. Cardholder names → payment outcomes
6. status_detail reference
7. Testing the full flow
8. Going to production checklist

## 1. Credentials

| Credential | Prefix | Where it's used | Secret? |
|-----------|--------|-----------------|---------|
| **Access Token** | `TEST-...` (dev) / `APP_USR-...` (prod) | Server-side API calls (`Authorization: Bearer`) | **Yes** — never ship to the client |
| **Public Key** | `TEST-...` / `APP_USR-...` | Frontend JS SDK (tokenization) | No (public) |

Test credentials and production credentials are completely separate environments — data does not cross over.

## 2. Where to get them

1. Sign in at `https://www.mercadopago.com.br/developers/panel/app`.
2. Create an application (**Your integrations**).
3. Open **Credentials** → copy the **test** Access Token + Public Key (and later the **production** pair).
4. Under **Webhooks → Configure notifications**, add your URL, select events, and reveal the **secret** used to verify `x-signature`.

## 3. Test users

Create a **test buyer** and (for marketplace) a **test seller** from the panel. Log in as the test buyer to run Checkout Pro / card flows. If MP asks for an email code when logging in as a test user, enter the **last 6 digits of the test user's id** (shown under Test accounts).

Test users can't log into the production site and can't use real credentials interchangeably.

## 4. Test cards

Use any future expiry date, CVV `123` (`1234` for Amex).

| Card type | Flag | Number | CVV | Exp |
|-----------|------|--------|-----|-----|
| Credit | Mastercard | `5480 8328 0103 3311` | 123 | 11/30 |
| Credit | Visa | `4235 6477 2802 5682` | 123 | 11/30 |
| Credit | American Express | `3753 651535 56885` | 1234 | 11/30 |
| Debit | Elo | `5067 7667 8388 8311` | 123 | 11/30 |

## 5. Cardholder names → payment outcomes

The **cardholder first/last name** drives the simulated result. Combine any test card with a name below:

| Payment status | Cardholder name | Identity (CPF) |
|----------------|-----------------|----------------|
| Approved | `APRO` | `12345678909` |
| Declined — general error | `OTHE` | `12345678909` |
| Pending | `CONT` | — |
| Declined — validation to authorize | `CALL` | — |
| Declined — insufficient amount | `FUND` | — |
| Declined — invalid security code | `SECU` | — |
| Declined — due date issue | `EXPI` | — |
| Declined — form error | `FORM` | — |
| Rejected — missing card number | `CARD` | — |
| Rejected — invalid installments | `INST` | — |
| Rejected — duplicate payment | `DUPL` | — |
| Rejected — disabled card | `LOCK` | — |
| Rejected — non-permitted card type | `CTNA` | — |
| Rejected — exceeded PIN attempts | `ATTE` | — |
| Rejected — blacklist | `BLAC` | — |
| Not supported | `UNSU` | — |
| Amount-rule testing | `TEST` | — |

## 6. status_detail reference (common values)

| `status` | `status_detail` | Meaning |
|----------|-----------------|---------|
| `approved` | `accredited` | Funds captured. |
| `pending` | `pending_waiting_payment` | PIX/Boleto awaiting payment. |
| `in_process` | `pending_review_manual` | Fraud review. |
| `in_process` | `pending_challenge` | 3DS challenge pending. |
| `rejected` | `cc_rejected_insufficient_amount` | Not enough funds. |
| `rejected` | `cc_rejected_bad_filled_card_number` | Wrong card number. |
| `rejected` | `cc_rejected_bad_filled_security_code` | Wrong CVV. |
| `rejected` | `cc_rejected_call_for_authorize` | Issuer requires authorization. |
| `rejected` | `cc_rejected_high_risk` | Blocked by fraud rules. |
| `rejected` | `rejected_insufficient_data` | Missing required fields. |

Always log `status` + `status_detail` — reviewers and support need it.

## 7. Testing the full flow

1. Set env: `MP_ACCESS_TOKEN=TEST-...`, `MP_PUBLIC_KEY=TEST-...`, `MP_WEBHOOK_SECRET=...`, `MP_ENV=test`.
2. Create a preference/payment. With test creds redirect to `sandbox_init_point`.
3. Log in as the **test buyer** and pay with a test card + `APRO`.
4. Verify your webhook receives the notification, passes signature verification, and fetches `status: approved`.
5. Repeat with `FUND`/`SECU`/`CONT` to exercise decline and pending paths.
6. Use the panel's **Simulate** button (under Webhooks) to send test events to your URL.

## 8. Going to production checklist

- [ ] Swap `TEST-` credentials for `APP_USR-` (Access Token + Public Key).
- [ ] Redirect to `init_point` (not `sandbox_init_point`).
- [ ] Configure the production webhook URL + secret; verify signatures end to end.
- [ ] Confirm `notification_url` is HTTPS and reachable from the internet.
- [ ] Add idempotency keys on every create call.
- [ ] Add a reconciliation job for missed webhooks.
- [ ] Confirm `external_reference` is set on every preference/payment/preapproval.
- [ ] Test at least one real (low-value) transaction, then refund it.
