/**
 * BlackRoad OS — Cloudflare Pages Function
 * /functions/api.js → accessible at /api
 *
 * Proxies GitHub API requests to fetch live org/repo data.
 * Caches responses for 10 minutes via Cache-Control headers.
 *
 * Environment variables required:
 *   GITHUB_TOKEN — GitHub personal access token (read:org scope)
 */

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const action = url.searchParams.get("action");

  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=600",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    switch (action) {
      case "orgs":
        return await fetchOrgs(context, headers);
      case "repos":
        return await fetchRepos(context, url, headers);
      default:
        return new Response(
          JSON.stringify({ error: "Unknown action. Use ?action=orgs or ?action=repos&org=<name>" }),
          { status: 400, headers }
        );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers }
    );
  }
}

async function fetchOrgs(context, headers) {
  const token = context.env.GITHUB_TOKEN;
  if (!token) {
    return new Response(
      JSON.stringify({ error: "GITHUB_TOKEN not configured" }),
      { status: 500, headers }
    );
  }

  const res = await fetch("https://api.github.com/orgs/blackroad-os/members", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "BlackRoad-Control-Plane",
    },
  });

  if (!res.ok) {
    return new Response(
      JSON.stringify({ error: `GitHub API error: ${res.status}` }),
      { status: res.status, headers }
    );
  }

  const data = await res.json();
  return new Response(JSON.stringify(data), { headers });
}

async function fetchRepos(context, url, headers) {
  const org = url.searchParams.get("org");
  if (!org) {
    return new Response(
      JSON.stringify({ error: "Missing ?org= parameter" }),
      { status: 400, headers }
    );
  }

  const token = context.env.GITHUB_TOKEN;
  const authHeaders = token
    ? {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "BlackRoad-Control-Plane",
      }
    : {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "BlackRoad-Control-Plane",
      };

  const res = await fetch(
    `https://api.github.com/orgs/${encodeURIComponent(org)}/repos?per_page=100&sort=updated`,
    { headers: authHeaders }
  );

  if (!res.ok) {
    return new Response(
      JSON.stringify({ error: `GitHub API error: ${res.status}` }),
      { status: res.status, headers }
    );
  }

  const repos = await res.json();
  const summary = repos.map((r) => ({
    name: r.name,
    description: r.description,
    url: r.html_url,
    language: r.language,
    stars: r.stargazers_count,
    updated: r.updated_at,
    archived: r.archived,
  }));

  return new Response(JSON.stringify(summary), { headers });
}
