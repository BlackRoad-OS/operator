import { useState, useEffect, useRef, useCallback } from "react";

const FS = {
  "~": {
    type: "dir",
    children: {
      blackroad: {
        type: "dir",
        children: {
          agents: {
            type: "dir",
            children: {
              "cecilia.json": { type: "file", content: '{\n  "name": "Cecilia",\n  "id": "agent-001",\n  "role": "Core AI",\n  "status": "active"\n}' },
              "alice.json":   { type: "file", content: '{\n  "name": "Alice",\n  "id": "agent-002",\n  "role": "Gateway",\n  "status": "active"\n}' },
              "cadence.json": { type: "file", content: '{\n  "name": "Cadence",\n  "id": "agent-003",\n  "role": "Music AI",\n  "status": "processing"\n}' },
              "eve.json":     { type: "file", content: '{\n  "name": "Eve",\n  "id": "agent-004",\n  "role": "Alert Monitor",\n  "status": "alert"\n}' },
            },
          },
          src: {
            type: "dir",
            children: {
              "main.py":        { type: "file", content: "# BlackRoad OS\nimport asyncio\n\nasync def main():\n    print('BlackRoad OS online')\n\nasyncio.run(main())" },
              "z_framework.py": { type: "file", content: "# Z := yx - w\ndef z_check(x, y, w):\n    Z = y * x - w\n    return 'EQUILIBRIUM' if Z == 0 else f'ADAPT gap={Z}'" },
            },
          },
          "config.yaml": { type: "file", content: "session: blackroad-0\nagents:\n  target: 1000\n  active: 4\ninfra:\n  dns: cloudflare\n  compute: railway+k3s" },
          "README.md":   { type: "file", content: "# BlackRoad OS\nDistributed AI operating system.\n\n## Mission\n1,000 agents · community over extraction\nZ := yx - w · PS-SHA∞ memory" },
        },
      },
      ".bashrc":    { type: "file", content: "export BR_SESSION=blackroad-0\nexport BR_API=api.blackroad.io" },
      ".tmux.conf": { type: "file", content: "set -g prefix C-b\nset -g mouse on\nset -g status-bg black" },
    },
  },
};

