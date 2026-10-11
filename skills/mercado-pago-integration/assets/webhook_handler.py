"""
Mercado Pago webhook handler — FastAPI.

Install: pip install fastapi mercadopago httpx
Env:     MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET

Behavior: verify signature -> ack 200 fast -> fetch the real resource -> act on
confirmed status -> dedupe so retries are idempotent.
"""
import os

import httpx
from fastapi import FastAPI, Request, Response
from mercadopago.webhook import InvalidWebhookSignatureError, WebhookSignatureValidator

app = FastAPI()

MP_API = "https://api.mercadopago.com"

# --- Plug your own persistence here -----------------------------------------
_processed: set[str] = set()  # swap for a DB / Redis in production
_fulfilled: set[str] = set()


async def already_processed(resource_id: str) -> bool:
    return resource_id in _processed


async def mark_processed(resource_id: str) -> None:
    _processed.add(resource_id)


async def fulfill(external_reference: str | None, payment: dict) -> None:
    # TODO: mark order paid, grant access, send receipt, etc. Must be idempotent.
    if external_reference in _fulfilled:
        return
    _fulfilled.add(external_reference or "")
    print("fulfill", external_reference, payment.get("status"))
# ---------------------------------------------------------------------------


async def fetch_payment(payment_id: str) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"{MP_API}/v1/payments/{payment_id}",
            headers={"Authorization": f"Bearer {os.environ['MP_ACCESS_TOKEN']}"},
        )
        r.raise_for_status()
        return r.json()


@app.post("/api/mp/webhook")
async def webhook(request: Request) -> Response:
    # 1. Verify signature
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

    # NOTE: for a real workload, enqueue the processing job here and return
    # immediately. Inline processing is fine only for low-volume handlers.
    try:
        if body.get("type") == "payment":
            resource_id = str(body.get("data", {}).get("id", ""))
            if resource_id and not await already_processed(resource_id):
                payment = await fetch_payment(resource_id)
                if payment.get("status") == "approved":
                    await fulfill(payment.get("external_reference"), payment)
                await mark_processed(resource_id)
    except Exception as exc:  # never fail the ack after validation
        print("webhook processing failed:", exc)

    return Response(status_code=200)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
