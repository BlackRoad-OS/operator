import { useState, useEffect, useRef } from "react";

const GRAD = "linear-gradient(90deg,#FF8400,#FF4400,#FF0066,#CC00AA,#8800FF,#0066FF,#2233CC)";
const M = { fontFamily: "monospace" };

const SERVICES = [
  { id:"app",      name:"app.blackroad.io",          layer:"Experience", status:"online",   latency:42,  rps:1240,  err:0.01 },
  { id:"api",      name:"api.blackroad.io",           layer:"Experience", status:"online",   latency:18,  rps:8830,  err:0.00 },
  { id:"ws",       name:"ws.blackroad.io",            layer:"Experience", status:"online",   latency:6,   rps:3310,  err:0.00 },
  { id:"gov",      name:"gov.api.blackroad.io",       layer:"Governance", status:"online",   latency:11,  rps:220,   err:0.02 },
  { id:"ledger",   name:"ledger.blackroad.systems",   layer:"Governance", status:"online",   latency:9,   rps:580,   err:0.00 },
  { id:"policies", name:"policies.blackroad.systems", layer:"Governance", status:"online",   latency:7,   rps:140,   err:0.00 },
  { id:"lucidia",  name:"lucidia.earth",              layer:"Experience", status:"online",   latency:88,  rps:4400,  err:0.05 },
  { id:"mesh",     name:"mesh.blackroad.network",     layer:"Mesh",       status:"online",   latency:22,  rps:18200, err:0.03 },
  { id:"agents",   name:"agents.blackroad.network",   layer:"Mesh",       status:"degraded", latency:340, rps:902,   err:1.24 },
  { id:"db",       name:"db.blackroad.systems",       layer:"Infra",      status:"online",   latency:4,   rps:11200, err:0.00 },
  { id:"cache",    name:"cache.blackroad.systems",    layer:"Infra",      status:"online",   latency:1,   rps:48000, err:0.00 },
  { id:"vectors",  name:"vectors.blackroad.systems",  layer:"Infra",      status:"online",   latency:28,  rps:340,   err:0.00 },
  { id:"chain",    name:"roadchain.io",               layer:"Product",    status:"syncing",  latency:210, rps:88,    err:0.44 },
  { id:"roadcoin", name:"roadcoin.io",                layer:"Product",    status:"online",   latency:55,  rps:320,   err:0.02 },
  { id:"studio",   name:"lucidia.studio",             layer:"Experience", status:"online",   latency:64,  rps:1100,  err:0.07 },
  { id:"cdn",      name:"cdn.blackroad.io",           layer:"Infra",      status:"online",   latency:8,   rps:92000, err:0.00 },
];

const LOG_TEMPLATES = [
  (ts) => `${ts} INFO  [gov]     policy:evaluate → allow · user:4821 action:read`,
  (ts) => `${ts} INFO  [ledger]  event:recorded · intent:8823aa · actor:cecilia-001`,
  (ts) => `${ts} INFO  [mesh]    agent:heartbeat · node:agent-014.agents.blackroad.network`,
  (ts) => `${ts} INFO  [api]     GET /v1/agents → 200 · 18ms`,
  (ts) => `${ts} DEBUG [cache]   cache:hit · key:session:4821 · ttl:3480s`,
  (ts) => `${ts} INFO  [app]     user:login · id:4821 · region:na1`,
  (ts) => `${ts} WARN  [agents]  agent-087 latency spike · 340ms`,
  (ts) => `${ts} INFO  [chain]   block:syncing · height:44821 · peers:12`,
  (ts) => `${ts} INFO  [db]      query:ok · 4ms · table:ledger_events`,
  (ts) => `${ts} INFO  [lucidia] inference:complete · tokens:284 · agent:cecilia`,
  (ts) => `${ts} ERROR [agents]  agent-034 unhealthy · retrying (2/3)`,
  (ts) => `${ts} INFO  [ws]      socket:open · client:4821 · region:na1`,
  (ts) => `${ts} DEBUG [vectors] similarity:search · k:10 · 28ms`,
  (ts) => `${ts} INFO  [gov]     delegation:verified · actor:alice → resource:mesh`,
];

const LOG_COLORS = { INFO: "#fff", DEBUG: "#444", WARN: "#888", ERROR: "#666" };

