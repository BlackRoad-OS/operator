/**
 * BlackRoad OS — Stripe Webhook Handler
 * /functions/stripe-webhook.js → accessible at /stripe-webhook
 *
 * Receives and verifies Stripe webhook events for:
 *   - checkout.session.completed  → Issue license key
 *   - customer.subscription.updated → Update subscription status
 *   - customer.subscription.deleted → Revoke access
 *   - invoice.payment_failed → Flag failed payment
 *
 * Environment variables required:
 *   STRIPE_SECRET_KEY       — Stripe secret key
 *   STRIPE_WEBHOOK_SECRET   — Webhook endpoint signing secret (whsec_...)
 *   LICENSE_KV              — KV namespace binding for storing license data
 */

const STRIPE_API = "https://api.stripe.com/v1";

/**
 * Verify Stripe webhook signature using the raw body and signing secret.
 * Implements Stripe's v1 signature scheme using Web Crypto API.
 */
async function verifySignature(rawBody, sigHeader, secret) {
  if (!sigHeader || !secret) return false;

  const parts = {};
  for (const item of sigHeader.split(",")) {
    const [key, value] = item.split("=");
    if (key === "t") parts.timestamp = value;
    if (key === "v1" && !parts.signature) parts.signature = value;
  }

  if (!parts.timestamp || !parts.signature) return false;

  // Reject if timestamp is older than 5 minutes
  const age = Math.floor(Date.now() / 1000) - parseInt(parts.timestamp, 10);
  if (age > 300) return false;

  const payload = `${parts.timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  const expected = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expected === parts.signature;
}

/**
 * Generate a license key: BR-<random hex>-<random hex>
 */
function generateLicenseKey() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `BR-${hex.slice(0, 8).toUpperCase()}-${hex.slice(8, 16).toUpperCase()}-${hex.slice(16, 24).toUpperCase()}-${hex.slice(24).toUpperCase()}`;
}

async function stripeGet(endpoint, secretKey) {
  const res = await fetch(`${STRIPE_API}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return res.json();
}

export async function onRequestPost(context) {
  const headers = { "Content-Type": "application/json" };

  const webhookSecret = context.env.STRIPE_WEBHOOK_SECRET;
  const secretKey = context.env.STRIPE_SECRET_KEY;

  if (!webhookSecret || !secretKey) {
    return new Response(
      JSON.stringify({ error: "Webhook not configured" }),
      { status: 500, headers }
    );
  }

  const rawBody = await context.request.text();
  const sigHeader = context.request.headers.get("stripe-signature");

  const valid = await verifySignature(rawBody, sigHeader, webhookSecret);
  if (!valid) {
    return new Response(
      JSON.stringify({ error: "Invalid signature" }),
      { status: 401, headers }
    );
  }

  const event = JSON.parse(rawBody);
  const kv = context.env.LICENSE_KV;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const customerEmail = session.customer_details?.email || session.customer_email;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        const licenseKey = generateLicenseKey();
        const licenseData = {
          key: licenseKey,
          email: customerEmail,
          customerId,
          subscriptionId,
          product: "operator",
          status: "active",
          issuedAt: new Date().toISOString(),
          sessionId: session.id,
          mode: session.mode, // "payment" or "subscription"
        };

        // Store license by key and by customer email for lookup
        if (kv) {
          await kv.put(`license:${licenseKey}`, JSON.stringify(licenseData), {
            expirationTtl: session.mode === "subscription" ? 31536000 : undefined, // 1 year for subs, permanent for one-time
          });
          await kv.put(`customer:${customerEmail}`, JSON.stringify(licenseData));
          if (customerId) {
            await kv.put(`stripe:${customerId}`, JSON.stringify(licenseData));
          }
        }

        console.log(`License issued: ${licenseKey} for ${customerEmail}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        if (kv) {
          const existing = await kv.get(`stripe:${customerId}`, "json");
          if (existing) {
            existing.status = subscription.status === "active" ? "active" : "suspended";
            existing.updatedAt = new Date().toISOString();
            await kv.put(`license:${existing.key}`, JSON.stringify(existing));
            await kv.put(`customer:${existing.email}`, JSON.stringify(existing));
            await kv.put(`stripe:${customerId}`, JSON.stringify(existing));
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        if (kv) {
          const existing = await kv.get(`stripe:${customerId}`, "json");
          if (existing) {
            existing.status = "revoked";
            existing.revokedAt = new Date().toISOString();
            await kv.put(`license:${existing.key}`, JSON.stringify(existing));
            await kv.put(`customer:${existing.email}`, JSON.stringify(existing));
            await kv.put(`stripe:${customerId}`, JSON.stringify(existing));
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        if (kv) {
          const existing = await kv.get(`stripe:${customerId}`, "json");
          if (existing) {
            existing.status = "payment_failed";
            existing.updatedAt = new Date().toISOString();
            await kv.put(`license:${existing.key}`, JSON.stringify(existing));
            await kv.put(`customer:${existing.email}`, JSON.stringify(existing));
            await kv.put(`stripe:${customerId}`, JSON.stringify(existing));
          }
        }
        break;
      }

      default:
        // Unhandled event type — acknowledge receipt
        break;
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers });
  } catch (err) {
    console.error(`Webhook error: ${err.message}`);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers }
    );
  }
}
