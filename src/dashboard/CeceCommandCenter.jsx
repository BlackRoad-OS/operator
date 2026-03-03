import { useState, useEffect } from "react";

// Inject Google Fonts
if (typeof document !== "undefined") {
  const id = "blackroad-fonts";
  if (!document.getElementById(id)) {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@600;700&display=swap";
    document.head.appendChild(link);
  }
}

const DOMAIN_DATA = [
  { name: "blackroad.io", tag: "CORE", desc: "Main OS & Experience Layer", subs: ["app.blackroad.io","api.blackroad.io","console.blackroad.io","docs.blackroad.io","status.blackroad.io","agents.blackroad.io","ws.blackroad.io"] },
  { name: "blackroad.systems", tag: "CORE", desc: "Infra & Ops Control Plane", subs: ["prism.blackroad.systems","infra.blackroad.systems","db.blackroad.systems","cache.blackroad.systems","vectors.blackroad.systems","events.blackroad.systems"] },
  { name: "blackroad.network", tag: "CORE", desc: "Agent & Device Mesh Layer", subs: ["mesh.blackroad.network","agents.blackroad.network","pi.mesh.blackroad.network","edge.blackroad.network"] },
  { name: "blackroadinc.us", tag: "CORE", desc: "Legal & Corporate Entity", subs: ["investor.blackroadinc.us","board.blackroadinc.us","legal.blackroadinc.us"] },
  { name: "blackroad.me", tag: "CORE", desc: "Founder Personal Hub", subs: ["my.blackroad.me","agents.blackroad.me"] },
  { name: "blackroad.company", tag: "CORE", desc: "Public Corporate Site", subs: ["press.blackroad.company","team.blackroad.company"] },
  { name: "lucidia.earth", tag: "PRODUCT", desc: "Lucidia AI Platform", subs: ["app.lucidia.earth","api.lucidia.earth","agents.lucidia.earth","memories.lucidia.earth"] },
  { name: "lucidia.studio", tag: "PRODUCT", desc: "Creator Tools & Unity Homes", subs: ["create.lucidia.studio","homes.lucidia.studio","gallery.lucidia.studio"] },
  { name: "blackroadai.com", tag: "PRODUCT", desc: "AI Services & Enterprise", subs: ["enterprise.blackroadai.com","models.blackroadai.com","api.blackroadai.com"] },
  { name: "roadchain.io", tag: "PRODUCT", desc: "Blockchain Ledger Protocol", subs: ["explorer.roadchain.io","api.roadchain.io","validator.roadchain.io"] },
  { name: "roadcoin.io", tag: "PRODUCT", desc: "Token & Economic Layer", subs: ["wallet.roadcoin.io","swap.roadcoin.io","stake.roadcoin.io"] },
  { name: "blackboxprogramming.io", tag: "PRODUCT", desc: "Developer & Creator Brand", subs: ["docs.blackboxprogramming.io"] },
  { name: "blackroadquantum.com", tag: "QUANTUM", desc: "Quantum Research Hub", subs: ["research.blackroadquantum.com","lab.blackroadquantum.com"] },
  { name: "blackroadquantum.info", tag: "QUANTUM", desc: "Quantum Education Portal", subs: ["learn.blackroadquantum.info","courses.blackroadquantum.info"] },
  { name: "blackroadquantum.net", tag: "QUANTUM", desc: "Quantum Network Infra", subs: ["api.blackroadquantum.net"] },
  { name: "blackroadqi.com", tag: "QUANTUM", desc: "QI & PS-SHA Infinity Identity", subs: ["playground.blackroadqi.com","docs.blackroadqi.com"] },
  { name: "aliceqi.com", tag: "AGENT", desc: "Alice Agent Identity", subs: ["chat.aliceqi.com","memory.aliceqi.com","home.aliceqi.com"] },
  { name: "lucidiaqi.com", tag: "AGENT", desc: "Lucidia + QI Hybrid", subs: ["app.lucidiaqi.com"] },
  { name: "blackroadquantum.shop", tag: "COMMERCE", desc: "Merch & Products", subs: [] },
];

