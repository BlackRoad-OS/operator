import { useState, useEffect } from "react";

const KEYFRAMES = `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@700&display=swap'); @keyframes br-gradShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} } @keyframes br-pulse     { 0%,100%{transform:scale(1)} 50%{transform:scale(1.8)} } @keyframes br-cursor    { 0%,49%,100%{opacity:1} 50%,99%{opacity:0} } @keyframes br-blink     { 0%,49%,100%{opacity:0.5} 50%,99%{opacity:0} }`;

const GRAD = "linear-gradient(90deg,#FF8400,#FF4400,#FF0066,#CC00AA,#8800FF,#0066FF,#2233CC)";
const MONO = "'JetBrains Mono',monospace";
const DISP = "'Space Grotesk',sans-serif";

const FS = {
  id: "root", name: "/", type: "dir", children: [
    { id: "agents", name: "agents", type: "dir", children: [
      { id: "cecilia", name: "cecilia", type: "dir", children: [
        { id: "c-mem", name: "memory.sha∞", type: "file", size: "14.2 MB", ext: "sha∞", color: "#FF8400", modified: "2 min ago" },
        { id: "c-cfg", name: "config.json", type: "file", size: "4 KB", ext: "json", color: "#0066FF", modified: "1 hr ago" },
        { id: "c-log", name: "events.log", type: "file", size: "2.1 MB", ext: "log", color: "#8800FF", modified: "10 sec ago" },
      ]},
      { id: "lucidia", name: "lucidia", type: "dir", children: [
        { id: "l-mem", name: "memory.sha∞", type: "file", size: "8.7 MB", ext: "sha∞", color: "#FF8400", modified: "5 min ago" },
        { id: "l-mod", name: "model.bin", type: "file", size: "3.2 GB", ext: "bin", color: "#FF0066", modified: "2 days ago" },
      ]},
      { id: "atlas", name: "atlas", type: "dir", children: [
        { id: "a-mem", name: "memory.sha∞", type: "file", size: "3.1 MB", ext: "sha∞", color: "#FF8400", modified: "12 min ago" },
      ]},
    ]},
    { id: "os", name: "os", type: "dir", children: [
      { id: "kernel", name: "kernel", type: "dir", children: [
        { id: "k-z", name: "z-framework.rs", type: "file", size: "88 KB", ext: "rs", color: "#FF0066", modified: "3 days ago" },
        { id: "k-tri", name: "trinary-logic.rs", type: "file", size: "44 KB", ext: "rs", color: "#FF0066", modified: "3 days ago" },
        { id: "k-pauli", name: "pauli-model.rs", type: "file", size: "120 KB", ext: "rs", color: "#FF0066", modified: "1 day ago" },
      ]},
      { id: "policies", name: "policies", type: "dir", children: [
        { id: "p-user", name: "user.policy.json", type: "file", size: "12 KB", ext: "json", color: "#0066FF", modified: "2 hrs ago" },
        { id: "p-agent", name: "agent.policy.json", type: "file", size: "28 KB", ext: "json", color: "#0066FF", modified: "1 hr ago" },
      ]},
      { id: "ledger", name: "ledger.db", type: "file", size: "1.4 GB", ext: "db", color: "#CC00AA", modified: "1 sec ago" },
    ]},
    { id: "apps", name: "apps", type: "dir", children: [
      { id: "lucidia-app", name: "lucidia", type: "dir", children: [
        { id: "la-pkg", name: "package.json", type: "file", size: "2 KB", ext: "json", color: "#0066FF", modified: "1 day ago" },
        { id: "la-ts", name: "index.ts", type: "file", size: "340 KB", ext: "ts", color: "#FF8400", modified: "4 hrs ago" },
      ]},
      { id: "roadwork", name: "roadwork", type: "dir", children: [
        { id: "rw-ts", name: "index.ts", type: "file", size: "180 KB", ext: "ts", color: "#FF8400", modified: "6 hrs ago" },
      ]},
    ]},
    { id: "data", name: "data", type: "dir", children: [
      { id: "vectors", name: "vectors.milvus", type: "file", size: "892 MB", ext: "milvus", color: "#8800FF", modified: "30 sec ago" },
      { id: "cache", name: "cache.redis", type: "file", size: "240 MB", ext: "redis", color: "#FF4400", modified: "now" },
      { id: "objects", name: "objects", type: "dir", children: [
        { id: "o-r2", name: "blackroad-r2.bucket", type: "file", size: "2.4 TB", ext: "bucket", color: "#0066FF", modified: "5 min ago" },
      ]},
    ]},
    { id: "equations", name: "equations", type: "dir", children: [
      { id: "eq-1", name: "EQUATIONS.md", type: "file", size: "84 KB", ext: "md", color: "#FF0066", modified: "Dec 21" },
      { id: "eq-2", name: "EQUATIONS-II.md", type: "file", size: "96 KB", ext: "md", color: "#FF0066", modified: "Dec 21" },
      { id: "eq-3", name: "FOUNDATIONS.md", type: "file", size: "128 KB", ext: "md", color: "#FF0066", modified: "Dec 21" },
      { id: "eq-4", name: "PSI-PI-Q.md", type: "file", size: "44 KB", ext: "md", color: "#FF0066", modified: "Dec 21" },
    ]},
  ],
};

