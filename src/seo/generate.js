/**
 * SEO Generator — creates cross-repo linking, structured data, and sitemap
 * that treats the BlackRoad ecosystem as a connected universe, not isolated repos.
 *
 * Philosophy: Google indexes repos as disconnected pages.
 * We link them as a directed graph — every repo knows its neighbors, upstream,
 * and downstream dependencies. Crawlers see a connected knowledge graph.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const DATA_PATH = "data/latest.json";
const SEO_DIR = "data/seo";

/**
 * Build the repo relationship graph.
 * Maps how repos connect to each other based on topics, language overlap, and naming.
 */
function buildRepoGraph(repos) {
  const graph = {};

  const repoList = Object.entries(repos)
    .filter(([, r]) => r.success && r.data)
    .map(([name, r]) => ({ name, ...r.data }));

  for (const repo of repoList) {
    graph[repo.full_name] = {
      links: [],
      role: categorizeRole(repo),
    };

    // Cross-link to every other repo in the ecosystem
    for (const other of repoList) {
      if (other.full_name === repo.full_name) continue;
      const relationship = detectRelationship(repo, other);
      if (relationship) {
        graph[repo.full_name].links.push({
          target: other.full_name,
          relationship,
          url: other.html_url,
        });
      }
    }
  }

  return graph;
}

function categorizeRole(repo) {
  const name = repo.name.toLowerCase();
  if (name === "blackroad") return "monorepo";
  if (name.includes("core")) return "core";
  if (name.includes("api")) return "api";
  if (name.includes("web")) return "web";
  if (name.includes("prism") || name.includes("console")) return "console";
  if (name.includes("docs")) return "documentation";
  if (name.includes("infra")) return "infrastructure";
  return "service";
}

function detectRelationship(a, b) {
  const aName = a.name.toLowerCase();
  const bName = b.name.toLowerCase();

  // Core depends on monorepo
  if (categorizeRole(b) === "monorepo") return "extends";
  // API and Web connect to core
  if (categorizeRole(a) === "api" && categorizeRole(b) === "core") return "powers";
  if (categorizeRole(a) === "web" && categorizeRole(b) === "api") return "consumes";
  if (categorizeRole(a) === "console" && categorizeRole(b) === "web") return "renders";

  // Shared language = potential dependency
  if (a.language && b.language && a.language === b.language) return "sibling";

  // Shared topics
  const sharedTopics = (a.topics || []).filter((t) => (b.topics || []).includes(t));
  if (sharedTopics.length > 0) return "related";

  return "ecosystem";
}

/**
 * Generate JSON-LD structured data for the ecosystem.
 */
function generateStructuredData(repos) {
  const repoList = Object.entries(repos)
    .filter(([, r]) => r.success && r.data)
    .map(([, r]) => r.data);

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: "BlackRoad OS Ecosystem",
    description:
      "Enterprise AI infrastructure platform — governed AI with PS-SHA-infinity identity, Lucidia orchestration, and RoadChain audit.",
    codeRepository: repoList.map((r) => r.html_url),
    programmingLanguage: [...new Set(repoList.map((r) => r.language).filter(Boolean))],
    hasPart: repoList.map((r) => ({
      "@type": "SoftwareSourceCode",
      name: r.name,
      description: r.description,
      codeRepository: r.html_url,
      programmingLanguage: r.language,
      dateModified: r.updated_at,
      dateCreated: r.created_at,
    })),
  };
}

/**
 * Generate a cross-linking index that describes the full ecosystem topology.
 */
function generateEcosystemIndex(repos, graph) {
  const repoList = Object.entries(repos)
    .filter(([, r]) => r.success && r.data)
    .map(([name, r]) => ({
      name,
      ...r.data,
      role: graph[name]?.role || "unknown",
      connections: graph[name]?.links?.length || 0,
    }));

  return {
    generated_at: new Date().toISOString(),
    total_repos_scraped: repoList.length,
    topology: repoList.map((r) => ({
      repo: r.full_name,
      role: r.role,
      url: r.html_url,
      language: r.language,
      connections: graph[r.full_name]?.links || [],
    })),
    languages: [...new Set(repoList.map((r) => r.language).filter(Boolean))],
    total_issues: repoList.reduce((sum, r) => sum + (r.open_issues || 0), 0),
    total_size_kb: repoList.reduce((sum, r) => sum + (r.size_kb || 0), 0),
  };
}

export function generateSEO() {
  if (!existsSync(DATA_PATH)) {
    throw new Error("No data file. Run scraper first.");
  }

  const raw = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  mkdirSync(SEO_DIR, { recursive: true });

  const graph = buildRepoGraph(raw.repos);
  const structuredData = generateStructuredData(raw.repos);
  const ecosystemIndex = generateEcosystemIndex(raw.repos, graph);

  writeFileSync(`${SEO_DIR}/graph.json`, JSON.stringify(graph, null, 2));
  writeFileSync(`${SEO_DIR}/structured-data.json`, JSON.stringify(structuredData, null, 2));
  writeFileSync(`${SEO_DIR}/ecosystem-index.json`, JSON.stringify(ecosystemIndex, null, 2));

  return { graph, structuredData, ecosystemIndex };
}

// CLI entry point
if (process.argv[1]?.endsWith("generate.js")) {
  try {
    const result = generateSEO();
    console.log("[seo] Generated artifacts:");
    console.log(`  graph.json: ${Object.keys(result.graph).length} repos mapped`);
    console.log(`  structured-data.json: schema.org ready`);
    console.log(`  ecosystem-index.json: ${result.ecosystemIndex.total_repos_scraped} repos indexed`);
  } catch (err) {
    console.error("[seo] Error:", err.message);
    process.exit(1);
  }
}