function miniSparkline(seed, color) {
  const pts = Array.from({ length: 20 }, (_, i) => 20 + Math.abs(Math.sin((seed + i) * 0.8) * 18));
  const max = Math.max(...pts), min = Math.min(...pts);
  const norm = pts.map(p => ((p - min) / (max - min || 1)) * 20);
  const d = norm.map((v, i) => `${i === 0 ? "M" : "L"}${(i / 19) * 80},${20 - v}`).join(" ");
  return (
    <svg width={80} height={22} style={{ flexShrink: 0 }}>
      <polyline points={norm.map((v, i) => `${(i / 19) * 80},${22 - v}`).join(" ")} stroke={color} strokeWidth={1} fill="none" opacity={0.5} />
    </svg>
  );
}

const STATUS_COLOR = { online: "#fff", degraded: "#888", syncing: "#666", offline: "#333" };
const STATUS_DOT   = { online: "●", degraded: "▲", syncing: "◉", offline: "○" };

function ServiceRow({ svc, i }) {
  const col = STATUS_COLOR[svc.status] || "#333";
  const dot = STATUS_DOT[svc.status] || "○";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 16px", borderBottom: "1px solid #0a0a0a" }}>
      <span style={{ color: col, fontSize: 10, width: 10, flexShrink: 0 }}>{dot}</span>
      <div style={{ width: 230, flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.85 }}>{svc.name}</div>
        <div style={{ fontSize: 9, opacity: 0.25, marginTop: 1, textTransform: "uppercase", letterSpacing: "0.1em" }}>{svc.layer}</div>
      </div>
      <span style={{ fontSize: 11, opacity: 0.4, width: 70, flexShrink: 0 }}>{svc.latency}ms</span>
      <span style={{ fontSize: 11, opacity: 0.35, width: 70, flexShrink: 0 }}>{svc.rps.toLocaleString()} rps</span>
      <span style={{ fontSize: 11, opacity: svc.err > 0.5 ? 0.9 : 0.25, width: 55, flexShrink: 0, color: svc.err > 0.5 ? "#fff" : "inherit" }}>{svc.err.toFixed(2)}%</span>
      {miniSparkline(i * 4 + 1, col)}
    </div>
  );
}

