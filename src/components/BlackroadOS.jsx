/**
 * BlackRoad OS — Main Shell
 *
 * Imports all tools and routes between them via sidebar nav.
 *
 * Usage:
 * Place all component files in the same directory:
 *   BlackroadOS.jsx      ← this file (root)
 *   LucidiaChat.jsx
 *   AgentDashboard.jsx
 *   StatusDashboard.jsx
 *   CodeRunner.jsx
 *   BlackroadTmux.jsx
 *   StyleGuide.jsx
 *
 * Then render: <BlackroadOS />
 */

import { useState, useEffect } from "react";
import LucidiaChat from "./LucidiaChat";
import AgentDashboard from "./AgentDashboard";
import StatusDashboard from "./StatusDashboard";
import CodeRunner from "./CodeRunner";
import BlackroadTmux from "./BlackroadTmux";
import StyleGuide from "./StyleGuide";

const GRAD = "linear-gradient(90deg,#FF8400,#FF4400,#FF0066,#CC00AA,#8800FF,#0066FF,#2233CC)";
const M = { fontFamily: "monospace" };

// ── NAV ITEMS ──
const NAV = [
  {
    section: "CORE",
    items: [
      { id: "lucidia", label: "Lucidia", sub: "AI Chat", icon: "◈" },
      { id: "agents", label: "Agents", sub: "Registry", icon: "◉" },
      { id: "status", label: "Status", sub: "System Health", icon: "●" },
    ],
  },
  {
    section: "TOOLS",
    items: [
      { id: "code", label: "Code", sub: "Runner", icon: "▶" },
      { id: "tmux", label: "Terminal", sub: "tmux 3.4", icon: ">" },
    ],
  },
  {
    section: "DOCS",
    items: [
      { id: "brand", label: "Brand", sub: "Style Guide", icon: "■" },
    ],
  },
];

const VIEWS = {
  lucidia: LucidiaChat,
  agents: AgentDashboard,
  status: StatusDashboard,
  code: CodeRunner,
  tmux: BlackroadTmux,
  brand: StyleGuide,
};

// ── NOTIFICATION DOT ──
const ALERTS = { status: true }; // status has degraded services

// ── STATUS DOT LIVE ──
function SystemDot() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setOn((v) => !v), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div
      style={{
        width: 5,
        height: 5,
        borderRadius: "50%",
        background: "#fff",
        opacity: on ? 1 : 0.3,
        transition: "opacity 0.4s",
      }}
    />
  );
}

// ── CLOCK ──
function Clock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => setT(new Date().toTimeString().slice(0, 8));
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);
  return (
    <span style={{ fontSize: 10, opacity: 0.25 }}>{t}</span>
  );
}

// ── SIDEBAR NAV ITEM ──
function NavItem({ item, active, onClick }) {
  const hasAlert = ALERTS[item.id];
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        background: active ? "#111" : "transparent",
        border: "none",
        borderLeft: active ? "2px solid #fff" : "2px solid transparent",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.1s",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "#080808";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: active ? "#fff" : "#444",
          width: 16,
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        {item.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            color: active ? "#fff" : "#555",
            fontWeight: active ? 600 : 400,
            ...M,
          }}
        >
          {item.label}
        </div>
        <div style={{ fontSize: 9, opacity: 0.3, ...M }}>{item.sub}</div>
      </div>
      {hasAlert && (
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#fff",
            opacity: 0.6,
            flexShrink: 0,
          }}
        />
      )}
    </button>
  );
}

// ── COMMAND PALETTE ──
function CommandPalette({ onSelect, onClose }) {
  const [q, setQ] = useState("");
  const all = NAV.flatMap((s) => s.items);
  const filtered = q
    ? all.filter(
        (i) =>
          i.label.toLowerCase().includes(q.toLowerCase()) ||
          i.sub.toLowerCase().includes(q.toLowerCase())
      )
    : all;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 80,
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#000",
          border: "1px solid #333",
          width: 480,
          maxWidth: "90%",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            borderBottom: "1px solid #1a1a1a",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ opacity: 0.3, fontSize: 12 }}>⌘</span>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && filtered[0]) {
                onSelect(filtered[0].id);
                onClose();
              }
            }}
            placeholder="Jump to…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontFamily: "monospace",
              fontSize: 13,
              caretColor: "#fff",
            }}
          />
        </div>
        <div style={{ maxHeight: 300, overflowY: "auto" }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onSelect(item.id);
                onClose();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                cursor: "pointer",
                borderBottom: "1px solid #0a0a0a",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#0d0d0d")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span
                style={{
                  fontSize: 13,
                  color: "#444",
                  width: 20,
                  textAlign: "center",
                }}
              >
                {item.icon}
              </span>
              <div>
                <div style={{ fontSize: 12, color: "#fff", ...M }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 10, opacity: 0.3, ...M }}>
                  {item.sub}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div
              style={{
                padding: 20,
                textAlign: "center",
                opacity: 0.2,
                fontSize: 12,
                ...M,
              }}
            >
              No results
            </div>
          )}
        </div>
        <div
          style={{
            padding: "6px 14px",
            borderTop: "1px solid #0a0a0a",
            fontSize: 10,
            opacity: 0.2,
            display: "flex",
            gap: 12,
            ...M,
          }}
        >
          <span>↵ open</span>
          <span>esc close</span>
          <span>⌘K toggle</span>
        </div>
      </div>
    </div>
  );
}

