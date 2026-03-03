/**
 * BlackRoad OS — License Verification Module
 * Used by the Operator CLI to verify license keys before running paid features.
 *
 * Checks license validity against the BlackRoad license API.
 * Falls back to offline validation of license key format when no network.
 */

export interface LicenseInfo {
  valid: boolean;
  status: "active" | "suspended" | "revoked" | "payment_failed" | "unknown";
  product: string;
  email?: string;
  mode?: "payment" | "subscription";
  issuedAt?: string;
  error?: string;
}

const LICENSE_KEY_PATTERN = /^BR-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}$/;

/**
 * Validate license key format offline (no network required).
 * This only checks the format — not whether it's actually issued.
 */
export function isValidKeyFormat(key: string): boolean {
  return LICENSE_KEY_PATTERN.test(key);
}

/**
 * Verify a license key against the BlackRoad license API.
 * Returns license status and metadata.
 *
 * @param key - License key (BR-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX)
 * @param apiUrl - Base URL of the license API (defaults to operator.blackroad.io)
 */
export async function verifyLicense(
  key: string,
  apiUrl = "https://operator.blackroad.io"
): Promise<LicenseInfo> {
  if (!isValidKeyFormat(key)) {
    return {
      valid: false,
      status: "unknown",
      product: "operator",
      error: "Invalid license key format",
    };
  }

  try {
    const res = await fetch(`${apiUrl}/stripe-verify?key=${encodeURIComponent(key)}`, {
      headers: { "User-Agent": "BlackRoad-Operator-CLI/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        valid: false,
        status: "unknown",
        product: "operator",
        error: (body as any).error || `HTTP ${res.status}`,
      };
    }

    return (await res.json()) as LicenseInfo;
  } catch (err) {
    // Network failure — allow offline-first usage with valid key format
    return {
      valid: true,
      status: "active",
      product: "operator",
      error: "Offline verification — key format valid, full check skipped",
    };
  }
}

/**
 * Load license key from environment or .operator/license file.
 */
export function loadLicenseKey(): string | null {
  // Check environment variable first
  const envKey = process.env.OPERATOR_LICENSE_KEY;
  if (envKey && isValidKeyFormat(envKey)) return envKey;

  // Check license file
  try {
    const { readFileSync, existsSync } = require("node:fs");
    const { resolve, join } = require("node:path");
    const dataDir = resolve(process.env.OPERATOR_DATA_DIR || ".operator");
    const licensePath = join(dataDir, "license");
    if (existsSync(licensePath)) {
      const key = readFileSync(licensePath, "utf-8").trim();
      if (isValidKeyFormat(key)) return key;
    }
  } catch {
    // Silently fail — no license file
  }

  return null;
}

/**
 * Gate a feature behind license verification.
 * Throws if the license is invalid or missing.
 */
export async function requireLicense(apiUrl?: string): Promise<LicenseInfo> {
  const key = loadLicenseKey();
  if (!key) {
    throw new Error(
      "No license key found. Set OPERATOR_LICENSE_KEY or place your key in .operator/license\n" +
        "Purchase a license at https://operator.blackroad.io"
    );
  }

  const info = await verifyLicense(key, apiUrl);
  if (!info.valid) {
    throw new Error(
      `License invalid: ${info.error || info.status}\n` +
        "Renew or purchase at https://operator.blackroad.io"
    );
  }

  return info;
}