const WORKER_CATS = {
  control: ["blackroad-operator-proxy","blackroad-subdomain-router","blackroad-api-gateway","command-center","blackroad-operator"],
  agent: ["alice","aria","anastasia","alexandria","cecilia","cordelia","gematria","octavia","olympia","silas","lucidia","cadence","eve"],
  ai: ["blackroad-claude-proxy","blackroad-chatgpt-proxy","blackroad-gemini-proxy","blackroad-grok-proxy","blackroad-ollama-gateway"],
  service: ["blackroad-auth","blackroad-billing","blackroad-agents","blackroad-memory","blackroad-search","blackroad-metrics","blackroad-tasks","blackroad-notifications","blackroad-projects","blackroad-events","blackroad-files","blackroad-cache","blackroad-realtime","blackroad-email"],
};

function buildEdgeFleet() {
  const fleet = [];
  [["br-edge",1,30],["br-node",1,25],["br-service",1,20],["br-ultra",1,20],["br-quantum",1,25],["br-stellar",1,20],["br-cosmos",1,20]].forEach(([p,s,e]) => {
    for (let i = s; i <= e; i++) fleet.push(`${p}-${i}`);
  });
  return fleet;
}

const ALL_WORKERS = [
  ...WORKER_CATS.control.map(n => ({ name: n, cat: "control" })),
  ...WORKER_CATS.agent.map(n => ({ name: n, cat: "agent" })),
  ...WORKER_CATS.ai.map(n => ({ name: n, cat: "ai" })),
  ...WORKER_CATS.service.map(n => ({ name: n, cat: "service" })),
  ...buildEdgeFleet().map(n => ({ name: n, cat: "edge" })),
];

const ORG_TIERS = [
  { tier: 0, label: "TIER 0 · ENTERPRISE", orgs: [{ name: "blackroad-os", desc: "Enterprise identity root", repos: null }] },
  { tier: 1, label: "TIER 1 · CORE", orgs: [{ name: "BlackRoad-OS-Inc", desc: "Data layer — queries everything", repos: "100+" },{ name: "BlackRoad-OS", desc: "Coordinator — 14 sub-orgs", repos: "30+" }] },
  { tier: 2, label: "TIER 2 · SUB-ORGS", orgs: [
    { name: "BlackRoad-Studio", desc: "Creator tools", repos: 8 },
    { name: "BlackRoad-Archive", desc: "Historical repos", repos: 11 },
    { name: "BlackRoad-Interactive", desc: "Games & XR", repos: 6 },
    { name: "BlackRoad-Security", desc: "Auth & compliance", repos: 5 },
    { name: "BlackRoad-Gov", desc: "Governance protocol", repos: 7 },
    { name: "BlackRoad-Education", desc: "RoadWork & learning", repos: 9 },
    { name: "BlackRoad-Hardware", desc: "Pi mesh & edge", repos: 6 },
    { name: "BlackRoad-Media", desc: "RoadTube & content", repos: 13 },
    { name: "BlackRoad-Foundation", desc: "Core OS primitives", repos: 10 },
    { name: "BlackRoad-Ventures", desc: "Portfolio", repos: 3 },
    { name: "BlackRoad-Cloud", desc: "Cloudflare & infra", repos: 8 },
    { name: "BlackRoad-Labs", desc: "Research & experiments", repos: 10 },
    { name: "BlackRoad-AI", desc: "Models & agents", repos: 9 },
    { name: "Blackbox-Enterprises", desc: "Dev brand", repos: 5 },
  ]},
];

function Counter({ to, suffix = "" }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const dur = 900, start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to]);
  return <>{val}{suffix}</>;
}