function fsNode(path, cwd) {
  if (!path || path === "." || path === "~") return FS["~"];
  const base = path.startsWith("~")
    ? path.slice(2)
    : path.startsWith("/")
      ? path.slice(1)
      : (cwd.replace("~", "").replace(/^\//, "") + "/" + path);
  let node = FS["~"];
  for (const p of base.split("/").filter(Boolean)) {
    if (!node.children?.[p]) return null;
    node = node.children[p];
  }
  return node;
}

let _pid = 0;
function mkPane(cwd) {
  return { id: ++_pid, cwd: cwd || "~/blackroad", hist: [], histIdx: -1 };
}

// ── SINGLE TERMINAL PANE ──
function Terminal({ pane, active, onFocus, onCwdChange }) {
  const [lines, setLines] = useState([]);
  const [input, setInput] = useState("");
  const [histIdx, setHistIdx] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [cwd, setCwd] = useState(pane.cwd);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setLines([
      { t: "BlackRoad OS · tmux 3.4 · Ctrl+B then ? for help", d: true },
      { t: "" },
    ]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [lines]);

  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active]);

  const push = useCallback((text, style) => {
    const arr = typeof text === "string" ? text.split("\n") : text;
    setLines((l) => [...l, ...arr.map((t) => ({ t, style }))]);
  }, []);

  const handleSubmit = useCallback(async () => {
    const cmd = input.trim();
    setInput("");
    setHistIdx(-1);

    push(`${cwd} $ ${cmd}`, "dim");

    if (!cmd) return;
    pane.hist.unshift(cmd);

    setBusy(true);
    await execCmd(cmd, cwd, push, (newCwd) => {
      setCwd(newCwd);
      onCwdChange?.(pane.id, newCwd);
    });
    setBusy(false);
  }, [input, cwd, push, pane, onCwdChange]);

  const handleKey = useCallback((e) => {
    if (e.key === "Enter") { handleSubmit(); return; }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = Math.min(histIdx + 1, pane.hist.length - 1);
      setHistIdx(idx);
      setInput(pane.hist[idx] || "");
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const idx = Math.max(histIdx - 1, -1);
      setHistIdx(idx);
      setInput(idx >= 0 ? pane.hist[idx] : "");
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const cmds = ["ls","cd","cat","pwd","clear","echo","agents","status","neofetch","run","whoami","date","help","mkdir","touch"];
      const match = cmds.find((c) => c.startsWith(input) && c !== input);
      if (match) setInput(match);
    }
    if (e.key === "l" && e.ctrlKey) { e.preventDefault(); setLines([]); }
    if (e.key === "c" && e.ctrlKey) { e.preventDefault(); push("^C", "dim"); setInput(""); }
  }, [handleSubmit, histIdx, input, pane.hist, push]);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "#000",
        minHeight: 0,
        minWidth: 0,
        border: active ? "1px solid #fff" : "1px solid #222",
        overflow: "hidden",
      }}
      onClick={() => { onFocus(); inputRef.current?.focus(); }}
    >
      {/* Pane bar */}
      <div style={{
        height: 20,
        display: "flex",
        alignItems: "center",
        padding: "0 8px",
        gap: 8,
        background: active ? "#111" : "#000",
        borderBottom: "1px solid #222",
        flexShrink: 0,
        fontFamily: "monospace",
        fontSize: 11,
      }}>
        <span style={{ color: active ? "#fff" : "#444", letterSpacing: "0.15em", textTransform: "uppercase" }}>bash</span>
        <span style={{ color: active ? "#888" : "#333" }}>{cwd}</span>
        <span style={{ marginLeft: "auto", color: "#333" }}>#{pane.id}</span>
      </div>

      {/* Output */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "6px 10px",
        fontFamily: "monospace",
        fontSize: 12,
        lineHeight: 1.6,
        background: "#000",
        color: "#fff",
        minHeight: 0,
      }}>
        {lines.map((l, i) => (
          <div key={i} style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            color: l.dim ? "#555" : l.style === "dim" ? "#555" : l.style === "err" ? "#888" : "#fff",
            opacity: l.style === "dim" ? 0.5 : 1,
          }}>
            {l.t}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "4px 10px",
        background: "#000",
        borderTop: "1px solid #111",
        flexShrink: 0,
        fontFamily: "monospace",
        fontSize: 12,
      }}>
        <span style={{ color: "#fff", whiteSpace: "nowrap", marginRight: 4 }}>
          {cwd} $
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={busy}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#fff",
            fontFamily: "monospace",
            fontSize: 12,
            caretColor: "#fff",
            opacity: busy ? 0.4 : 1,
          }}
        />
      </div>
    </div>
  );
}

