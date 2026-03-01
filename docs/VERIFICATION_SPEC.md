# BlackRoad Infrastructure Verification Specification

**Version:** 1.0.0
**Status:** Active
**Effective Date:** 2026-03-01
**Owner:** BlackRoad OS
**Repository:** `BlackRoad-OS/operator`

---

## Purpose

This document defines the verification contract for BlackRoad infrastructure claims. Every number published — on dashboards, status pages, marketing materials, or investor reports — must trace back to a measurement defined here.

If a check is not defined in this specification, the result must not be published as a verified claim.

This document is the single source of truth for what is measured, how it is measured, what constitutes a pass, what constitutes a failure, and what is explicitly not claimed.

---

## Scope

This specification governs automated verification of BlackRoad-controlled infrastructure across the following dimensions:

| # | Dimension | What It Proves |
|---|-----------|---------------|
| 1 | Enterprise Reachability | The GitHub Enterprise entity exists and is publicly accessible |
| 2 | Organization Verification | The GitHub Organization is registered, identifiable, and queryable |
| 3 | Domain Resolution | DNS is configured and resolves to an address |
| 4 | HTTPS Availability | The web endpoint serves content over a secure connection |
| 5 | SSL Certificate Validity | The TLS certificate is current and not expired |
| 6 | Repository Activity | The organization is actively maintained, not abandoned |

---

## 1. Enterprise Reachability

### Definition

Confirms that a GitHub Enterprise entity is publicly reachable at its canonical URL.

### Method

```
HTTP GET https://github.com/enterprises/{enterprise_slug}
```

### Pass Criteria

- HTTP response status code is `200`

### Fail Criteria

- HTTP response status code is not `200` (includes `301`, `302`, `403`, `404`, `5xx`)
- Connection timeout (threshold: 10 seconds)
- DNS resolution failure for `github.com`
- Any network-level error (TLS failure, connection refused, etc.)

### Output Schema

```json
{
  "check": "enterprise_reachability",
  "target": "{enterprise_slug}",
  "url": "https://github.com/enterprises/{enterprise_slug}",
  "status": "pass | fail",
  "http_status": 200,
  "latency_ms": 342,
  "timestamp": "2026-03-01T00:00:00Z",
  "error": null
}
```

### What This Does NOT Prove

- Ownership of the enterprise
- Number of members or seats
- Billing status or plan tier
- Administrative access

---

## 2. Organization Verification

### Definition

Confirms that a GitHub Organization exists, is queryable via the public API, and returns a valid organization identifier.

### Method

```
HTTP GET https://api.github.com/orgs/{org_slug}
Accept: application/vnd.github+json
```

### Pass Criteria

- HTTP response status code is `200`
- Response body contains a non-null `id` field (integer)
- Response body contains a `login` field matching `{org_slug}` (case-insensitive)

### Fail Criteria

- HTTP response status code is not `200`
- Response body missing `id` field
- Response body `id` is `null`
- `login` field does not match expected slug
- Connection timeout (threshold: 10 seconds)
- Rate limit exceeded (`403` with `X-RateLimit-Remaining: 0`)

### Output Schema

```json
{
  "check": "organization_verification",
  "target": "{org_slug}",
  "url": "https://api.github.com/orgs/{org_slug}",
  "status": "pass | fail",
  "http_status": 200,
  "org_id": 123456789,
  "org_login": "{org_slug}",
  "latency_ms": 215,
  "timestamp": "2026-03-01T00:00:00Z",
  "error": null
}
```

### What This Does NOT Prove

- Ownership or admin role
- Organization membership count
- Repository count or visibility
- Verification badge status on GitHub

---

## 3. Domain Resolution

### Definition

Confirms that a domain name resolves to at least one IP address via DNS.

### Method

```
DNS lookup of {domain}
Query types: A, AAAA (in parallel)
```

### Pass Criteria

- At least one A or AAAA record is returned
- Resolution completes within 3 seconds

### Fail Criteria

- No A or AAAA records returned
- NXDOMAIN response
- SERVFAIL response
- Resolution exceeds 3-second threshold
- All nameservers unreachable

### Output Schema

