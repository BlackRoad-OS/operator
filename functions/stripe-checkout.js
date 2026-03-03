/**
 * BlackRoad OS — Stripe Checkout Session
 * /functions/stripe-checkout.js → accessible at /stripe-checkout
 *
 * Creates a Stripe Checkout session for Operator licenses.
 * Supports one-time license purchases and recurring subscriptions.
 *
 * Environment variables required:
 *   STRIPE_SECRET_KEY   — Stripe secret key (sk_live_... or sk_test_...)
 *   STRIPE_PRICE_ID     — Stripe Price ID for the Operator license
 *   SITE_URL            — Base URL of the site (e.g. https://operator.blackroad.io)
 */

const STRIPE_API = "https://api.stripe.com/v1";

async function stripeRequest(endpoint, params, secretKey) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      body.append(key, String(value));
    }
  }

  const res = await fetch(`${STRIPE_API}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `Stripe API error: ${res.status}`);
  }
  return data;
}

export async function onRequestPost(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": context.env.SITE_URL || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  const secretKey = context.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return new Response(
      JSON.stringify({ error: "Stripe is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const priceId = context.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return new Response(
      JSON.stringify({ error: "No price configured" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const siteUrl = context.env.SITE_URL || "https://operator.blackroad.io";

  let requestBody = {};
  try {
    requestBody = await context.request.json();
  } catch {
    // Allow empty body — defaults will be used
  }

  const email = requestBody.email || undefined;
  const mode = requestBody.mode || "payment"; // "payment" for one-time, "subscription" for recurring

  try {
    const sessionParams = {
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      mode,
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/?canceled=true`,
    };

    if (email) {
      sessionParams.customer_email = email;
    }

    // For subscriptions, allow customer portal management
    if (mode === "subscription") {
      sessionParams["subscription_data[metadata][product]"] = "operator";
      sessionParams["subscription_data[metadata][version]"] = "1.0";
    }

    // For one-time payments, attach license metadata
    if (mode === "payment") {
      sessionParams["payment_intent_data[metadata][product]"] = "operator";
      sessionParams["payment_intent_data[metadata][license_type]"] = "perpetual";
    }

    const session = await stripeRequest(
      "/checkout/sessions",
      sessionParams,
      secretKey
    );

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}

// Handle CORS preflight
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": context.env.SITE_URL || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