// ── COMMAND HANDLER ──
async function execCmd(raw, cwd, push, setCwd) {
  const args = raw.trim().split(/\s+/);
  const cmd = args[0];

  switch (cmd) {
    case "clear": push("\x1bc"); break;

    case "pwd": push(cwd); break;

    case "whoami": push("br (blackroad-user)"); break;

    case "date": push(new Date().toString()); break;

    case "echo": push(args.slice(1).join(" ")); break;

    case "ls": {
      const target = args[1]
        ? (args[1].startsWith("~") || args[1].startsWith("/") ? args[1] : cwd + "/" + args[1])
        : cwd;
      const node = fsNode(target, cwd);
      if (!node || node.type !== "dir") { push(`ls: ${args[1] || "."}: No such file or directory`, "err"); break; }
      const out = Object.entries(node.children)
        .map(([n, v]) => v.type === "dir" ? n + "/" : n)
        .join("  ");
      push(out || "(empty)");
      break;
    }

    case "cd": {
      const target = args[1] || "~";
      let newPath;
      if (target === "~" || !target) newPath = "~/blackroad";
      else if (target === "..") {
        const parts = cwd.split("/").filter(Boolean);
        parts.pop();
        newPath = parts.length ? parts.join("/") : "~";
      } else if (target.startsWith("~") || target.startsWith("/")) newPath = target;
      else newPath = cwd + "/" + target;
      const node = fsNode(newPath, cwd);
      if (!node || node.type !== "dir") { push(`bash: cd: ${target}: No such file or directory`, "err"); break; }
      setCwd(newPath);
      break;
    }

    case "cat": {
      if (!args[1]) { push("usage: cat [file]", "dim"); break; }
      const path = args[1].startsWith("~") || args[1].startsWith("/") ? args[1] : cwd + "/" + args[1];
      const node = fsNode(path, cwd);
      if (!node || node.type !== "file") { push(`cat: ${args[1]}: No such file or directory`, "err"); break; }
      push(node.content);
      break;
    }

    case "mkdir": {
      const par = fsNode(cwd, cwd);
      if (args[1] && par?.children) { par.children[args[1]] = { type: "dir", children: {} }; push(`created: ${args[1]}`); }
      else push("usage: mkdir [name]", "dim");
      break;
    }

    case "touch": {
      const par = fsNode(cwd, cwd);
      if (args[1] && par?.children) { par.children[args[1]] = { type: "file", content: "" }; }
      else push("usage: touch [name]", "dim");
      break;
    }

    case "agents": {
      push("── BlackRoad Agent Registry ──");
      push("");
      const agents = [
        { name: "Cecilia", id: "001", role: "Core AI",        status: "active"     },
        { name: "Alice",   id: "002", role: "Gateway",         status: "active"     },
        { name: "Cadence", id: "003", role: "Music AI",        status: "processing" },
        { name: "Eve",     id: "004", role: "Alert Monitor",   status: "alert"      },
        { name: "Olympia", id: "005", role: "Compute",         status: "offline"    },
      ];
      agents.forEach((a) => {
        const dot = a.status === "active" ? "●" : a.status === "alert" ? "▲" : a.status === "processing" ? "◉" : "○";
        push(`  ${dot} ${a.name.padEnd(10)} #${a.id}  ${a.role.padEnd(18)} ${a.status}`);
      });
      push("");
      push("4 / 1000 agents active · mesh: blackroad.network", "dim");
      break;
    }

    case "status": {
      push("── BlackRoad OS Status ──");
      push("");
      const svcs = [
        ["app.blackroad.io",          "online"  ],
        ["api.blackroad.io",          "online"  ],
        ["gov.api.blackroad.io",      "online"  ],
        ["ledger.blackroad.systems",  "online"  ],
        ["mesh.blackroad.network",    "online"  ],
        ["lucidia.earth",             "online"  ],
        ["roadchain.io",              "syncing" ],
        ["agents.blackroad.network",  "degraded"],
      ];
      svcs.forEach(([svc, st]) => {
        const dot = st === "online" ? "●" : st === "syncing" ? "◉" : "▲";
        push(`  ${dot} ${st.padEnd(10)} ${svc}`);
      });
      push("");
      push("uptime: 99.7% · region: na1 · k3s nodes: 3", "dim");
      break;
    }

    case "neofetch": {
      push("");
      push("  ██████╗ ██████╗  ██████╗ ███████╗");
      push("  ██╔══██╗██╔══██╗██╔═══██╗██╔════╝");
      push("  ██████╔╝██████╔╝██║   ██║███████╗");
      push("  ██╔══██╗██╔══██╗██║   ██║╚════██║");
      push("  ██████╔╝██║  ██║╚██████╔╝███████║");
      push("  ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝");
      push("");
      push("  OS:      BlackRoad OS v1.0");
      push("  Kernel:  Z-Framework 1.0");
      push("  Shell:   br-bash 5.2");
      push("  Agents:  4 / 1000 active");
      push("  Memory:  PS-SHA∞");
      push("  Theme:   Black & White");
      push("");
      break;
    }

    case "help": {
      push("── Commands ──────────────────────────────");
      push("  ls [path]          list directory");
      push("  cd [path]          change directory");
      push("  cat [file]         print file contents");
      push("  pwd / whoami / date / echo [text]");
      push("  clear              clear screen");
      push("  mkdir / touch");
      push("  agents             agent registry");
      push("  status             system health");
      push("  neofetch           system info");
      push("  run [lang] [code]  execute code");
      push("");
      push("  Ctrl+B then ? — tmux keybindings", "dim");
      break;
    }

    case "run": {
      if (!args[1]) { push("usage: run [language] [code...]", "dim"); break; }
      const lang = args[1];
      const code = args.slice(2).join(" ") || 'print("Hello from BlackRoad OS")';
      const versions = { python: "3.10.0", javascript: "18.15.0", typescript: "5.0.3", rust: "1.68.2", go: "1.16.2", bash: "5.2.0", ruby: "3.0.1", lua: "5.4.4" };
      push(`→ executing ${lang}...`, "dim");
      try {
        const res = await fetch("https://emkc.org/api/v2/piston/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: lang, version: versions[lang] || "0", files: [{ name: "main", content: code }] }),
        });
        const d = await res.json();
        if (d.run?.stdout) push(d.run.stdout.trimEnd());
        if (d.run?.stderr) push(d.run.stderr.trimEnd(), "err");
        push(`← exit ${d.run?.code ?? "?"}`, "dim");
      } catch {
        push("network error — check connection", "err");
      }
      break;
    }

    default:
      push(`bash: ${cmd}: command not found`, "err");
      push("try: help", "dim");
  }
}

