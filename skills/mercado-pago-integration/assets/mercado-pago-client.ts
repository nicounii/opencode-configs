/**
 * Mercado Pago — typed Node/TypeScript client wrapper.
 *
 * Requires: npm install mercadopago
 * Env:      MP_ACCESS_TOKEN (TEST-... or APP_USR-...)
 *           MP_PUBLIC_KEY      (frontend only — do NOT use server-side)
 *           MP_WEBHOOK_SECRET  (for signature verification)
 *           MP_ENV             ("test" | "production")
 *
 * Amounts are DECIMAL currency (24.5 === R$24.50). Never pass cents.
 */
import {
  MercadoPagoConfig,
  Preference,
  Payment,
  PaymentRefund,
  PreApproval,
  PreApprovalPlan,
} from 'mercadopago';

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
  options: { timeout: 8000 },
});

const preference = new Preference(mpClient);
const payment = new Payment(mpClient);
const refund = new PaymentRefund(mpClient);
const preApproval = new PreApproval(mpClient);
const preApprovalPlan = new PreApprovalPlan(mpClient);

const isTest = process.env.MP_ENV !== 'production';

export interface CheckoutItem {
  id: string;
  title: string;
  quantity: number;
  unitPrice: number; // DECIMAL, e.g. 24.5
  currencyId?: string; // default "BRL"
}

export interface CreateCheckoutInput {
  items: CheckoutItem[];
  externalReference: string;
  payerEmail?: string;
  successUrl: string;
  pendingUrl?: string;
  failureUrl?: string;
  notificationUrl: string;
}

/** Create a Checkout Pro preference and return the URL to redirect the buyer to. */
export async function createCheckout(input: CreateCheckoutInput) {
  const result = await preference.create({
    body: {
      items: input.items.map((i) => ({
        id: i.id,
        title: i.title,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        currency_id: i.currencyId ?? 'BRL',
      })),
      external_reference: input.externalReference,
      payer: input.payerEmail ? { email: input.payerEmail } : undefined,
      back_urls: {
        success: input.successUrl,
        pending: input.pendingUrl ?? input.successUrl,
        failure: input.failureUrl ?? input.successUrl,
      },
      auto_return: 'approved',
      notification_url: withWebhookSource(input.notificationUrl),
    },
  });

  return {
    preferenceId: result.id!,
    checkoutUrl: (isTest ? result.sandbox_init_point : result.init_point)!,
  };
}

export interface CreateCardPaymentInput {
  amount: number; // DECIMAL
  cardToken: string;
  paymentMethodId: string;
  installments?: number;
  description: string;
  externalReference: string;
  payerEmail: string;
  identification: { type: string; number: string };
  idempotencyKey?: string;
}

/** Create a transparent card payment from a browser-generated token. */
export async function createCardPayment(input: CreateCardPaymentInput) {
  return payment.create({
    body: {
      transaction_amount: input.amount,
      token: input.cardToken,
      description: input.description,
      installments: input.installments ?? 1,
      payment_method_id: input.paymentMethodId,
      external_reference: input.externalReference,
      payer: { email: input.payerEmail, identification: input.identification },
    },
    requestOptions: { idempotencyKey: input.idempotencyKey ?? input.externalReference },
  });
}

/** Create a PIX payment and return the QR payload. */
export async function createPixPayment(input: {
  amount: number;
  description: string;
  externalReference: string;
  payerEmail: string;
  identification: { type: string; number: string };
}) {
  const result = await payment.create({
    body: {
      transaction_amount: input.amount,
      description: input.description,
      payment_method_id: 'pix',
      external_reference: input.externalReference,
      payer: { email: input.payerEmail, identification: input.identification },
    },
    requestOptions: { idempotencyKey: input.externalReference },
  });

  const data = result.point_of_interaction?.transaction_data;
  return {
    paymentId: result.id,
    status: result.status,
    qrCode: data?.qr_code,
    qrCodeBase64: data?.qr_code_base64,
    ticketUrl: data?.ticket_url,
  };
}

/** Fetch a payment by id (use this after a webhook — never trust the payload alone). */
export async function getPayment(id: string | number) {
  return payment.get({ id: String(id) });
}

export interface CreateSubscriptionInput {
  reason: string;
  externalReference: string;
  payerEmail: string;
  cardToken: string;
  amount: number; // DECIMAL per cycle
  frequency: number; // e.g. 1
  frequencyType: 'days' | 'months';
  startDate: string; // ISO 8601 with offset
  endDate?: string;
  backUrl: string;
  currencyId?: string;
}

/** Create a subscription (preapproval). Persist the returned id immediately. */
export async function createSubscription(input: CreateSubscriptionInput) {
  return preApproval.create({
    body: {
      reason: input.reason,
      external_reference: input.externalReference,
      payer_email: input.payerEmail,
      card_token_id: input.cardToken,
      back_url: input.backUrl,
      status: 'authorized',
      auto_recurring: {
        frequency: input.frequency,
        frequency_type: input.frequencyType,
        transaction_amount: input.amount,
        currency_id: input.currencyId ?? 'BRL',
        start_date: input.startDate,
        end_date: input.endDate,
      },
    },
  });
}

/** Cancel a subscription. Call this when the user cancels in your app. */
export async function cancelSubscription(preapprovalId: string) {
  return preApproval.update({ id: preapprovalId, body: { status: 'cancelled' } });
}

/** Full or partial refund. */
export async function refundPayment(paymentId: string | number, amount?: number) {
  return refund.create({ payment_id: Number(paymentId), body: amount ? { amount } : undefined });
}

/** Search payments by your external_reference (reconciliation). */
export async function findPaymentByExternalRef(externalReference: string) {
  return payment.search({ options: { external_reference: externalReference } });
}

export async function findSubscriptionByExternalRef(externalReference: string) {
  return preApproval.search({ options: { external_reference: externalReference } });
}

/** List available payment methods for this seller's account/country. */
export async function listPaymentMethods() {
  const res = await fetch('https://api.mercadopago.com/v1/payment_methods', {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`payment_methods failed: ${res.status}`);
  return res.json();
}

export { preApprovalPlan };

function withWebhookSource(url: string) {
  const u = new URL(url);
  u.searchParams.set('source_news', 'webhooks');
  return u.toString();
}