// ── BREADCRUMB ──
function Breadcrumb({ view }) {
  const all = NAV.flatMap((s) =>
    s.items.map((i) => ({ ...i, section: s.section }))
  );
  const item = all.find((i) => i.id === view);
  if (!item) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        opacity: 0.4,
      }}
    >
      <span>BlackRoad OS</span>
      <span>›</span>
      <span style={{ opacity: 0.5 }}>{item.section.toLowerCase()}</span>
      <span>›</span>
      <span style={{ color: "#fff", opacity: 1 }}>{item.label}</span>
    </div>
  );
}

// ── ROOT APP ──
export default function BlackroadOS() {
  const [view, setView] = useState("lucidia");
  const [collapsed, setCollapsed] = useState(false);
  const [palette, setPalette] = useState(false);

  // Cmd+K for command palette
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
      if (e.key === "Escape") setPalette(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const View =
    VIEWS[view] ||
    (() => (
      <div style={{ padding: 40, opacity: 0.3 }}>Not found</div>
    ));

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#000",
        color: "#fff",
        overflow: "hidden",
        ...M,
      }}
    >
      {/* Top gradient rule */}
      <div style={{ height: 2, background: GRAD, flexShrink: 0 }} />

      {/* Top bar */}
      <div
        style={{
          height: 42,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 12,
          background: "#000",
          borderBottom: "1px solid #1a1a1a",
          flexShrink: 0,
        }}
      >
        {/* Toggle sidebar */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          style={{
            background: "none",
            border: "none",
            color: "#555",
            cursor: "pointer",
            fontSize: 14,
            padding: "0 4px",
            lineHeight: 1,
          }}
        >
          ☰
        </button>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 3, height: 3, background: GRAD }} />
          <span
            style={{
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: "-0.01em",
            }}
          >
            BlackRoad OS
          </span>
        </div>

        {/* Breadcrumb */}
        <div style={{ marginLeft: 8 }}>
          <Breadcrumb view={view} />
        </div>

        {/* Command palette trigger */}
        <button
          onClick={() => setPalette(true)}
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "transparent",
            border: "1px solid #1a1a1a",
            color: "#555",
            fontFamily: "monospace",
            fontSize: 11,
            padding: "5px 12px",
            cursor: "pointer",
          }}
        >
          <span>⌘K</span>
          <span>Jump to…</span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SystemDot />
          <span style={{ fontSize: 10, opacity: 0.3 }}>blackroad-0</span>
          <span style={{ color: "#222" }}>·</span>
          <Clock />
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div
        style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}
      >
        {/* Sidebar */}
        {!collapsed && (
          <div
            style={{
              width: 180,
              display: "flex",
              flexDirection: "column",
              background: "#000",
              borderRight: "1px solid #1a1a1a",
              flexShrink: 0,
              overflowY: "auto",
            }}
          >
            {/* Nav sections */}
            {NAV.map((section) => (
              <div key={section.section}>
                <div
                  style={{
                    padding: "14px 12px 4px",
                    fontSize: 9,
                    opacity: 0.2,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                  }}
                >
                  {section.section}
                </div>
                {section.items.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    active={view === item.id}
                    onClick={() => setView(item.id)}
                  />
                ))}
              </div>
            ))}

            {/* Bottom info */}
            <div
              style={{
                marginTop: "auto",
                padding: "14px 12px",
                borderTop: "1px solid #0d0d0d",
              }}
            >
              <div style={{ fontSize: 9, opacity: 0.15, lineHeight: 1.8 }}>
                <div>v1.0 · Dec 2025</div>
                <div>Delaware C-Corp</div>
                <div style={{ marginTop: 4 }}>Z := yx − w</div>
                <div>K(t) = C(t)·e^(λ|δ|)</div>
              </div>
            </div>
          </div>
        )}

        {/* Main view */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <View />
        </div>
      </div>

      {/* Bottom gradient rule */}
      <div style={{ height: 2, background: GRAD, flexShrink: 0 }} />

      {/* Command palette */}
      {palette && (
        <CommandPalette
          onSelect={setView}
          onClose={() => setPalette(false)}
        />
      )}
    </div>
  );
}
