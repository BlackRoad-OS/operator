import { useState, useEffect, useRef } from "react";

const GRAD = "linear-gradient(90deg, #FF8400, #FF4400, #FF0066, #CC00AA, #8800FF, #0066FF, #2233CC)";
const MONO = "'JetBrains Mono', monospace";
const GROTESK = "'Space Grotesk', sans-serif";

// ── Fake data generators ──────────────────────────────────────────────────────

const AGENTS = [
  { id: "cecilia",  name: "Cecilia",  role: "Governance Core",   color: "#FF8400" },
  { id: "cadence",  name: "Cadence",  role: "Music Composer",    color: "#0066FF" },
  { id: "alice",    name: "Alice",    role: "Gateway Agent",     color: "#FF0066" },
  { id: "olympia",  name: "Olympia",  role: "Research Analyst",  color: "#8800FF" },
  { id: "eve",      name: "Eve",      role: "Edge Coordinator",  color: "#FF4400" },
  { id: "meridian", name: "Meridian", role: "Arch Designer",     color: "#CC00AA" },
  { id: "radius",   name: "Radius",   role: "Physics Simulator", color: "#2233CC" },
  { id: "cadillac", name: "Cadillac", role: "Infra Watcher",     color: "#FF8400" },
];

const ACTIONS = [
  "policy:evaluate",   "ledger:write",    "agent:spawn",     "agent:terminate",
  "memory:read",       "memory:write",    "task:delegate",   "task:complete",
  "intent:submit",     "claim:verify",    "delegation:grant", "policy:update",
];

const RESOURCES = [
  "homework.assignment/a-29f1", "user.session/u-8821",     "agent.cecilia/memory",
  "ledger.event/l-0041",        "policy.edu:grade",        "mesh.pi-node/n-004",
  "creator.project/p-1187",     "roadcoin.wallet/w-9a",    "agent.alice/task",
];

const DECISIONS = ["ALLOW", "ALLOW", "ALLOW", "DENY", "ALLOW", "ALLOW", "DENY"];

function makeEvent(id) {
  const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
  const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  const resource = RESOURCES[Math.floor(Math.random() * RESOURCES.length)];
  const decision = DECISIONS[Math.floor(Math.random() * DECISIONS.length)];
  const ms = Date.now();
  return { id, agent, action, resource, decision, ms, latency: Math.floor(Math.random() * 18) + 1 };
}

function fmtTime(ms) {
  const d = new Date(ms);
  return d.toTimeString().slice(0, 8) + "." + String(d.getMilliseconds()).padStart(3, "0");
}

// ── Policies ──────────────────────────────────────────────────────────────────

