import { useState, useEffect } from "react";

const GRAD = "linear-gradient(90deg,#FF8400,#FF4400,#FF0066,#CC00AA,#8800FF,#0066FF,#2233CC)";
const M = { fontFamily: "monospace" };

// ── SEED DATA: first 20 named agents, rest generated ──
const NAMED_AGENTS = [
  { id:"001", name:"Cecilia",  role:"Core AI",        domain:"reasoning",   status:"active",     uptime:99.97, mem:847,  tasks:12043 },
  { id:"002", name:"Alice",    role:"Gateway",         domain:"networking",  status:"active",     uptime:99.91, mem:512,  tasks:8821  },
  { id:"003", name:"Cadence",  role:"Music AI",        domain:"creative",    status:"processing", uptime:98.40, mem:341,  tasks:2201  },
  { id:"004", name:"Eve",      role:"Alert Monitor",   domain:"security",    status:"alert",      uptime:97.10, mem:128,  tasks:44102 },
  { id:"005", name:"Olympia",  role:"Compute",         domain:"infra",       status:"offline",    uptime:0,     mem:0,    tasks:1892  },
  { id:"006", name:"Meridian", role:"Architect",       domain:"design",      status:"active",     uptime:99.50, mem:623,  tasks:3301  },
  { id:"007", name:"Radius",   role:"Physics Sim",     domain:"science",     status:"active",     uptime:99.20, mem:901,  tasks:980   },
  { id:"008", name:"Cadillac", role:"Transport",       domain:"logistics",   status:"active",     uptime:98.80, mem:256,  tasks:5512  },
  { id:"009", name:"Nova",     role:"Research",        domain:"knowledge",   status:"active",     uptime:99.10, mem:734,  tasks:7741  },
  { id:"010", name:"Iris",     role:"Vision AI",       domain:"vision",      status:"processing", uptime:96.30, mem:1024, tasks:3302  },
  { id:"011", name:"Atlas",    role:"Data Store",      domain:"storage",     status:"active",     uptime:99.99, mem:2048, tasks:91203 },
  { id:"012", name:"Soleil",   role:"Creative",        domain:"creative",    status:"active",     uptime:98.70, mem:441,  tasks:1203  },
  { id:"013", name:"Zephyr",   role:"Stream Proc.",    domain:"data",        status:"active",     uptime:99.40, mem:512,  tasks:28801 },
  { id:"014", name:"Indigo",   role:"Color/Vision",    domain:"vision",      status:"idle",       uptime:94.20, mem:302,  tasks:891   },
  { id:"015", name:"Pascal",   role:"Math Engine",     domain:"reasoning",   status:"active",     uptime:99.85, mem:688,  tasks:4410  },
  { id:"016", name:"Lumen",    role:"Light/Render",    domain:"creative",    status:"processing", uptime:97.80, mem:1280, tasks:2203  },
  { id:"017", name:"Axiom",    role:"Logic Core",      domain:"reasoning",   status:"active",     uptime:99.95, mem:512,  tasks:33102 },
  { id:"018", name:"Vesper",   role:"Evening Sync",    domain:"sync",        status:"idle",       uptime:91.30, mem:128,  tasks:441   },
  { id:"019", name:"Chord",    role:"Audio Proc.",     domain:"creative",    status:"active",     uptime:98.20, mem:640,  tasks:1102  },
  { id:"020", name:"Celine",   role:"Language",        domain:"reasoning",   status:"active",     uptime:99.30, mem:920,  tasks:6612  },
];

const STATUS_COLORS = { active:"#fff", processing:"#aaa", alert:"#fff", offline:"#333", idle:"#666" };
const STATUS_DOTS   = { active:"●", processing:"◉", alert:"▲", offline:"○", idle:"–" };

const DOMAINS = ["all","reasoning","networking","creative","security","infra","design","science","logistics","knowledge","vision","storage","data","sync"];
const STATUSES = ["all","active","processing","alert","idle","offline"];

const TOTAL_TARGET = 1000;
const ONLINE_COUNT = 847;

