/**
 * BlackRoad OS — Control Plane Renderer
 * Config-driven. No frameworks. Edit config, everything updates.
 */

const BR = (() => {
  let config = null;
  let cache = { data: null, timestamp: 0 };
  const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  // ─── Config Loader ───

  async function loadConfig() {
    const now = Date.now();
    if (cache.data && now - cache.timestamp < CACHE_TTL) {
      return cache.data;
    }
    try {
      const res = await fetch("/config/blackroad.json");
      if (!res.ok) throw new Error(`Config load failed: ${res.status}`);
      config = await res.json();
      cache = { data: config, timestamp: now };
      return config;
    } catch (err) {
      console.error("[BR] Config load error:", err);
      throw err;
    }
  }

  // ─── Computed Data ───

  function getCounts(cfg) {
    return {
      orgs: cfg.orgs.length,
      activeOrgs: cfg.orgs.filter(o => o.status === "active").length,
      domains: cfg.domains.length,
      activeDomains: cfg.domains.filter(d => d.status === "active").length,
      roles: Object.keys(cfg.roles).length,
    };
  }

  function getOrgsByRole(cfg) {
    const grouped = {};
    for (const [key, role] of Object.entries(cfg.roles)) {
      grouped[key] = {
        ...role,
        orgs: cfg.orgs.filter(o => o.role === key),
      };
    }
    return grouped;
  }

  // ─── DOM Helpers ───

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === "class") node.className = v;
        else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
        else if (k === "html") node.innerHTML = v;
        else node.setAttribute(k, v);
      }
    }
    for (const child of children) {
      if (typeof child === "string") node.appendChild(document.createTextNode(child));
      else if (child) node.appendChild(child);
    }
    return node;
  }

  function clear(container) {
    container.innerHTML = "";
  }

  function inject(id, node) {
    const target = document.getElementById(id);
    if (target) {
      clear(target);
      if (typeof node === "string") target.innerHTML = node;
      else target.appendChild(node);
    }
  }

  // ─── Stats Renderer ───

  function renderStats(cfg) {
    const counts = getCounts(cfg);
    const container = document.getElementById("stats");
    if (!container) return;

    clear(container);
    const items = [
      { value: counts.orgs, label: "Organizations" },
      { value: counts.domains, label: "Domains" },
      { value: counts.roles, label: "Divisions" },
      { value: counts.activeOrgs, label: "Active Orgs" },
    ];

    for (const item of items) {
      container.appendChild(
        el("div", { class: "stat" },
          el("span", { class: "stat__value" }, String(item.value)),
          el("span", { class: "stat__label" }, item.label)
        )
      );
    }
  }

  // ─── Directory Renderer ───

  function renderDirectory(cfg, filter) {
    const container = document.getElementById("directory");
    if (!container) return;

    const filterBar = document.getElementById("filters");
    if (filterBar) {
      clear(filterBar);
      const allBtn = el("button", {
        class: `filter-btn ${!filter ? "active" : ""}`,
        onclick: () => renderDirectory(cfg, null),
      }, "All");
      filterBar.appendChild(allBtn);

      for (const [key, role] of Object.entries(cfg.roles)) {
        const btn = el("button", {
          class: `filter-btn ${filter === key ? "active" : ""}`,
          onclick: () => renderDirectory(cfg, key),
        }, role.label);
        filterBar.appendChild(btn);
      }
    }

    const orgs = filter ? cfg.orgs.filter(o => o.role === filter) : cfg.orgs;

    clear(container);
    const grid = el("div", { class: "grid" });

    for (const org of orgs) {
      const roleLabel = cfg.roles[org.role]?.label || org.role;
      const card = el("div", { class: "card" },
        el("div", { class: "card__header" },
          el("a", { href: org.url, class: "card__name", target: "_blank" }, org.name),
          el("span", { class: `card__badge card__badge--${org.status}` }, roleLabel)
        ),
        el("div", { class: "card__desc" }, org.description),
        el("div", { class: "card__meta" },
          el("span", { class: "status" },
            el("span", { class: `status__dot status__dot--${org.status}` }),
            org.status
          )
        )
      );
      grid.appendChild(card);
    }

    container.appendChild(grid);
  }

  // ─── Status Renderer ───

  function renderStatus(cfg) {
    const container = document.getElementById("status-orgs");
    if (!container) return;

    clear(container);
    const table = el("table", { class: "table" });
    const thead = el("thead", null,
      el("tr", null,
        el("th", null, "Organization"),
        el("th", null, "Role"),
        el("th", null, "Status"),
        el("th", null, "GitHub")
      )
    );
    table.appendChild(thead);

    const tbody = el("tbody");
    for (const org of cfg.orgs) {
      const row = el("tr", null,
        el("td", null, org.name),
        el("td", { class: "text-muted" }, cfg.roles[org.role]?.label || org.role),
        el("td", null,
          el("span", { class: "status" },
            el("span", { class: `status__dot status__dot--${org.status}` }),
            org.status
          )
        ),
        el("td", null, el("a", { href: org.url, target: "_blank" }, org.id))
      );
      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    container.appendChild(table);

    // Domain status
    const domainContainer = document.getElementById("status-domains");
    if (!domainContainer) return;

    clear(domainContainer);
    const dtable = el("table", { class: "table" });
    const dthead = el("thead", null,
      el("tr", null,
        el("th", null, "Domain"),
        el("th", null, "Purpose"),
        el("th", null, "Status")
      )
    );
    dtable.appendChild(dthead);

    const dtbody = el("tbody");
    for (const d of cfg.domains) {
      const row = el("tr", null,
        el("td", null, d.domain),
        el("td", { class: "text-muted" }, d.purpose),
        el("td", null,
          el("span", { class: "status" },
            el("span", { class: `status__dot status__dot--${d.status}` }),
            d.status
          )
        )
      );
      dtbody.appendChild(row);
    }
    dtable.appendChild(dtbody);
    domainContainer.appendChild(dtable);
  }

  // ─── Map Renderer ───

  function renderOrgMap(cfg) {
    const container = document.getElementById("org-map");
    if (!container) return;

    clear(container);
    const grid = el("div", { class: "map-grid" });
    const grouped = getOrgsByRole(cfg);

    for (const [key, group] of Object.entries(grouped)) {
      const node = el("div", { class: "map-node" },
        el("div", { class: "map-node__label" }, group.label)
      );
      const items = el("div", { class: "map-node__items" });
      for (const org of group.orgs) {
        items.appendChild(
          el("div", { class: "map-node__item" },
            el("a", { href: org.url, target: "_blank" }, org.name),
            el("span", { class: "map-node__item-status" }, org.status)
          )
        );
      }
      node.appendChild(items);
      grid.appendChild(node);
    }
    container.appendChild(grid);
  }

  function renderDomainMap(cfg) {
    const container = document.getElementById("domain-map");
    if (!container) return;

    clear(container);
    const grid = el("div", { class: "map-grid" });

    // Group domains by TLD
    const byTld = {};
    for (const d of cfg.domains) {
      const tld = d.domain.split(".").pop();
      if (!byTld[tld]) byTld[tld] = [];
      byTld[tld].push(d);
    }

    for (const [tld, domains] of Object.entries(byTld)) {
      const node = el("div", { class: "map-node" },
        el("div", { class: "map-node__label" }, `.${tld}`)
      );
      const items = el("div", { class: "map-node__items" });
      for (const d of domains) {
        items.appendChild(
          el("div", { class: "map-node__item" },
            el("span", null, d.domain),
            el("span", { class: "map-node__item-status" }, d.purpose)
          )
        );
      }
      node.appendChild(items);
      grid.appendChild(node);
    }
    container.appendChild(grid);
  }

  // ─── Page Init ───

  async function init(page) {
    try {
      const cfg = await loadConfig();

      // Render header meta
      const nameEl = document.getElementById("site-name");
      if (nameEl) nameEl.textContent = cfg.meta.name;

      const taglineEl = document.getElementById("site-tagline");
      if (taglineEl) taglineEl.textContent = cfg.meta.tagline;

      const versionEl = document.getElementById("site-version");
      if (versionEl) versionEl.textContent = `v${cfg.meta.version}`;

      const updatedEl = document.getElementById("site-updated");
      if (updatedEl) updatedEl.textContent = `Updated ${cfg.meta.updated}`;

      // Render page-specific content
      renderStats(cfg);

      switch (page) {
        case "directory":
          renderDirectory(cfg, null);
          break;
        case "status":
          renderStatus(cfg);
          break;
        case "map":
          renderOrgMap(cfg);
          renderDomainMap(cfg);
          break;
      }
    } catch (err) {
      const main = document.getElementById("main");
      if (main) {
        main.innerHTML = `<div class="loading">Failed to load config. Check console.</div>`;
      }
    }
  }

  // ─── Public API ───

  return { init, loadConfig, getCounts, getOrgsByRole };
})();