const EXT_COLOR: Record<string, string> = {
  "sha∞": "#FF8400", "json": "#0066FF", "log": "#8800FF", "bin": "#FF0066",
  "rs": "#FF0066", "ts": "#FF8400", "md": "#FF0066", "db": "#CC00AA",
  "milvus": "#8800FF", "redis": "#FF4400", "bucket": "#0066FF",
  "default": "rgba(255,255,255,.4)",
};

const getColor = (ext: string) => EXT_COLOR[ext] || EXT_COLOR.default;

interface FSNode {
  id: string;
  name: string;
  type: "dir" | "file";
  children?: FSNode[];
  size?: string;
  ext?: string;
  color?: string;
  modified?: string;
}

interface TermLine {
  t: string;
  v: string;
}

const GradBar = ({ h = 3 }: { h?: number }) => (
  <div style={{ height: h, background: GRAD, backgroundSize: "300%", animation: "br-gradShift 5s ease infinite", flexShrink: 0 }} />
);

function TreeNode({
  node, depth = 0, selected, onSelect, expanded, onToggle,
}: {
  node: FSNode; depth?: number; selected: string | null;
  onSelect: (n: FSNode) => void; expanded: Set<string>; onToggle: (id: string) => void;
}) {
  const isDir = node.type === "dir";
  const isExp = expanded.has(node.id);
  const isSel = selected === node.id;
  const color = isDir ? "rgba(255,255,255,.55)" : getColor(node.ext || "");

  return (
    <div>
      <div
        onClick={() => { onSelect(node); if (isDir) onToggle(node.id); }}
        style={{
          display: "flex", alignItems: "center", gap: 6, padding: "4px 0 4px",
          paddingLeft: 8 + depth * 16, cursor: "pointer",
          background: isSel ? "rgba(255,255,255,.05)" : "transparent",
          borderLeft: isSel ? "2px solid #fff" : "2px solid transparent",
          transition: "background .1s",
        }}
      >
        <span style={{ fontSize: 9, opacity: .4, flexShrink: 0, width: 10 }}>{isDir ? (isExp ? "▾" : "▸") : "·"}</span>
        <span style={{ fontSize: 9, color, flexShrink: 0 }}>{isDir ? "◧" : "◈"}</span>
        <span style={{ fontFamily: MONO, fontSize: 10, opacity: isSel ? 1 : .65, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{node.name}</span>
        {!isDir && <span style={{ fontFamily: MONO, fontSize: 8, opacity: .2, marginLeft: "auto", paddingRight: 8, whiteSpace: "nowrap" }}>{node.size}</span>}
      </div>
      {isDir && isExp && node.children && node.children.map(child => (
        <TreeNode key={child.id} node={child} depth={depth + 1} selected={selected} onSelect={onSelect} expanded={expanded} onToggle={onToggle} />
      ))}
    </div>
  );
}

const flatten = (node: FSNode, acc: FSNode[] = []): FSNode[] => {
  acc.push(node);
  if (node.children) node.children.forEach(c => flatten(c, acc));
  return acc;
};
const allNodes = flatten(FS);

export default function FileSystem() {
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(new Set(["root", "agents", "os", "apps", "data"]));
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("$ _");
  const [termLines, setTermLines] = useState<TermLine[]>([
    { t: "system", v: "BlackRoad OS v1.0 — File System" },
    { t: "info", v: "Mounted: /agents /os /apps /data /equations" },
    { t: "ok", v: "PS-SHA∞ integrity: verified · 14,821 commits" },
    { t: "prompt", v: "$ ready" },
  ]);

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = KEYFRAMES;
    document.head.appendChild(el);
    return () => { document.head.removeChild(el); };
  }, []);

  const toggle = (id: string) => setExpanded(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const select = (node: FSNode) => {
    setSelected(node.id);
    if (node.type === "file") {
      setTermLines(p => [
        ...p.slice(-8),
        { t: "prompt", v: `$ cat ${node.name}` },
        { t: "info", v: `→ ${node.size} · modified ${node.modified} · ext: ${node.ext}` },
      ]);
    }
  };

  const searchResults = search.length > 1
    ? allNodes.filter(n => n.name.toLowerCase().includes(search.toLowerCase())).slice(0, 12)
    : [];
  const selNode = allNodes.find(n => n.id === selected);

  const handleTermKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const cmd = term.replace("$ ", "").trim();
      let resp: TermLine = { t: "error", v: `command not found: ${cmd}` };
      if (cmd === "ls") resp = { t: "info", v: "agents  os  apps  data  equations" };
      else if (cmd === "pwd") resp = { t: "info", v: "/blackroad/root" };
      else if (cmd.startsWith("cd ")) resp = { t: "ok", v: `→ ${cmd.replace("cd ", "")}` };
      else if (cmd === "help") resp = { t: "info", v: "ls  pwd  cd <dir>  cat <file>  clear" };
      else if (cmd === "clear") { setTermLines([]); setTerm("$ _"); return; }
      setTermLines(p => [...p.slice(-10), { t: "prompt", v: `$ ${cmd}` }, resp]);
      setTerm("$ _");
    } else if (e.key === "Backspace") {
      setTerm(p => p.length > 2 ? p.slice(0, -1) : "$ _");
    } else if (e.key.length === 1) {
      setTerm(p => (p === "$ _" ? "$ " : p.slice(0, -1)) + e.key + "_");
    }
  };

  return (
    <div style={{ background: "#000", color: "#fff", height: "100vh", display: "flex", flexDirection: "column", fontFamily: MONO, overflow: "hidden" }}>
      <GradBar />

      {/* TOP BAR */}
      <div style={{ height: 40, borderBottom: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", padding: "0 16px", gap: 16, flexShrink: 0 }}>
        <span style={{ fontFamily: DISP, fontSize: 12, fontWeight: 700 }}>BlackRoad</span>
        <span style={{ fontSize: 8, opacity: .2 }}>·</span>
        <span style={{ fontSize: 9, opacity: .4 }}>File System</span>
        <div style={{ flex: 1 }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="⌕  find file…" style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,.5)", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", padding: "4px 10px", width: 180, outline: "none", height: 26 }} />
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* TREE */}
        <div style={{ width: 240, borderRight: "1px solid rgba(255,255,255,.08)", overflow: "auto", flexShrink: 0 }}>
          <div style={{ padding: "10px 8px 4px", fontSize: 8, opacity: .2, letterSpacing: "0.14em", textTransform: "uppercase" }}>Explorer</div>
          {search.length > 1 ? (
            searchResults.length > 0 ? searchResults.map(n => (
              <div key={n.id} onClick={() => select(n)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", cursor: "pointer", background: selected === n.id ? "rgba(255,255,255,.05)" : "transparent" }}>
                <span style={{ fontSize: 9, color: n.type === "dir" ? "rgba(255,255,255,.55)" : getColor(n.ext || ""), flexShrink: 0 }}>{n.type === "dir" ? "◧" : "◈"}</span>
                <span style={{ fontFamily: MONO, fontSize: 9, opacity: .7 }}>{n.name}</span>
                {n.size && <span style={{ fontSize: 8, opacity: .2, marginLeft: "auto" }}>{n.size}</span>}
              </div>
            )) : <div style={{ padding: "12px 10px", fontSize: 9, opacity: .3 }}>no results</div>
          ) : (
            <TreeNode node={FS} depth={0} selected={selected} onSelect={select} expanded={expanded} onToggle={toggle} />
          )}
        </div>

        {/* CENTER — detail */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* breadcrumb */}
          <div style={{ height: 32, borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", padding: "0 16px", gap: 0, flexShrink: 0 }}>
            {selNode ? (
              <span style={{ fontSize: 9, opacity: .3, fontFamily: MONO }}>/blackroad/{selNode.name}</span>
            ) : <span style={{ fontSize: 9, opacity: .18 }}>select a file or folder</span>}
          </div>

          {/* detail panel */}
          <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
            {selNode ? (
              <div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 28 }}>
                  <div style={{ fontSize: "2.5rem", opacity: .4 }}>{selNode.type === "dir" ? "◧" : "◈"}</div>
                  <div>
                    <div style={{ fontFamily: DISP, fontSize: "1.4rem", fontWeight: 700, marginBottom: 6 }}>{selNode.name}</div>
                    <div style={{ fontSize: 9, opacity: .28, letterSpacing: "0.1em", textTransform: "uppercase" }}>{selNode.type === "dir" ? "Directory" : "File · ." + selNode.ext}</div>
                  </div>
                </div>
                <table style={{ borderCollapse: "collapse", width: "100%" }}>
                  <tbody>
                    {[
                      ["Type", selNode.type === "dir" ? "Directory" : "File"],
                      ...(selNode.size ? [["Size", selNode.size]] : []),
                      ...(selNode.ext ? [["Extension", "." + selNode.ext]] : []),
                      ...(selNode.modified ? [["Modified", selNode.modified]] : []),
                      ...(selNode.color ? [["Accent", selNode.color]] : []),
                      ...(selNode.children ? [["Children", selNode.children.length + " items"]] : []),
                    ].map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                        <td style={{ fontFamily: MONO, fontSize: 9, opacity: .28, padding: "10px 0", paddingRight: 24, width: 120, whiteSpace: "nowrap" }}>{k}</td>
                        <td style={{ fontFamily: MONO, fontSize: 10, opacity: .7, padding: "10px 0" }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {selNode.type === "file" && (
                  <div style={{ marginTop: 20, border: "1px solid rgba(255,255,255,.07)", padding: "16px" }}>
                    <div style={{ fontSize: 8, opacity: .2, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Preview</div>
                    <div style={{ fontSize: 10, opacity: .3, lineHeight: 1.9 }}>
                      {selNode.ext === "sha∞" && <>
                        <div>{"SHA∞://cecilia/0x4FA2B9..."}</div>
                        <div>{"commit: 2025-12-21T22:14:07Z"}</div>
                        <div>{"truth_state: +1 (verified)"}</div>
                        <div>{"K(t): 0.94 · δ: 2"}</div>
                      </>}
                      {selNode.ext === "json" && <>
                        <div>{"{"}</div>
                        <div>&nbsp;&nbsp;{'"id": "cecilia",'}</div>
                        <div>&nbsp;&nbsp;{'"version": "1.0",'}</div>
                        <div>&nbsp;&nbsp;{'"trinary": true'}</div>
                        <div>{"}"}</div>
                      </>}
                      {selNode.ext === "rs" && <>
                        <div>{"pub fn z_framework(x: f64, y: f64, w: f64) -> f64 {"}</div>
                        <div>&nbsp;&nbsp;{"y * x - w // Z := yx − w"}</div>
                        <div>{"}"}</div>
                      </>}
                      {selNode.ext === "md" && <>
                        <div>{"# A34 — Z-Framework"}</div>
                        <div>{"Z := yx - w"}</div>
                        <div>{"Z = ∅ → Equilibrium"}</div>
                        <div>{"Z ≠ ∅ → System must ADAPT"}</div>
                      </>}
                      {!["sha∞", "json", "rs", "md"].includes(selNode.ext || "") && <div style={{ opacity: .2 }}>binary · {selNode.size}</div>}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
                <div style={{ fontSize: "2rem", opacity: .1 }}>◧</div>
                <div style={{ fontSize: 10, opacity: .2 }}>select a file or folder</div>
              </div>
            )}
          </div>

          {/* TERMINAL */}
          <div style={{ height: 180, borderTop: "1px solid rgba(255,255,255,.08)", background: "rgba(0,0,0,.8)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ padding: "6px 12px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#FF8400" }} />
              <span style={{ fontSize: 8, opacity: .3 }}>terminal · blackroad os</span>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "8px 12px" }}>
              {termLines.map((l, i) => (
                <div key={i} style={{ fontFamily: MONO, fontSize: 9, lineHeight: 1.8, opacity: l.t === "error" ? .45 : .35, color: l.t === "ok" ? "rgba(255,255,255,.8)" : l.t === "error" ? "#FF0066" : "inherit" }}>{l.v}</div>
              ))}
            </div>
            <div style={{ padding: "4px 12px 8px", borderTop: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center" }}>
              <div tabIndex={0} onKeyDown={handleTermKey} style={{ fontFamily: MONO, fontSize: 9, outline: "none", cursor: "text", display: "flex", alignItems: "center", gap: 0 }}>
                <span style={{ opacity: .5 }}>{term.slice(0, -1)}</span>
                <span style={{ animation: "br-cursor 0.8s step-end infinite", opacity: .8 }}>█</span>
              </div>
              <div style={{ fontSize: 8, opacity: .2, marginLeft: "auto" }}>type · enter · backspace</div>
            </div>
          </div>
        </div>

        {/* RIGHT — quick stats */}
        <div style={{ width: 180, borderLeft: "1px solid rgba(255,255,255,.08)", padding: "16px 14px", flexShrink: 0, overflow: "auto" }}>
          <div style={{ fontSize: 8, opacity: .22, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Disk Usage</div>
          {[
            { label: "Agents", val: "24.3 MB", pct: 8, color: "#FF8400" },
            { label: "OS Core", val: "1.5 GB", pct: 22, color: "#FF0066" },
            { label: "Apps", val: "3.8 GB", pct: 38, color: "#0066FF" },
            { label: "Data", val: "3.6 TB", pct: 82, color: "#8800FF" },
            { label: "Equations", val: "352 KB", pct: 1, color: "#CC00AA" },
          ].map(s => (
            <div key={s.label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 8, opacity: .3 }}>{s.label}</span>
                <span style={{ fontSize: 8, opacity: .4, fontFamily: MONO }}>{s.val}</span>
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,.07)" }}>
                <div style={{ height: "100%", background: s.color, width: `${s.pct}%`, transition: "width 1s ease" }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 20, fontSize: 8, opacity: .22, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Health</div>
          {[
            { l: "SHA∞ integrity", v: "✓" },
            { l: "DB connections", v: "3/10" },
            { l: "Vector index", v: "synced" },
            { l: "Cache hit", v: "94.2%" },
          ].map(h => (
            <div key={h.l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 8, opacity: .28 }}>{h.l}</span>
              <span style={{ fontFamily: MONO, fontSize: 8, opacity: .5 }}>{h.v}</span>
            </div>
          ))}
        </div>
      </div>

      <GradBar />
    </div>
  );
}