function TokenGate({ onConnect, onDemo }) {
  const [gh, setGh] = useState("");
  const [cf, setCf] = useState("");
  const [acc, setAcc] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const inp = { background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontFamily: "inherit", fontSize: "0.65rem", padding: "8px 0", outline: "none", width: "100%" };

  async function connect() {
    if (!gh && !cf) { setErr("Enter at least one token."); return; }
    setLoading(true); setErr("");
    try {
      let workers = [], domains = DOMAIN_DATA;
      if (cf && acc) {
        const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acc}/workers/scripts`, { headers: { Authorization: `Bearer ${cf}` } });
        if (r.ok) { const d = await r.json(); workers = (d.result||[]).map(w => ({ name: w.id, cat: "edge" })); }
      }
      if (cf) {
        const r = await fetch("https://api.cloudflare.com/client/v4/zones?per_page=50", { headers: { Authorization: `Bearer ${cf}` } });
        if (r.ok) { const d = await r.json(); if ((d.result||[]).length > 0) domains = d.result.map(z => { const k = DOMAIN_DATA.find(x => x.name === z.name)||{}; return { name: z.name, tag: k.tag||"CORE", desc: k.desc||z.name, subs: k.subs||[] }; }); }
      }
      onConnect({ workers: workers.length ? workers : ALL_WORKERS, domains });
    } catch(e) { setErr(e.message); }
    setLoading(false);
  }

  return (
    <div style={{ margin: "48px 0", padding: "32px", border: "1px solid rgba(255,255,255,0.15)", borderLeft: "2px solid #fff" }}>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>Connect Live Data</div>
      <div style={{ fontSize: "0.56rem", opacity: 0.4, lineHeight: 1.8, marginBottom: 24 }}>Enter tokens to pull live infrastructure. Stored in memory only — never sent elsewhere.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[["GitHub Personal Access Token", "ghp_xxxx…", gh, setGh, "password"],
          ["Cloudflare API Token", "cf token…", cf, setCf, "password"],
          ["Cloudflare Account ID", "32-char hex…", acc, setAcc, "text"]
        ].map(([label, ph, val, set, type]) => (
          <div key={label}>
            <div style={{ fontSize: "0.46rem", opacity: 0.35, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
            <input style={inp} type={type} placeholder={ph} value={val} onChange={e => set(e.target.value)} />
          </div>
        ))}
      </div>
      <button onClick={connect} disabled={loading} style={{ marginTop: 24, background: "#fff", color: "#000", border: "none", fontFamily: "inherit", fontSize: "0.6rem", fontWeight: 700, padding: "10px 24px", cursor: "pointer", letterSpacing: "0.05em" }}>
        {loading ? "Connecting…" : "Connect & Fetch Live Data"}
      </button>
      {err && <div style={{ fontSize: "0.52rem", opacity: 0.6, marginTop: 10 }}>Error: {err}</div>}
      <div style={{ marginTop: 16, fontSize: "0.46rem", opacity: 0.25 }}>
        Or: <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={onDemo}>load demo data</span>
      </div>
    </div>
  );
}

function SearchBar({ placeholder, value, onChange, count }) {
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: 12, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: "0.6rem", opacity: 0.3 }}>⌕</span>
      <input style={{ flex: 1, background: "transparent", border: "none", color: "#fff", fontFamily: "inherit", fontSize: "0.65rem", outline: "none" }} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
      <span style={{ fontSize: "0.46rem", opacity: 0.25, whiteSpace: "nowrap" }}>{count}</span>
    </div>
  );
}

function Chips({ options, active, onSelect }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
      {options.map(opt => (
        <button key={opt} onClick={() => onSelect(opt)} style={{ fontFamily: "inherit", fontSize: "0.46rem", fontWeight: 700, padding: "3px 10px", border: "1px solid", borderColor: active === opt ? "#fff" : "rgba(255,255,255,0.2)", background: active === opt ? "#fff" : "transparent", color: active === opt ? "#000" : "rgba(255,255,255,0.4)", cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {opt}
        </button>
      ))}
    </div>
  );
}

function OrgSection({ search, onSearchChange }) {
  const [open, setOpen] = useState({ 0: true, 1: true, 2: true });
  const q = search.toLowerCase();
  return (
    <div>
      <SearchBar placeholder="Search orgs…" value={search} onChange={onSearchChange} count={ORG_TIERS.flatMap(t => t.orgs).filter(o => !q || o.name.toLowerCase().includes(q)).length + " orgs"} />
      {ORG_TIERS.map((tier, ti) => {
        const filtered = tier.orgs.filter(o => !q || o.name.toLowerCase().includes(q) || o.desc.toLowerCase().includes(q));
        if (!filtered.length && q) return null;
        return (
          <div key={ti} style={{ marginBottom: 28 }}>
            <div onClick={() => setOpen(p => ({...p,[ti]:!p[ti]}))} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
              <span style={{ fontSize: "0.44rem", fontWeight: 700, padding: "2px 8px", border: "1px solid #fff", letterSpacing: "0.08em", flexShrink: 0 }}>{tier.label}</span>
              <span style={{ fontSize: "0.48rem", opacity: 0.3, marginLeft: "auto" }}>{filtered.length} orgs</span>
              <span style={{ fontSize: "0.5rem", opacity: 0.3, display: "inline-block", transform: open[ti] ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>▶</span>
            </div>
            {open[ti] && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 1, background: "rgba(255,255,255,0.06)" }}>
                {filtered.map(org => (
                  <div key={org.name} style={{ background: "#000", padding: 16 }}>
                    <div style={{ fontSize: "0.62rem", fontWeight: 700, marginBottom: 4 }}>{org.name}</div>
                    <div style={{ fontSize: "0.48rem", opacity: 0.3 }}>{org.desc}</div>
                    {org.repos && <div style={{ fontSize: "0.44rem", opacity: 0.2, marginTop: 6 }}>{org.repos} repos</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DomainSection({ domains, search, onSearchChange }) {
  const [filter, setFilter] = useState("ALL");
  const [expanded, setExpanded] = useState(null);
  const q = search.toLowerCase();
  const filtered = domains.filter(d => (filter === "ALL" || d.tag === filter) && (!q || d.name.includes(q) || (d.desc||"").toLowerCase().includes(q)));
  return (
    <div>
      <SearchBar placeholder="Search domains…" value={search} onChange={onSearchChange} count={filtered.length + " domains"} />
      <Chips options={["ALL","CORE","PRODUCT","QUANTUM","AGENT","COMMERCE"]} active={filter} onSelect={setFilter} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 1, background: "rgba(255,255,255,0.06)" }}>
        {filtered.map(d => (
          <div key={d.name} onClick={() => setExpanded(expanded === d.name ? null : d.name)} style={{ background: "#000", padding: 20, cursor: "pointer", borderLeft: expanded === d.name ? "2px solid #fff" : "2px solid transparent" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, marginBottom: 4 }}>{d.name}</div>
            <div style={{ fontSize: "0.44rem", fontWeight: 700, padding: "2px 6px", border: "1px solid rgba(255,255,255,0.25)", display: "inline-block", letterSpacing: "0.08em", marginBottom: 10 }}>{d.tag}</div>
            <div style={{ fontSize: "0.52rem", opacity: 0.35, lineHeight: 1.6 }}>{d.desc}</div>
            {expanded === d.name && d.subs && d.subs.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: "0.42rem", opacity: 0.25, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{d.subs.length} subdomains</div>
                {d.subs.map(s => <div key={s} style={{ fontSize: "0.48rem", opacity: 0.35, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{s}</div>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkerSection({ workers, search, onSearchChange }) {
  const [filter, setFilter] = useState("ALL");
  const q = search.toLowerCase();
  const filtered = workers.filter(w => (filter === "ALL" || w.cat === filter) && (!q || w.name.toLowerCase().includes(q)));
  const display = filtered.slice(0, 240);
  return (
    <div>
      <SearchBar placeholder={`Search ${workers.length} workers...`} value={search} onChange={onSearchChange} count={filtered.length + " workers"} />
      <Chips options={["ALL","control","agent","ai","service","edge"]} active={filter} onSelect={setFilter} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 1, background: "rgba(255,255,255,0.06)" }}>
        {display.map(w => (
          <div key={w.name} style={{ background: "#000", padding: "14px 16px" }}>
            <div style={{ fontSize: "0.58rem", fontWeight: 700, marginBottom: 4, wordBreak: "break-all" }}>{w.name}</div>
            <div style={{ fontSize: "0.42rem", opacity: 0.25, letterSpacing: "0.08em", textTransform: "uppercase" }}>{w.cat}</div>
          </div>
        ))}
      </div>
      {filtered.length > 240 && <div style={{ fontSize: "0.52rem", opacity: 0.25, padding: "24px 0", textAlign: "center" }}>+ {filtered.length - 240} more — refine search</div>}
    </div>
  );
}

function Sec({ num, label, children }) {
  return (
    <div style={{ padding: "52px 0 44px", borderBottom: "1px solid #fff" }}>
      <div style={{ fontSize: "0.52rem", opacity: 0.3, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
        {num} · {label}
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
      </div>
      {children}
    </div>
  );
}

const GRAD = "linear-gradient(90deg,#FF8400,#FF4400,#FF0066,#CC00AA,#8800FF,#0066FF,#2233CC)";

export default function CeceCommandCenter() {
  const [connected, setConnected] = useState(false);
  const [workers, setWorkers] = useState(ALL_WORKERS);
  const [domains, setDomains] = useState(DOMAIN_DATA);
  const [orgSearch, setOrgSearch] = useState("");
  const [domainSearch, setDomainSearch] = useState("");
  const [workerSearch, setWorkerSearch] = useState("");

  function handleConnect(data) { setWorkers(data.workers); setDomains(data.domains); setConnected(true); }

  return (
    <div style={{ background: "#000", color: "#fff", fontFamily: "'JetBrains Mono', monospace", minHeight: "100vh" }}>
      <div style={{ height: 3, background: GRAD }} />

      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "#000", borderBottom: "1px solid #fff", padding: "0 24px", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
          BlackRoad
          <span style={{ fontSize: "0.46rem", fontWeight: 700, padding: "2px 8px", border: "1px solid rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>CECE · CMD</span>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {connected && <>
            <span style={{ fontSize: "0.48rem", opacity: 0.4 }}>orgs <b style={{ opacity: 1 }}>16</b></span>
            <span style={{ fontSize: "0.48rem", opacity: 0.4 }}>domains <b style={{ opacity: 1 }}>{domains.length}</b></span>
            <span style={{ fontSize: "0.48rem", opacity: 0.4 }}>workers <b style={{ opacity: 1 }}>{workers.length}</b></span>
          </>}
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: connected ? "#fff" : "rgba(255,255,255,0.2)" }} />
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 80px" }}>

        <div style={{ padding: "72px 0 56px", borderBottom: "1px solid #fff" }}>
          <div style={{ fontSize: "0.52rem", opacity: 0.3, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 20 }}>Cece Command Center · V1.0</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(2.8rem, 10vw, 5.5rem)", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em" }}>BlackRoad<br/>OS Infrastructure</h1>
          <p style={{ marginTop: 20, fontSize: "0.68rem", opacity: 0.45, lineHeight: 1.9, maxWidth: 500 }}>Every org, domain, and worker — navigable from a single surface.</p>
          <div style={{ height: 1, background: GRAD, width: 160, margin: "32px 0" }} />
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {[["16","GitHub Orgs"],[connected ? String(domains.length) : "19","Domains"],["4","Infra Layers"],[connected ? String(workers.length) : "489+","CF Workers"]].map(([num, label], i, arr) => (
              <div key={label} style={{ paddingRight: i < arr.length-1 ? 32 : 0, marginRight: i < arr.length-1 ? 32 : 0, borderRight: i < arr.length-1 ? "1px solid rgba(255,255,255,0.12)" : "none" }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "2.2rem", fontWeight: 700, lineHeight: 1 }}>
                  {connected ? <Counter to={parseInt(num) || num.length} suffix={num.includes("+") ? "+" : ""} /> : num}
                </div>
                <div style={{ fontSize: "0.44rem", opacity: 0.3, letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {!connected && <TokenGate onConnect={handleConnect} onDemo={() => setConnected(true)} />}

        {connected && <>
          <Sec num="01" label="GitHub Organization Architecture">
            <OrgSection search={orgSearch} onSearchChange={setOrgSearch} />
          </Sec>
          <Sec num="02" label="Domain Portfolio">
            <DomainSection domains={domains} search={domainSearch} onSearchChange={setDomainSearch} />
          </Sec>
          <Sec num="03" label="Cloudflare Worker Fleet">
            <WorkerSection workers={workers} search={workerSearch} onSearchChange={setWorkerSearch} />
          </Sec>
        </>}

        <footer style={{ padding: "32px 0", display: "flex", justifyContent: "space-between", fontSize: "0.46rem", opacity: 0.2, flexWrap: "wrap", gap: 8 }}>
          <span>BlackRoad OS, Inc. · Cece Command Center V1.0</span>
          <span>{connected ? "Connected · " + new Date().toLocaleTimeString() : "Not connected"}</span>
        </footer>
      </div>

      <div style={{ height: 3, background: GRAD }} />
    </div>
  );
}