function MetricCard({ label, value, unit, sub }) {
  return (
    <div style={{ flex: 1, padding: "16px 20px", borderRight: "1px solid #111" }}>
      <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{value}<span style={{ fontSize: 12, opacity: 0.4, marginLeft: 2 }}>{unit}</span></div>
      <div style={{ fontSize: 9, opacity: 0.3, letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, opacity: 0.2, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function StatusDashboard() {
  const [logs, setLogs] = useState([]);
  const [liveLog, setLiveLog] = useState(true);
  const [layerFilter, setLayerFilter] = useState("All");
  const [tick, setTick] = useState(0);
  const logRef = useRef(null);

  const layers = ["All", ...new Set(SERVICES.map(s => s.layer))];

  useEffect(() => {
    const now = new Date();
    const seed = Array.from({ length: 20 }, (_, i) => {
      const d = new Date(now - (20 - i) * 4000);
      const ts = d.toTimeString().slice(0, 8);
      const tpl = LOG_TEMPLATES[(i * 7) % LOG_TEMPLATES.length];
      const lvl = tpl(ts).match(/INFO|DEBUG|WARN|ERROR/)?.[0] || "INFO";
      return { id: i, text: tpl(ts), level: lvl, ts };
    });
    setLogs(seed);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setTick(n => n + 1);
      if (!liveLog) return;
      const now = new Date();
      const ts = now.toTimeString().slice(0, 8);
      const tpl = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
      const text = tpl(ts);
      const lvl = text.match(/INFO|DEBUG|WARN|ERROR/)?.[0] || "INFO";
      setLogs(prev => [...prev.slice(-200), { id: Date.now(), text, level: lvl, ts }]);
    }, 900);
    return () => clearInterval(t);
  }, [liveLog]);

  useEffect(() => {
    if (liveLog && logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs, liveLog]);

  const filtered = layerFilter === "All" ? SERVICES : SERVICES.filter(s => s.layer === layerFilter);
  const online = SERVICES.filter(s => s.status === "online").length;
  const degraded = SERVICES.filter(s => s.status !== "online").length;
  const totalRps = SERVICES.reduce((a, s) => a + s.rps, 0);
  const avgLatency = Math.round(SERVICES.reduce((a, s) => a + s.latency, 0) / SERVICES.length);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#000", color: "#fff", overflow: "hidden", ...M }}>

      {/* Metric strip */}
      <div style={{ display: "flex", borderBottom: "1px solid #111", flexShrink: 0 }}>
        <MetricCard label="Services Online" value={`${online}/${SERVICES.length}`} sub={`${degraded} degraded or syncing`} />
        <MetricCard label="Total RPS" value={(totalRps / 1000).toFixed(1)} unit="k" />
        <MetricCard label="Avg Latency" value={avgLatency} unit="ms" />
        <MetricCard label="Active Agents" value="847" sub="/ 1,000 target" />
        <MetricCard label="Ledger Events" value="44.8" unit="k" sub="last 24h" />
        <MetricCard label="Data Layer" value="99.99" unit="%" sub="uptime · 30d" />
      </div>

      {/* Gradient progress */}
      <div style={{ height: 2, background: "#0a0a0a", flexShrink: 0 }}>
        <div style={{ height: "100%", width: `${(online / SERVICES.length) * 100}%`, background: GRAD, transition: "width 1s" }} />
      </div>

      {/* Main split: services + logs */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* Services panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid #111", minWidth: 0, overflow: "hidden" }}>

          {/* Service toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderBottom: "1px solid #111", flexShrink: 0 }}>
            <span style={{ fontSize: 10, opacity: 0.3, letterSpacing: "0.15em", textTransform: "uppercase" }}>Services</span>
            <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
              {layers.map(l => (
                <button key={l} onClick={() => setLayerFilter(l)} style={{
                  background: layerFilter === l ? "#fff" : "transparent",
                  color: layerFilter === l ? "#000" : "#444",
                  border: layerFilter === l ? "none" : "1px solid #1a1a1a",
                  fontFamily: "monospace", fontSize: 10, padding: "2px 7px", cursor: "pointer",
                }}>{l}</button>
              ))}
            </div>
            <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.2 }}>{filtered.length} services</span>
          </div>

          {/* Column headers */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "5px 16px", borderBottom: "1px solid #0a0a0a", flexShrink: 0 }}>
            {[["", "10px"], ["Service / Layer", "230px"], ["Latency", "70px"], ["RPS", "70px"], ["Err%", "55px"], ["Trend", "80px"]].map(([l, w]) => (
              <span key={l} style={{ fontSize: 9, opacity: 0.2, letterSpacing: "0.15em", textTransform: "uppercase", width: w, flexShrink: 0 }}>{l}</span>
            ))}
          </div>

          {/* Service rows */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.map((svc, i) => <ServiceRow key={svc.id} svc={svc} i={i} />)}
          </div>
        </div>

        {/* Logs panel */}
        <div style={{ width: 420, display: "flex", flexDirection: "column", background: "#000", flexShrink: 0 }}>
          <div style={{ padding: "8px 14px", borderBottom: "1px solid #111", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 10, opacity: 0.3, letterSpacing: "0.15em", textTransform: "uppercase" }}>Live Log</span>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: liveLog ? "#fff" : "#333", animation: liveLog ? "lucidia-pulse 1.5s ease-in-out infinite" : "none" }} />
            <button
              onClick={() => setLiveLog(l => !l)}
              style={{ marginLeft: "auto", background: "transparent", border: "1px solid #222", color: "#555", fontFamily: "monospace", fontSize: 10, padding: "2px 7px", cursor: "pointer" }}
            >
              {liveLog ? "PAUSE" : "RESUME"}
            </button>
            <button
              onClick={() => setLogs([])}
              style={{ background: "transparent", border: "1px solid #222", color: "#444", fontFamily: "monospace", fontSize: 10, padding: "2px 7px", cursor: "pointer" }}
            >
              CLEAR
            </button>
          </div>
          <div ref={logRef} style={{ flex: 1, overflowY: "auto", padding: "6px 0", fontSize: 11, lineHeight: 1.6 }}>
            {logs.map(log => (
              <div key={log.id} style={{ padding: "2px 14px", color: LOG_COLORS[log.level] || "#fff", opacity: log.level === "DEBUG" ? 0.35 : log.level === "WARN" ? 0.65 : 1, fontFamily: "monospace", fontSize: 11, whiteSpace: "pre", overflow: "hidden", textOverflow: "ellipsis" }}>
                {log.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes lucidia-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.7)}}`}</style>
    </div>
  );
}