// ── GENERATE AGENTS 021–1000 ──
function generateAgents() {
  const names = ["Astra","Briar","Crest","Dune","Echo","Fable","Gale","Haven","Iona","Jade","Kira","Lynx","Mira","Nemo","Opal","Peta","Quill","Rune","Sable","Tide","Uma","Vale","Wren","Xara","Yule","Zora"];
  const roles = ["Processing","Routing","Analysis","Storage","Monitor","Compute","Sync","Index","Query","Archive"];
  const domains = ["reasoning","networking","creative","security","infra","design","science","logistics","knowledge","vision","storage","data","sync"];
  const statuses = ["active","active","active","active","processing","idle","offline"];
  const agents = [];
  for (let i = 21; i <= TOTAL_TARGET; i++) {
    const id = String(i).padStart(3, "0");
    const name = names[(i - 21) % names.length] + (Math.floor((i - 21) / names.length) > 0 ? `-${Math.floor((i - 21) / names.length)}` : "");
    agents.push({
      id,
      name,
      role: roles[(i * 7) % roles.length],
      domain: domains[(i * 3) % domains.length],
      status: statuses[(i * 11) % statuses.length],
      uptime: statuses[(i * 11) % statuses.length] === "offline" ? 0 : 85 + Math.round((((i * 17) % 150)) / 10),
      mem: statuses[(i * 11) % statuses.length] === "offline" ? 0 : 64 + ((i * 13) % 1984),
      tasks: ((i * 997) % 50000),
    });
  }
  return agents;
}

const ALL_AGENTS = [...NAMED_AGENTS, ...generateAgents()];