```json
{
  "check": "domain_resolution",
  "target": "{domain}",
  "status": "pass | fail",
  "resolved_addresses": ["93.184.216.34"],
  "record_types": ["A"],
  "latency_ms": 48,
  "timestamp": "2026-03-01T00:00:00Z",
  "error": null
}
```

### What This Does NOT Prove

- Domain ownership
- Registrar details or WHOIS accuracy
- That the resolved IP hosts the expected service
- DNS propagation completeness across all resolvers
- DNSSEC validation status

---

## 4. HTTPS Availability

### Definition

Confirms that a domain serves a valid HTTP response over TLS (port 443).

### Method

```
HTTP GET https://{domain}/
Follow redirects: yes (max 5 hops)
```

### Pass Criteria

- Final HTTP response status code is `200`
- Total response time (including redirects) is under 5 seconds

### Fail Criteria

- Final HTTP response status code is not `200`
- Response time exceeds 5 seconds
- TLS handshake failure
- Connection refused on port 443
- DNS resolution failure (cascading from Check 3)
- Redirect loop detected (same URL visited twice)
- Redirect count exceeds 5 hops

### Output Schema

```json
{
  "check": "https_availability",
  "target": "{domain}",
  "url": "https://{domain}/",
  "final_url": "https://{domain}/",
  "status": "pass | fail",
  "http_status": 200,
  "redirect_count": 0,
  "latency_ms": 890,
  "timestamp": "2026-03-01T00:00:00Z",
  "error": null
}
```

### What This Does NOT Prove

- Content correctness or completeness
- That the site is the expected site (no content verification)
- Availability from other geographic regions
- Performance under load

---

## 5. SSL Certificate Validity

### Definition

Confirms that the TLS certificate presented by the server is temporally valid (not expired, not yet active).

### Method

```
TLS connection to {domain}:443
Extract certificate: peer certificate from handshake
Evaluate: notBefore <= now <= notAfter
```

### Pass Criteria

- Certificate `notBefore` date is in the past or equal to current time
- Certificate `notAfter` date is in the future
- Certificate `notAfter` is more than 0 days from current time

### Fail Criteria

- Certificate has expired (`notAfter` < now)
- Certificate is not yet valid (`notBefore` > now)
- No certificate presented
- TLS handshake failure before certificate exchange
- Self-signed certificate (issuer == subject with no chain)

### Output Schema

```json
{
  "check": "ssl_validity",
  "target": "{domain}",
  "status": "pass | fail",
  "issuer": "Let's Encrypt Authority X3",
  "subject": "{domain}",
  "not_before": "2025-12-01T00:00:00Z",
  "not_after": "2026-06-01T00:00:00Z",
  "days_remaining": 92,
  "latency_ms": 120,
  "timestamp": "2026-03-01T00:00:00Z",
  "error": null
}
```

### What This Does NOT Prove

- Certificate authority trustworthiness
- Extended Validation (EV) status
- Certificate Transparency log inclusion
- That the certificate matches the intended domain (SANs not validated beyond basic match)
- OCSP revocation status

---

## 6. Repository Activity

### Definition

Confirms that the organization has at least one public repository with a commit pushed within the last 30 days.

### Method

```
HTTP GET https://api.github.com/orgs/{org_slug}/repos?type=public&sort=pushed&direction=desc&per_page=1
Accept: application/vnd.github+json
```

### Pass Criteria

- HTTP response status code is `200`
- At least one repository is returned
- The `pushed_at` timestamp of the first result is within the last 30 days relative to the check execution time

### Fail Criteria

- HTTP response status code is not `200`
- Empty repository list returned
- Most recent `pushed_at` timestamp is older than 30 days
- Connection timeout (threshold: 10 seconds)
- Rate limit exceeded

### Output Schema

```json
{
  "check": "repository_activity",
  "target": "{org_slug}",
  "status": "pass | fail",
  "most_recent_repo": "operator",
  "pushed_at": "2026-02-28T14:30:00Z",
  "days_since_push": 1,
  "activity_threshold_days": 30,
  "latency_ms": 310,
  "timestamp": "2026-03-01T00:00:00Z",
  "error": null
}
```

### What This Does NOT Prove