// ── LAYOUT NODE (recursive) ──
function LayoutNode({ node, activePid, onFocus, onCwdChange }) {
  if (node.type === "leaf") {
    return (
      <Terminal
        pane={node.pane}
        active={node.pane.id === activePid}
        onFocus={() => onFocus(node.pane.id)}
        onCwdChange={onCwdChange}
      />
    );
  }

  const isH = node.type === "h";
  const divRef = useRef(null);
  const [ratio, setRatio] = useState(50);

  const onMouseDown = (e) => {
    e.preventDefault();
    const start = isH ? e.clientX : e.clientY;
    const container = divRef.current?.parentElement;
    if (!container) return;
    const totalSize = isH ? container.offsetWidth : container.offsetHeight;

    const onMove = (ev) => {
      const rect = container.getBoundingClientRect();
      const pos = isH ? ev.clientX - rect.left : ev.clientY - rect.top;
      const pct = Math.min(85, Math.max(15, (pos / totalSize) * 100));
      setRatio(pct);
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: isH ? "row" : "column", minHeight: 0, minWidth: 0 }}>
      <div style={{ [isH ? "width" : "height"]: ratio + "%", display: "flex", minHeight: 0, minWidth: 0 }}>
        <LayoutNode node={node.a} activePid={activePid} onFocus={onFocus} onCwdChange={onCwdChange} />
      </div>
      <div
        ref={divRef}
        onMouseDown={onMouseDown}
        style={{
          [isH ? "width" : "height"]: 4,
          background: "#1a1a1a",
          cursor: isH ? "col-resize" : "row-resize",
          flexShrink: 0,
          transition: "background 0.1s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#444")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#1a1a1a")}
      />
      <div style={{ flex: 1, display: "flex", minHeight: 0, minWidth: 0 }}>
        <LayoutNode node={node.b} activePid={activePid} onFocus={onFocus} onCwdChange={onCwdChange} />
      </div>
    </div>
  );
}

