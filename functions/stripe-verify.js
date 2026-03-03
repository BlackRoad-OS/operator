/**
 * BlackRoad OS — License Verification Endpoint
 * /functions/stripe-verify.js → accessible at /stripe-verify
 *
 * Verifies a license key or customer email against the license store.
 * Used by the Operator CLI and web app to gate access to paid features.
 *
 * Environment variables required:
 *   LICENSE_KV — KV namespace binding for license data
 *
 * Query parameters:
 *   key   — License key (BR-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX)
 *   email — Customer email (alternative lookup)
 */

export async function onRequestGet(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": context.env.SITE_URL || "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  const kv = context.env.LICENSE_KV;
  if (!kv) {
    return new Response(
      JSON.stringify({ valid: false, error: "License system not configured" }),
      { status: 500, headers: corsHeaders }
    );
  }

  const url = new URL(context.request.url);
  const licenseKey = url.searchParams.get("key");
  const email = url.searchParams.get("email");

  // Also support Authorization header: Bearer <license-key>
  const authHeader = context.request.headers.get("Authorization");
  const bearerKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const lookupKey = licenseKey || bearerKey;

  if (!lookupKey && !email) {
    return new Response(
      JSON.stringify({ valid: false, error: "Provide ?key= or ?email= or Authorization: Bearer <key>" }),
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    let licenseData = null;

    if (lookupKey) {
      licenseData = await kv.get(`license:${lookupKey}`, "json");
    } else if (email) {
      licenseData = await kv.get(`customer:${email}`, "json");
    }

    if (!licenseData) {
      return new Response(
        JSON.stringify({ valid: false, error: "License not found" }),
        { status: 404, headers: corsHeaders }
      );
    }

    const isActive = licenseData.status === "active";

    return new Response(
      JSON.stringify({
        valid: isActive,
        status: licenseData.status,
        product: licenseData.product,
        email: licenseData.email,
        mode: licenseData.mode,
        issuedAt: licenseData.issuedAt,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ valid: false, error: "Verification failed" }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": context.env.SITE_URL || "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