const POLICIES = [
  { id: "POL-001", scope: "policy:edu:*",    rule: "Only teacher can create assignments", effect: "ALLOW", hits: 1847, active: true },
  { id: "POL-002", scope: "policy:edu:*",    rule: "Only assigned student can submit",    effect: "ALLOW", hits: 2310, active: true },
  { id: "POL-003", scope: "policy:agent:*",  rule: "Agents require delegation to spawn",  effect: "DENY",  hits: 124,  active: true },
  { id: "POL-004", scope: "policy:mesh:*",   rule: "Pi nodes must heartbeat < 30s",       effect: "ALLOW", hits: 9821, active: true },
  { id: "POL-005", scope: "policy:ledger:*", rule: "Ledger events are append-only",       effect: "ALLOW", hits: 5504, active: true },
  { id: "POL-006", scope: "policy:user:*",   rule: "Sessions expire after 24h inactivity", effect: "DENY", hits: 88,   active: false },
  { id: "POL-007", scope: "policy:agent:*",  rule: "Max 3 concurrent tasks per agent",    effect: "DENY",  hits: 301,  active: true },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricBar({ label, value, sub, accent }) {
  return (
    <div style={{ padding: "0 28px", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ fontFamily: MONO, fontSize: "0.44rem", opacity: 0.3, letterSpacing: "0.15em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: GROTESK, fontSize: "1.5rem", fontWeight: 700, lineHeight: 1, color: accent || "#fff" }}>{value}</div>
      {sub && <div style={{ fontFamily: MONO, fontSize: "0.42rem", opacity: 0.25, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function AgentDot({ agent, active }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "9px 0",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}>
      <div style={{
        width: 7, height: 7, borderRadius: "50%",
        background: active ? agent.color : "rgba(255,255,255,0.12)",
        flexShrink: 0,
        boxShadow: active ? `0 0 6px ${agent.color}88` : "none",
        animation: active && agent.id === "cecilia" ? "pulse-dot 2s ease-in-out infinite" : "none",
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: MONO, fontSize: "0.52rem", fontWeight: 700, opacity: active ? 1 : 0.25 }}>{agent.name}</div>
        <div style={{ fontFamily: MONO, fontSize: "0.42rem", opacity: 0.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{agent.role}</div>
      </div>
      <div style={{ fontFamily: MONO, fontSize: "0.42rem", opacity: active ? 0.4 : 0.15 }}>
        {active ? "ONLINE" : "IDLE"}
      </div>
    </div>
  );
}

function LedgerRow({ event, fresh }) {
  const allow = event.decision === "ALLOW";
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "80px 90px 140px 1fr 52px 36px",
      gap: 0,
      padding: "7px 0",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      fontFamily: MONO,
      fontSize: "0.48rem",
      alignItems: "center",
      background: fresh ? "rgba(255,255,255,0.03)" : "transparent",
      transition: "background 1.2s",
    }}>
      <span style={{ opacity: 0.25 }}>{fmtTime(event.ms)}</span>
      <span style={{ opacity: 0.6, color: event.agent.color }}>{event.agent.name}</span>
      <span style={{ opacity: 0.5 }}>{event.action}</span>
      <span style={{ opacity: 0.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{event.resource}</span>
      <span style={{
        fontWeight: 700,
        color: allow ? "#fff" : "rgba(255,255,255,0.3)",
        letterSpacing: "0.05em",
        textDecoration: allow ? "none" : "line-through",
        opacity: allow ? 1 : 0.5,
      }}>{event.decision}</span>
      <span style={{ opacity: 0.2, textAlign: "right" }}>{event.latency}ms</span>
    </div>
  );
}

function PolicyRow({ p }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "11px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: hovered ? "rgba(255,255,255,0.02)" : "transparent",
        transition: "background 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
        <span style={{ fontFamily: MONO, fontSize: "0.44rem", opacity: 0.2, minWidth: 52 }}>{p.id}</span>
        <span style={{
          fontFamily: MONO, fontSize: "0.44rem", fontWeight: 700,
          padding: "1px 6px",
          background: p.effect === "ALLOW" ? "#fff" : "transparent",
          color: p.effect === "ALLOW" ? "#000" : "rgba(255,255,255,0.35)",
          border: p.effect === "DENY" ? "1px solid rgba(255,255,255,0.2)" : "none",
          opacity: p.active ? 1 : 0.3,
        }}>{p.effect}</span>
        <span style={{
          fontFamily: MONO, fontSize: "0.42rem", opacity: 0.25,
          background: "rgba(255,255,255,0.05)", padding: "1px 6px",
        }}>{p.scope}</span>
        {!p.active && <span style={{ fontFamily: MONO, fontSize: "0.4rem", opacity: 0.2, marginLeft: "auto" }}>DISABLED</span>}
      </div>
      <div style={{ fontFamily: MONO, fontSize: "0.52rem", opacity: p.active ? 0.6 : 0.2, paddingLeft: 0, lineHeight: 1.5 }}>
        {p.rule}
      </div>
      <div style={{ fontFamily: MONO, fontSize: "0.42rem", opacity: 0.2, marginTop: 4 }}>
        {p.hits.toLocaleString()} evaluations
      </div>
    </div>
  );
}

// Utility: auto-scroll a ref when deps change
function AutoScroll({ target, deps }) {
  useEffect(() => {
    if (target.current) target.current.scrollIntoView({ behavior: "smooth" });
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// Live clock ticker
function Ticker() {
  const [time, setTime] = useState(new Date().toISOString().slice(11, 23));
  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toISOString().slice(11, 23)), 100);
    return () => clearInterval(t);
  }, []);
  return <span>{time}Z</span>;
}

// ── Main Console ──────────────────────────────────────────────────────────────

export default function GovernanceConsole() {
  const [events, setEvents] = useState(() => Array.from({ length: 18 }, (_, i) => ({ ...makeEvent(i), fresh: false })));
  const [counter, setCounter] = useState(18);
  const [cmdVal, setCmdVal] = useState("");
  const [cmdLog, setCmdLog] = useState([
    { type: "sys",  text: "CECE GOVERNANCE CORE v2.4.1 — ONLINE" },
    { type: "sys",  text: "Ledger stream active. Policy engine loaded. 7 policies registered." },
    { type: "info", text: "All systems nominal. Z := yx - w → Δ=∅." },
  ]);
  const [activeAgents] = useState(new Set(["cecilia", "cadence", "alice", "eve"]));
  const [activeTab, setActiveTab] = useState("LEDGER");
  const streamRef = useRef(null);
  const cmdRef = useRef(null);

  // Live event stream
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvt = { ...makeEvent(counter), fresh: true };
      setEvents(prev => {
        const updated = [newEvt, ...prev.slice(0, 39)].map((e, i) => ({ ...e, fresh: i === 0 }));
        return updated;
      });
      setCounter(c => c + 1);
    }, 1400 + Math.random() * 1200);
    return () => clearInterval(interval);
  }, [counter]);

  // Ledger scroll lock at top
  useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = 0;
  }, [events.length]);

  const handleCmd = (e) => {
    if (e.key !== "Enter" || !cmdVal.trim()) return;
    const input = cmdVal.trim();
    setCmdVal("");
    const entry = { type: "cmd", text: `> ${input}` };
    let response;
    const lower = input.toLowerCase();
    if (lower === "help") response = { type: "info", text: "Commands: status · agents · policies · clear · Z · ledger flush" };
    else if (lower === "status") response = { type: "sys", text: `ONLINE · ${events.length} events · ${POLICIES.filter(p => p.active).length} active policies · Z=∅` };
    else if (lower === "agents") response = { type: "info", text: `${activeAgents.size} online: ${[...activeAgents].join(", ")}` };
    else if (lower === "policies") response = { type: "info", text: `7 registered · ${POLICIES.filter(p => p.active).length} active · ${POLICIES.filter(p => !p.active).length} disabled` };
    else if (lower === "clear") { setCmdLog([]); return; }
    else if (lower === "z") response = { type: "sys", text: "Z := yx - w → Δ = ∅ · Equilibrium confirmed. No adaptation required." };
    else if (lower === "ledger flush") response = { type: "warn", text: "DENIED — ledger is append-only. POL-005 enforced." };
    else response = { type: "warn", text: `Unknown command: '${input}'. Type 'help' for options.` };
    setCmdLog(prev => [...prev, entry, response].slice(-40));
  };

  const totalAllow = events.filter(e => e.decision === "ALLOW").length;
  const totalDeny  = events.filter(e => e.decision === "DENY").length;
  const policyHits = POLICIES.reduce((acc, p) => acc + p.hits, 0);

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", fontFamily: MONO, display: "flex", flexDirection: "column" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); } @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.6)} } @keyframes blink { 0%,49%,100%{opacity:1} 50%,99%{opacity:0} } @keyframes slide-in { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} } .fresh-row { animation: slide-in 0.3s ease; } input::placeholder { color: rgba(255,255,255,0.2); } input { outline: none; }`}</style>

      {/* Top grad rule */}
      <div style={{ height: 3, background: GRAD, flexShrink: 0 }} />

      {/* Nav */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: 44,
        borderBottom: "1px solid rgba(255,255,255,0.12)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontFamily: GROTESK, fontWeight: 700, fontSize: "0.8rem" }}>BlackRoad</span>
          <span style={{ fontSize: "0.42rem", opacity: 0.2 }}>/</span>
          <span style={{ fontSize: "0.5rem", opacity: 0.5, letterSpacing: "0.1em" }}>Governance Console</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF8400", animation: "pulse-dot 2s ease-in-out infinite" }} />
            <span style={{ fontSize: "0.46rem", letterSpacing: "0.1em" }}>CECE ONLINE</span>
          </div>
          <span style={{ fontSize: "0.44rem", opacity: 0.2, fontFamily: MONO }}>gov.api.blackroad.io</span>
        </div>
      </div>

      {/* Metric bar */}
      <div style={{
        display: "flex", alignItems: "stretch",
        padding: "14px 0 14px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        flexShrink: 0, gap: 0,
      }}>
        <MetricBar label="TOTAL EVENTS" value={events.length + 8814} sub={"+1 / ~1.3s"} />
        <MetricBar label="ALLOW RATE" value={`${Math.round((totalAllow / events.length) * 100)}%`} sub={`${totalAllow} allow · ${totalDeny} deny`} />
        <MetricBar label="ACTIVE AGENTS" value={activeAgents.size} sub={`of ${AGENTS.length} registered`} accent="#FF8400" />
        <MetricBar label="POLICIES" value={POLICIES.filter(p => p.active).length} sub={`${POLICIES.filter(p => !p.active).length} disabled`} />
        <MetricBar label="POLICY HITS" value={policyHits.toLocaleString()} sub="lifetime evaluations" />
        <div style={{ padding: "0 28px" }}>
          <div style={{ fontSize: "0.44rem", opacity: 0.3, letterSpacing: "0.15em", marginBottom: 4 }}>Z EQUATION</div>
          <div style={{ fontFamily: GROTESK, fontSize: "1.1rem", fontWeight: 700, opacity: 0.8 }}>Z := yx − w</div>
          <div style={{ fontSize: "0.42rem", opacity: 0.25, marginTop: 3 }}>Δ = ∅ · equilibrium</div>
        </div>
      </div>

      {/* Main 3-panel layout */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 300px", flex: 1, overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>

        {/* LEFT — Agent Roster */}
        <div style={{ borderRight: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
            <div style={{ fontSize: "0.44rem", opacity: 0.3, letterSpacing: "0.18em" }}>AGENT ROSTER</div>
          </div>
          <div style={{ overflowY: "auto", flex: 1, padding: "0 16px" }}>
            {AGENTS.map(a => <AgentDot key={a.id} agent={a} active={activeAgents.has(a.id)} />)}
          </div>

          {/* Mini stat block */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px", flexShrink: 0 }}>
            <div style={{ fontSize: "0.42rem", opacity: 0.2, letterSpacing: "0.12em", marginBottom: 8 }}>MESH STATUS</div>
            {[["Pi Nodes", "12 online"], ["Edge Devices", "3 active"], ["Heartbeat", "< 8s avg"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: "0.46rem" }}>
                <span style={{ opacity: 0.3 }}>{k}</span>
                <span style={{ opacity: 0.6 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER — Live stream + Policies tabs */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Tab bar */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
            {["LEDGER", "POLICIES"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                fontFamily: MONO, fontSize: "0.48rem", letterSpacing: "0.12em",
                padding: "12px 20px",
                background: "transparent", border: "none", color: "#fff",
                borderBottom: activeTab === tab ? "2px solid #fff" : "2px solid transparent",
                opacity: activeTab === tab ? 1 : 0.3,
                cursor: "pointer",
              }}>{tab}</button>
            ))}
            {activeTab === "LEDGER" && (
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, padding: "0 16px" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#FF8400", animation: "pulse-dot 1.4s ease-in-out infinite" }} />
                <span style={{ fontSize: "0.42rem", opacity: 0.35 }}>LIVE</span>
              </div>
            )}
          </div>

          {activeTab === "LEDGER" && (
            <>
              {/* Column headers */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "80px 90px 140px 1fr 52px 36px",
                gap: 0, padding: "6px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                flexShrink: 0,
              }}>
                {["TIME", "AGENT", "ACTION", "RESOURCE", "VERDICT", "LAT"].map(h => (
                  <span key={h} style={{ fontSize: "0.4rem", opacity: 0.2, letterSpacing: "0.12em" }}>{h}</span>
                ))}
              </div>

              {/* Event stream */}
              <div ref={streamRef} style={{ overflowY: "auto", flex: 1, padding: "0 16px" }}>
                {events.map((evt, i) => <LedgerRow key={evt.id + "-" + i} event={evt} fresh={i === 0} />)}
              </div>
            </>
          )}

          {activeTab === "POLICIES" && (
            <div style={{ overflowY: "auto", flex: 1, padding: "0 16px" }}>
              <div style={{ padding: "12px 0 4px", fontSize: "0.42rem", opacity: 0.2, letterSpacing: "0.12em" }}>
                {POLICIES.length} REGISTERED POLICIES · {POLICIES.filter(p => p.active).length} ACTIVE
              </div>
              {POLICIES.map((p) => <PolicyRow key={p.id} p={p} />)}
            </div>
          )}
        </div>

        {/* RIGHT — Command terminal */}
        <div style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "0.44rem", opacity: 0.3, letterSpacing: "0.18em" }}>CECE TERMINAL</div>
            <div style={{ fontSize: "0.42rem", opacity: 0.2 }}>v2.4.1</div>
          </div>

          {/* Command log */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
            {cmdLog.map((line, i) => (
              <div key={i} style={{
                fontFamily: MONO, fontSize: "0.5rem", lineHeight: 1.7,
                color: line.type === "cmd" ? "#fff" :
                       line.type === "sys"  ? "rgba(255,255,255,0.8)" :
                       line.type === "warn" ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.55)",
                opacity: line.type === "cmd" ? 1 : undefined,
              }}>
                {line.type === "sys"  && <span style={{ opacity: 0.35 }}>[SYS] </span>}
                {line.type === "info" && <span style={{ opacity: 0.35 }}>[INF] </span>}
                {line.type === "warn" && <span style={{ opacity: 0.35 }}>[WRN] </span>}
                {line.text}
              </div>
            ))}

            {/* Auto scroll anchor */}
            <div ref={el => { cmdRef.current = el; }} />
          </div>

          {/* Auto-scroll to bottom of cmd log */}
          <AutoScroll target={cmdRef} deps={[cmdLog.length]} />

          {/* Input */}
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            padding: "10px 16px",
            display: "flex", alignItems: "center", gap: 8,
            flexShrink: 0,
          }}>
            <span style={{ fontSize: "0.52rem", opacity: 0.4 }}>›</span>
            <input
              value={cmdVal}
              onChange={e => setCmdVal(e.target.value)}
              onKeyDown={handleCmd}
              placeholder="type command…"
              style={{
                flex: 1, background: "transparent", border: "none",
                color: "#fff", fontFamily: MONO, fontSize: "0.52rem",
                caretColor: "#fff",
              }}
            />
            <span style={{
              width: 1, height: 12, background: "#fff",
              animation: "blink 1s step-end infinite",
              flexShrink: 0,
            }} />
          </div>

          {/* Hint row */}
          <div style={{
            padding: "6px 16px 10px",
            fontSize: "0.4rem", opacity: 0.18,
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}>
            try: help · status · agents · policies · Z · ledger flush
          </div>
        </div>
      </div>

      {/* Bottom status bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 20px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        fontSize: "0.42rem", opacity: 0.25,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: 24 }}>
          <span>gov.api.blackroad.io · ledger.blackroad.systems</span>
          <span>Events: append-only · POL-005 enforced</span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <span>K(t) = C(t) · e^(λ|δ_t|)</span>
          <span>ÛĈL̂ = iI → Ŝ = iI</span>
          <Ticker />
        </div>
      </div>

      {/* Bottom grad rule */}
      <div style={{ height: 2, background: GRAD, flexShrink: 0 }} />
    </div>
  );
}