// ── HELP MODAL ──
function HelpModal({ onClose }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}
      onClick={onClose}
    >
      <div
        style={{ background: "#000", border: "1px solid #fff", maxWidth: 520, width: "90%", maxHeight: "80vh", overflowY: "auto", fontFamily: "monospace", fontSize: 12 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #222", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>BlackRoad tmux — Keybindings</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: "12px 16px" }}>
          {[
            { title: "Panes", rows: [
              ["Ctrl+B  %", "Split vertically (side by side)"],
              ['Ctrl+B  "', "Split horizontally (top/bottom)"],
              ["Ctrl+B  o", "Cycle to next pane"],
              ["Ctrl+B  ←↑→↓", "Navigate panes"],
              ["Ctrl+B  z", "Zoom / unzoom active pane"],
              ["Ctrl+B  x", "Close active pane"],
            ]},
            { title: "Windows", rows: [
              ["Ctrl+B  c", "New window"],
              ["Ctrl+B  n / p", "Next / previous window"],
              ["Ctrl+B  0–9", "Jump to window"],
              ["Ctrl+B  &", "Close window"],
            ]},
            { title: "Session", rows: [
              ["Ctrl+B  d", "Detach session"],
              ["Ctrl+B  $", "Rename session"],
              ["Ctrl+B  t", "Show clock"],
              ["Ctrl+B  ?", "This help"],
            ]},
          ].map(({ title, rows }) => (
            <div key={title} style={{ marginBottom: 14 }}>
              <div style={{ color: "#555", letterSpacing: "0.15em", textTransform: "uppercase", fontSize: 10, marginBottom: 6 }}>{title}</div>
              {rows.map(([k, d]) => (
                <div key={k} style={{ display: "flex", gap: 12, padding: "3px 0", borderBottom: "1px solid #111" }}>
                  <span style={{ minWidth: 140, color: "#fff", whiteSpace: "nowrap" }}>{k}</span>
                  <span style={{ color: "#555" }}>{d}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ROOT APP ──
export default function App() {
  const initPane = mkPane();
  const [windows, setWindows] = useState([
    { id: 1, name: "bash", layout: { type: "leaf", pane: initPane } },
  ]);
  const [winIdx, setWinIdx] = useState(0);
  const [activePid, setActivePid] = useState(initPane.id);
  const [prefix, setPrefix] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [clock, setClock] = useState("");
  const [sessionName, setSessionName] = useState("blackroad-0");
  const [detached, setDetached] = useState(false);
  const prefixRef = useRef(false);
  const prefixTimer = useRef(null);

  useEffect(() => {
    const tick = () => setClock(new Date().toTimeString().slice(0, 8));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  function allPanesInWin(idx) {
    const win = windows[idx ?? winIdx];
    if (!win) return [];
    const collect = (n) => n.type === "leaf" ? [n.pane] : [...collect(n.a), ...collect(n.b)];
    return collect(win.layout);
  }

  function setPfx(v) {
    prefixRef.current = v;
    setPrefix(v);
    if (prefixTimer.current) clearTimeout(prefixTimer.current);
    if (v) prefixTimer.current = setTimeout(() => setPfx(false), 2000);
  }

  function splitLayout(layout, targetId, dir) {
    if (layout.type === "leaf") {
      if (layout.pane.id !== targetId) return layout;
      const newPane = mkPane(layout.pane.cwd);
      setActivePid(newPane.id);
      return { type: dir, a: { type: "leaf", pane: layout.pane }, b: { type: "leaf", pane: newPane } };
    }
    return { ...layout, a: splitLayout(layout.a, targetId, dir), b: splitLayout(layout.b, targetId, dir) };
  }

  function removeFromLayout(layout, targetId) {
    if (layout.type === "leaf") return layout.pane.id === targetId ? null : layout;
    const newA = removeFromLayout(layout.a, targetId);
    const newB = removeFromLayout(layout.b, targetId);
    if (!newA) return newB;
    if (!newB) return newA;
    return { ...layout, a: newA, b: newB };
  }

  function nextPaneId(layout, currentId) {
    const collect = (n) => n.type === "leaf" ? [n.pane] : [...collect(n.a), ...collect(n.b)];
    const all = collect(layout);
    const i = all.findIndex((p) => p.id === currentId);
    return all[(i + 1) % all.length].id;
  }

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === "b") { e.preventDefault(); setPfx(true); return; }
      if (!prefixRef.current) return;
      setPfx(false);
      e.preventDefault();
      const k = e.key;
      const win = windows[winIdx];

      if (k === "%") {
        setWindows((ws) => ws.map((w, i) => i !== winIdx ? w : { ...w, layout: splitLayout(w.layout, activePid, "h") }));
      } else if (k === '"') {
        setWindows((ws) => ws.map((w, i) => i !== winIdx ? w : { ...w, layout: splitLayout(w.layout, activePid, "v") }));
      } else if (k === "x") {
        const all = allPanesInWin(winIdx);
        if (all.length <= 1) return;
        const newLayout = removeFromLayout(win.layout, activePid);
        const remaining = [];
        const col = (n) => n.type === "leaf" ? remaining.push(n.pane) : (col(n.a), col(n.b));
        col(newLayout);
        setActivePid(remaining[0].id);
        setWindows((ws) => ws.map((w, i) => i !== winIdx ? w : { ...w, layout: newLayout }));
      } else if (k === "o" || k === "ArrowRight" || k === "ArrowDown") {
        setActivePid(nextPaneId(win.layout, activePid));
      } else if (k === "ArrowLeft" || k === "ArrowUp") {
        const all = allPanesInWin(winIdx);
        const i = all.findIndex((p) => p.id === activePid);
        setActivePid(all[(i - 1 + all.length) % all.length].id);
      } else if (k === "c") {
        const p = mkPane();
        setWindows((ws) => [...ws, { id: Date.now(), name: ["bash","code","logs","agents","git","build"][ws.length % 6], layout: { type: "leaf", pane: p } }]);
        setWinIdx(windows.length);
        setActivePid(p.id);
      } else if (k === "n") {
        setWinIdx((i) => (i + 1) % windows.length);
      } else if (k === "p") {
        setWinIdx((i) => (i - 1 + windows.length) % windows.length);
      } else if (k === "&") {
        if (windows.length <= 1) return;
        setWindows((ws) => ws.filter((_, i) => i !== winIdx));
        setWinIdx((i) => Math.max(0, i - 1));
      } else if (k >= "0" && k <= "9") {
        const i = parseInt(k);
        if (i < windows.length) setWinIdx(i);
      } else if (k === "d") {
        setDetached(true);
      } else if (k === "$") {
        const n = prompt("Rename session:", sessionName);
        if (n) setSessionName(n);
      } else if (k === "t") {
        alert(new Date().toTimeString().slice(0, 8));
      } else if (k === "?") {
        setShowHelp(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [windows, winIdx, activePid, sessionName]);

  // Sync activePid when switching windows
  useEffect(() => {
    const all = allPanesInWin(winIdx);
    if (all.length && !all.find((p) => p.id === activePid)) {
      setActivePid(all[0].id);
    }
  }, [winIdx, windows]);

  const handleCwdChange = (paneId, newCwd) => {
    // just track — cwd lives in Terminal state
  };

  const win = windows[winIdx];
  const allPanes = allPanesInWin(winIdx);

  const mono = { fontFamily: "monospace" };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#000", color: "#fff", overflow: "hidden", ...mono }}>

      {/* Gradient top bar */}
      <div style={{ height: 2, background: "linear-gradient(90deg,#FF8400,#FF4400,#FF0066,#CC00AA,#8800FF,#0066FF,#2233CC)", flexShrink: 0 }} />

      {/* Top bar */}
      <div style={{ height: 26, display: "flex", alignItems: "center", padding: "0 12px", gap: 10, background: "#000", borderBottom: "1px solid #222", flexShrink: 0, fontSize: 11 }}>
        <span style={{ fontWeight: 700, letterSpacing: "-0.01em" }}>BlackRoad</span>
        <span style={{ color: "#333" }}>|</span>
        <span style={{ color: "#555" }}>session: {sessionName}</span>
        {prefix && <span style={{ background: "#fff", color: "#000", fontSize: 10, padding: "1px 6px", fontWeight: 700, letterSpacing: "0.08em" }}>PREFIX</span>}
        <span style={{ marginLeft: "auto", color: "#444", fontSize: 10 }}>{clock} · tmux 3.4</span>
      </div>

      {/* Window tabs */}
      <div style={{ height: 28, display: "flex", alignItems: "stretch", background: "#000", borderBottom: "1px solid #222", flexShrink: 0, overflowX: "auto" }}>
        {windows.map((w, i) => (
          <div
            key={w.id}
            onClick={() => setWinIdx(i)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "0 12px", cursor: "pointer", fontSize: 11,
              color: i === winIdx ? "#fff" : "#444",
              background: i === winIdx ? "#111" : "transparent",
              borderBottom: i === winIdx ? "2px solid #fff" : "2px solid transparent",
              borderRight: "1px solid #1a1a1a", whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            <span style={{ color: "#555", fontSize: 10 }}>{i + 1}</span>
            <span>{w.name}</span>
            {windows.length > 1 && (
              <span
                onClick={(e) => { e.stopPropagation(); setWindows((ws) => ws.filter((_, j) => j !== i)); setWinIdx((x) => Math.max(0, x - 1)); }}
                style={{ opacity: 0.3, fontSize: 12, marginLeft: 2 }}
              >✕</span>
            )}
          </div>
        ))}
        <div
          onClick={() => { const p = mkPane(); setWindows((ws) => [...ws, { id: Date.now(), name: "bash", layout: { type: "leaf", pane: p } }]); setWinIdx(windows.length); setActivePid(p.id); }}
          style={{ display: "flex", alignItems: "center", padding: "0 12px", cursor: "pointer", color: "#333", fontSize: 16 }}
        >+</div>
      </div>

      {/* Pane area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0, position: "relative", background: "#000" }}>
        {detached ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 700, opacity: 0.1 }}>[{sessionName}]</div>
            <div style={{ fontSize: 11, opacity: 0.3, letterSpacing: "0.15em", textTransform: "uppercase" }}>Session Detached</div>
            <div
              onClick={() => setDetached(false)}
              style={{ marginTop: 8, fontSize: 11, opacity: 0.2, cursor: "pointer", textDecoration: "underline" }}
            >click to reattach</div>
          </div>
        ) : (
          win && (
            <LayoutNode
              node={win.layout}
              activePid={activePid}
              onFocus={setActivePid}
              onCwdChange={handleCwdChange}
            />
          )
        )}
      </div>

      {/* Status bar */}
      <div style={{ height: 22, display: "flex", alignItems: "stretch", background: "#000", borderTop: "1px solid #222", flexShrink: 0, fontSize: 11 }}>
        <div style={{ width: 3, background: "linear-gradient(90deg,#FF8400,#FF4400,#FF0066,#CC00AA,#8800FF,#0066FF,#2233CC)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 10px", borderRight: "1px solid #222", color: "#fff" }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff" }} />
          {sessionName}
        </div>
        <div style={{ display: "flex", alignItems: "center", padding: "0 10px", borderRight: "1px solid #222", color: "#555" }}>
          {allPanes.length} pane{allPanes.length !== 1 ? "s" : ""}
        </div>
        <div style={{ display: "flex", alignItems: "center", padding: "0 10px", color: "#555" }}>Ctrl+B ? = help</div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", padding: "0 10px", borderLeft: "1px solid #222", color: "#fff" }}>
          {clock}
        </div>
        <div style={{ width: 3, background: "linear-gradient(90deg,#FF8400,#FF4400,#FF0066,#CC00AA,#8800FF,#0066FF,#2233CC)" }} />
      </div>

      {/* Gradient bottom bar */}
      <div style={{ height: 2, background: "linear-gradient(90deg,#FF8400,#FF4400,#FF0066,#CC00AA,#8800FF,#0066FF,#2233CC)", flexShrink: 0 }} />

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
