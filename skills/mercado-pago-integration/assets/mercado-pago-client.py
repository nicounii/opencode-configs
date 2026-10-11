"""
Mercado Pago — Python client wrapper.

Requires: pip install mercadopago
Env:      MP_ACCESS_TOKEN (TEST-... or APP_USR-...)
          MP_PUBLIC_KEY      (frontend only)
          MP_WEBHOOK_SECRET  (signature verification)
          MP_ENV             ("test" | "production")

Amounts are DECIMAL currency (24.5 == R$24.50). Never pass cents.
"""
import os
from typing import Any, Optional

import mercadopago

_ACCESS_TOKEN = os.environ["MP_ACCESS_TOKEN"]
sdk = mercadopago.SDK(_ACCESS_TOKEN)

_IS_TEST = os.environ.get("MP_ENV") != "production"


def _webhook_url(url: str) -> str:
    sep = "&" if "?" in url else "?"
    return f"{url}{sep}source_news=webhooks"


def create_checkout(
    *,
    items: list[dict[str, Any]],
    external_reference: str,
    success_url: str,
    notification_url: str,
    payer_email: Optional[str] = None,
    pending_url: Optional[str] = None,
    failure_url: Optional[str] = None,
) -> dict[str, Any]:
    """Create a Checkout Pro preference and return the redirect URL.

    items: [{"id", "title", "quantity", "unit_price"(decimal), "currency_id"?}]
    """
    payload: dict[str, Any] = {
        "items": [
            {
                "id": it["id"],
                "title": it["title"],
                "quantity": it["quantity"],
                "unit_price": it["unit_price"],
                "currency_id": it.get("currency_id", "BRL"),
            }
            for it in items
        ],
        "external_reference": external_reference,
        "back_urls": {
            "success": success_url,
            "pending": pending_url or success_url,
            "failure": failure_url or success_url,
        },
        "auto_return": "approved",
        "notification_url": _webhook_url(notification_url),
    }
    if payer_email:
        payload["payer"] = {"email": payer_email}

    pref = sdk.preference().create(payload)["response"]
    return {
        "preference_id": pref["id"],
        "checkout_url": pref["sandbox_init_point"] if _IS_TEST else pref["init_point"],
    }


def create_card_payment(
    *,
    amount: float,
    card_token: str,
    payment_method_id: str,
    description: str,
    external_reference: str,
    payer_email: str,
    identification: dict[str, str],
    installments: int = 1,
    idempotency_key: Optional[str] = None,
) -> dict[str, Any]:
    """Create a transparent card payment from a browser-generated token."""
    opts = mercadopago.config.RequestOptions()
    opts.custom_headers = {"x-idempotency-key": idempotency_key or external_reference}

    result = sdk.payment().create(
        {
            "transaction_amount": amount,
            "token": card_token,
            "description": description,
            "installments": installments,
            "payment_method_id": payment_method_id,
            "external_reference": external_reference,
            "payer": {"email": payer_email, "identification": identification},
        },
        opts,
    )
    return result["response"]


def create_pix_payment(
    *,
    amount: float,
    description: str,
    external_reference: str,
    payer_email: str,
    identification: dict[str, str],
) -> dict[str, Any]:
    """Create a PIX payment and return the QR payload."""
    opts = mercadopago.config.RequestOptions()
    opts.custom_headers = {"x-idempotency-key": external_reference}

    payment = sdk.payment().create(
        {
            "transaction_amount": amount,
            "description": description,
            "payment_method_id": "pix",
            "external_reference": external_reference,
            "payer": {"email": payer_email, "identification": identification},
        },
        opts,
    )["response"]

    tx = (payment.get("point_of_interaction") or {}).get("transaction_data", {}) or {}
    return {
        "payment_id": payment.get("id"),
        "status": payment.get("status"),
        "qr_code": tx.get("qr_code"),
        "qr_code_base64": tx.get("qr_code_base64"),
        "ticket_url": tx.get("ticket_url"),
    }


def get_payment(payment_id: str | int) -> dict[str, Any]:
    """Fetch a payment by id (use after a webhook — never trust the payload alone)."""
    return sdk.payment().get(payment_id)["response"]


def create_subscription(
    *,
    reason: str,
    external_reference: str,
    payer_email: str,
    card_token: str,
    amount: float,
    frequency: int,
    frequency_type: str,  # "days" | "months"
    start_date: str,
    back_url: str,
    end_date: Optional[str] = None,
    currency_id: str = "BRL",
) -> dict[str, Any]:
    """Create a subscription (preapproval). Persist the returned id immediately."""
    auto_recurring: dict[str, Any] = {
        "frequency": frequency,
        "frequency_type": frequency_type,
        "transaction_amount": amount,
        "currency_id": currency_id,
        "start_date": start_date,
    }
    if end_date:
        auto_recurring["end_date"] = end_date

    return sdk.preapproval().create(
        {
            "reason": reason,
            "external_reference": external_reference,
            "payer_email": payer_email,
            "card_token_id": card_token,
            "back_url": back_url,
            "status": "authorized",
            "auto_recurring": auto_recurring,
        }
    )["response"]


def cancel_subscription(preapproval_id: str) -> dict[str, Any]:
    """Cancel a subscription. Call when the user cancels in your app."""
    return sdk.preapproval().update(preapproval_id, {"status": "cancelled"})["response"]


def refund_payment(payment_id: str | int, amount: Optional[float] = None) -> dict[str, Any]:
    """Full or partial refund."""
    if amount is None:
        return sdk.refund().create(payment_id)["response"]
    return sdk.refund().create(payment_id, {"amount": amount})["response"]


def find_payment_by_external_ref(external_reference: str) -> dict[str, Any]:
    """Search payments by your external_reference (reconciliation)."""
    return sdk.payment().search({"external_reference": external_reference})["response"]


def find_subscription_by_external_ref(external_reference: str) -> dict[str, Any]:
    return sdk.preapproval().search({"external_reference": external_reference})["response"]


def list_payment_methods() -> Any:
    """List available payment methods for this seller's account/country."""
    return sdk.payment_methods().list_all()