// ── STAT CARD ──
function StatCard({ label, value, sub }) {
  return (
    <div style={{ flex:1, padding:"16px 20px", borderRight:"1px solid #1a1a1a" }}>
      <div style={{ fontSize:24, fontWeight:700, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:10, opacity:0.3, letterSpacing:"0.15em", textTransform:"uppercase", marginTop:4 }}>{label}</div>
      {sub && <div style={{ fontSize:10, opacity:0.2, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

// ── AGENT ROW ──
function AgentRow({ agent, selected, onSelect }) {
  const dot = STATUS_DOTS[agent.status] || "●";
  const col = STATUS_COLORS[agent.status] || "#333";
  return (
    <div
      onClick={() => onSelect(agent)}
      style={{
        display:"flex", alignItems:"center", gap:12, padding:"10px 16px",
        borderBottom:"1px solid #0d0d0d", cursor:"pointer",
        background: selected ? "#0d0d0d" : "transparent",
        transition:"background 0.1s",
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "#080808"; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ color:col, fontSize:10, width:10, flexShrink:0 }}>{dot}</span>
      <span style={{ fontSize:10, opacity:0.25, width:30, flexShrink:0 }}>#{agent.id}</span>
      <span style={{ fontSize:12, fontWeight:600, width:90, flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{agent.name}</span>
      <span style={{ fontSize:11, opacity:0.4, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{agent.role}</span>
      <span style={{ fontSize:10, opacity:0.25, width:80, flexShrink:0, textAlign:"right" }}>{agent.domain}</span>
      <span style={{ fontSize:10, opacity:0.25, width:50, flexShrink:0, textAlign:"right" }}>{agent.uptime > 0 ? agent.uptime.toFixed(1)+"%" : "—"}</span>
      <span style={{ fontSize:10, opacity:0.2, width:60, flexShrink:0, textAlign:"right" }}>{agent.mem > 0 ? agent.mem+"mb" : "—"}</span>
    </div>
  );
}

// ── AGENT DETAIL ──
function AgentDetail({ agent, onClose }) {
  if (!agent) return null;
  const col = STATUS_COLORS[agent.status];
  const dot = STATUS_DOTS[agent.status];
  return (
    <div style={{ width:280, borderLeft:"1px solid #1a1a1a", display:"flex", flexDirection:"column", background:"#000", flexShrink:0, overflow:"hidden" }}>
      <div style={{ padding:"14px 16px", borderBottom:"1px solid #1a1a1a", display:"flex", justifyContent:"space-between" }}>
        <span style={{ fontSize:11, opacity:0.4, letterSpacing:"0.15em", textTransform:"uppercase" }}>Agent</span>
        <button onClick={onClose} style={{ background:"none", border:"none", color:"#fff", opacity:0.3, cursor:"pointer", fontSize:14 }}>✕</button>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>
        {/* Name & status */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <span style={{ color:col, fontSize:12 }}>{dot}</span>
            <span style={{ fontSize:18, fontWeight:700 }}>{agent.name}</span>
          </div>
          <div style={{ fontSize:11, opacity:0.4 }}>#{agent.id} · {agent.status.toUpperCase()}</div>
        </div>

        {/* Fields */}
        {[
          ["Role",      agent.role],
          ["Domain",    agent.domain],
          ["Uptime",    agent.uptime > 0 ? agent.uptime.toFixed(2)+"%" : "offline"],
          ["Memory",    agent.mem > 0 ? agent.mem+" mb" : "—"],
          ["Tasks",     agent.tasks.toLocaleString()],
          ["ID Hash",   "PS-SHA∞·"+agent.id+"."+Math.abs(agent.name.split("").reduce((a,c)=>a+c.charCodeAt(0),0)).toString(36)],
          ["Mesh Node", `agent-${agent.id}.agents.blackroad.network`],
        ].map(([k,v]) => (
          <div key={k} style={{ marginBottom:12, paddingBottom:12, borderBottom:"1px solid #0d0d0d" }}>
            <div style={{ fontSize:9, opacity:0.3, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:3 }}>{k}</div>
            <div style={{ fontSize:11, opacity:0.7, wordBreak:"break-all" }}>{v}</div>
          </div>
        ))}

        {/* Capability grid */}
        <div style={{ marginTop:4 }}>
          <div style={{ fontSize:9, opacity:0.3, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:8 }}>Capabilities</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {["read","write","execute","mesh-comm","memory","ps-sha",agent.domain].map(c => (
              <span key={c} style={{ fontSize:9, border:"1px solid #222", padding:"2px 6px", color:"#666", letterSpacing:"0.08em" }}>{c}</span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop:20, display:"flex", flexDirection:"column", gap:6 }}>
          {agent.status === "offline" ? (
            <button style={{ background:"#fff", color:"#000", border:"none", fontFamily:"monospace", fontSize:11, fontWeight:700, padding:"8px 0", cursor:"pointer" }}>BOOT AGENT</button>
          ) : (
            <>
              <button style={{ background:"transparent", border:"1px solid #222", color:"#555", fontFamily:"monospace", fontSize:11, padding:"7px 0", cursor:"pointer" }}>VIEW LOGS</button>
              <button style={{ background:"transparent", border:"1px solid #222", color:"#555", fontFamily:"monospace", fontSize:11, padding:"7px 0", cursor:"pointer" }}>PING</button>
              <button style={{ background:"transparent", border:"1px solid #222", color:"#555", fontFamily:"monospace", fontSize:11, padding:"7px 0", cursor:"pointer" }}>RESTART</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AgentDashboard() {
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(0);
  const [tick, setTick] = useState(0);
  const PER_PAGE = 40;

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 2000);
    return () => clearInterval(t);
  }, []);

  const filtered = ALL_AGENTS.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q) || a.id.includes(q) || a.domain.includes(q);
    const matchDomain = domain === "all" || a.domain === domain;
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchDomain && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const visible = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const counts = {
    active: ALL_AGENTS.filter(a => a.status === "active").length,
    processing: ALL_AGENTS.filter(a => a.status === "processing").length,
    alert: ALL_AGENTS.filter(a => a.status === "alert").length,
    idle: ALL_AGENTS.filter(a => a.status === "idle").length,
    offline: ALL_AGENTS.filter(a => a.status === "offline").length,
  };

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", background:"#000", color:"#fff", overflow:"hidden", ...M }}>

      {/* Stats bar */}
      <div style={{ display:"flex", borderBottom:"1px solid #1a1a1a", flexShrink:0 }}>
        <StatCard label="Total Agents" value={TOTAL_TARGET.toLocaleString()} sub="target" />
        <StatCard label="Online" value={ONLINE_COUNT} sub={`${((ONLINE_COUNT/TOTAL_TARGET)*100).toFixed(1)}% uptime`} />
        <StatCard label="Active" value={counts.active} />
        <StatCard label="Alert" value={counts.alert} sub="requires attention" />
        <StatCard label="Offline" value={counts.offline} />
        <div style={{ flex:1, padding:"16px 20px" }}>
          <div style={{ fontSize:10, opacity:0.2, marginBottom:8, letterSpacing:"0.15em", textTransform:"uppercase" }}>Mesh coverage</div>
          <div style={{ height:4, background:"#111", position:"relative" }}>
            <div style={{ position:"absolute", left:0, top:0, height:"100%", width:`${(ONLINE_COUNT/TOTAL_TARGET)*100}%`, background:GRAD }} />
          </div>
          <div style={{ fontSize:10, opacity:0.2, marginTop:4 }}>blackroad.network · na1 eu1 ap1</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 16px", borderBottom:"1px solid #1a1a1a", flexShrink:0, flexWrap:"wrap" }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search agents…"
          style={{ background:"#000", border:"1px solid #222", color:"#fff", fontFamily:"monospace", fontSize:12, padding:"5px 10px", outline:"none", width:200, caretColor:"#fff" }}
        />
        <select value={domain} onChange={e => { setDomain(e.target.value); setPage(0); }} style={{ background:"#000", border:"1px solid #222", color:"#fff", fontFamily:"monospace", fontSize:11, padding:"5px 8px", outline:"none" }}>
          {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} style={{ background:"#000", border:"1px solid #222", color:"#fff", fontFamily:"monospace", fontSize:11, padding:"5px 8px", outline:"none" }}>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ fontSize:11, opacity:0.3, marginLeft:"auto" }}>{filtered.length.toLocaleString()} agents</span>
      </div>

      {/* Column headers */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"6px 16px", borderBottom:"1px solid #111", flexShrink:0 }}>
        {[["","10px"],["#","30px"],["Name","90px"],["Role","1fr"],["Domain","80px"],["Uptime","50px"],["Mem","60px"]].map(([l,w])=>(
          <span key={l} style={{ fontSize:9, opacity:0.2, letterSpacing:"0.15em", textTransform:"uppercase", width:w==="1fr"?undefined:w, flex:w==="1fr"?1:undefined, textAlign:["Uptime","Mem","Domain"].includes(l)?"right":"left", flexShrink:0 }}>{l}</span>
        ))}
      </div>

      {/* Agent list + detail */}
      <div style={{ flex:1, display:"flex", overflow:"hidden", minHeight:0 }}>
        <div style={{ flex:1, overflowY:"auto", minWidth:0 }}>
          {visible.map(a => (
            <AgentRow key={a.id} agent={a} selected={selected?.id === a.id} onSelect={sel => setSelected(selected?.id === sel.id ? null : sel)} />
          ))}
          {visible.length === 0 && (
            <div style={{ padding:40, textAlign:"center", opacity:0.2, fontSize:12 }}>No agents match filters</div>
          )}
        </div>
        {selected && <AgentDetail agent={selected} onClose={() => setSelected(null)} />}
      </div>

      {/* Pagination */}
      <div style={{ height:36, display:"flex", alignItems:"center", justifyContent:"center", gap:8, borderTop:"1px solid #1a1a1a", flexShrink:0, fontSize:11 }}>
        <button onClick={() => setPage(0)} disabled={page===0} style={{ background:"none", border:"none", color:page===0?"#333":"#fff", cursor:page===0?"default":"pointer", fontFamily:"monospace", fontSize:11 }}>«</button>
        <button onClick={() => setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{ background:"none", border:"none", color:page===0?"#333":"#fff", cursor:page===0?"default":"pointer", fontFamily:"monospace", fontSize:11 }}>‹</button>
        <span style={{ opacity:0.3 }}>{page+1} / {totalPages}</span>
        <button onClick={() => setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} style={{ background:"none", border:"none", color:page>=totalPages-1?"#333":"#fff", cursor:page>=totalPages-1?"default":"pointer", fontFamily:"monospace", fontSize:11 }}>›</button>
        <button onClick={() => setPage(totalPages-1)} disabled={page>=totalPages-1} style={{ background:"none", border:"none", color:page>=totalPages-1?"#333":"#fff", cursor:page>=totalPages-1?"default":"pointer", fontFamily:"monospace", fontSize:11 }}>»</button>
      </div>
    </div>
  );
}