- Quality or substance of commits
- Number of contributors
- That activity is human-generated (vs. automated/bot)
- Private repository activity
- Commit frequency or velocity

---

## Aggregate Report Schema

All individual checks roll up into a single verification report. No partial credit. No weighted scores.

```json
{
  "report": {
    "version": "1.0.0",
    "spec_version": "1.0.0",
    "generated_at": "2026-03-01T00:00:00Z",
    "executor": "operator/{version}",
    "targets": {
      "enterprise": "BlackRoad-OS",
      "organization": "BlackRoad-OS",
      "domain": "blackroad.io"
    },
    "results": [
      { "check": "enterprise_reachability", "status": "pass" },
      { "check": "organization_verification", "status": "pass" },
      { "check": "domain_resolution", "status": "pass" },
      { "check": "https_availability", "status": "pass" },
      { "check": "ssl_validity", "status": "pass" },
      { "check": "repository_activity", "status": "pass" }
    ],
    "summary": {
      "total": 6,
      "passed": 6,
      "failed": 0,
      "status": "all_pass"
    }
  }
}
```

### Summary Status Values

| Value | Meaning |
|-------|---------|
| `all_pass` | Every check passed |
| `partial_fail` | At least one check failed |
| `all_fail` | Every check failed |
| `error` | Runner encountered an unrecoverable error before completing all checks |

---

## Execution Rules

### Timing

- Checks run sequentially in the order defined (1 through 6)
- Each check has its own timeout as specified above
- Total execution must complete within 60 seconds
- If total execution exceeds 60 seconds, remaining checks are marked `fail` with error `execution_timeout`

### Idempotency

- All checks are read-only
- No check may create, modify, or delete any resource
- Running the suite twice in succession must produce equivalent results (barring genuine state changes in the target)

### Retry Policy

- No automatic retries within a single execution run
- If a check fails due to a transient error (timeout, rate limit), it is recorded as `fail`
- Retry logic belongs to the scheduler, not the runner

### Authentication

- Checks 1, 3, 4, 5 require no authentication
- Checks 2, 6 use the GitHub public API; unauthenticated requests are subject to rate limits (60 requests/hour per IP)
- Authenticated execution (via `GITHUB_TOKEN`) is permitted to increase rate limits but must not access private data
- No check may use credentials to access private repositories, private org data, or admin endpoints

### Environment

- Checks must be executable from any machine with outbound internet access
- No dependency on internal networks, VPNs, or proprietary services
- Runner must log its own IP address and User-Agent in execution metadata

---

## Governance

### Versioning

- This specification follows Semantic Versioning
- Major version changes (breaking): changes to pass/fail criteria, removal of checks
- Minor version changes: addition of new checks, new output fields
- Patch version changes: clarifications, typo fixes, example updates

### Change Process

1. Proposed changes must be submitted as a pull request to `docs/VERIFICATION_SPEC.md`
2. Changes to pass/fail criteria require review and explicit approval
3. All changes must include a version bump and updated effective date
4. Historical versions are preserved via git history

### Audit Trail

- Every verification run produces a timestamped JSON report
- Reports are immutable once generated
- Reports must be stored with the commit SHA of the spec version used to generate them
- The runner must embed `spec_version` in every report to enable traceability

---

## Explicitly Out of Scope

The following are **not** verified by this specification and must not be implied by any published result:

- Financial solvency or revenue
- Team size or headcount
- Code quality, test coverage, or security posture
- Uptime percentage or SLA compliance
- User count or adoption metrics
- Legal entity status or incorporation
- Compliance with any regulatory framework (SOC 2, ISO 27001, etc.)
- Performance benchmarks
- Third-party integrations or partnerships

Any claim about these topics requires a separate, independently defined verification process.

---

## References

- GitHub REST API: https://docs.github.com/en/rest
- RFC 1035 (DNS): https://datatracker.ietf.org/doc/html/rfc1035
- RFC 8446 (TLS 1.3): https://datatracker.ietf.org/doc/html/rfc8446
- RFC 9110 (HTTP Semantics): https://datatracker.ietf.org/doc/html/rfc9110
- Semantic Versioning 2.0.0: https://semver.org
