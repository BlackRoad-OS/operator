/**
 * BlackRoad Tmux — Terminal Emulator
 *
 * Minimal terminal interface styled after tmux.
 * Local command simulation — no real shell access from browser.
 */

import { useState, useRef, useEffect } from "react";

const M = { fontFamily: "monospace" };

const WELCOME = [
  "BlackRoad OS Terminal · tmux 3.4",
  "Type 'help' for available commands.",
  "",
];

const COMMANDS = {
  help: () => [
    "Available commands:",
    "  help      — Show this help message",
    "  clear     — Clear terminal",
    "  whoami    — Display current user",
    "  uname     — System information",
    "  uptime    — System uptime",
    "  date      — Current date/time",
    "  agents    — List registered agents",
    "  version   — BlackRoad OS version",
    "",
  ],
  whoami: () => ["operator@blackroad-0"],
  uname: () => ["BlackRoad OS 1.0.0 (blackroad-0) · offline-first kernel"],
  uptime: () => {
    const h = Math.floor(Math.random() * 720) + 24;
    return [`up ${h} hours, 1 user, load average: 0.12, 0.08, 0.04`];
  },
  date: () => [new Date().toString()],
  agents: () => [
    "AGENT          STATUS     VERSION",
    "lucidia        active     1.0.0",
    "operator       active     1.0.0",
    "cecilia        standby    0.9.0",
    "silas          standby    0.8.0",
  ],
  version: () => ["BlackRoad OS v1.0 · Build Dec 2025 · Delaware C-Corp"],
  clear: () => null,
};

export default function BlackroadTmux() {
  const [lines, setLines] = useState([...WELCOME]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const exec = (cmd) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setHistory((prev) => [trimmed, ...prev]);
    setHistIdx(-1);

    const prompt = `operator@blackroad-0:~$ ${trimmed}`;
    const handler = COMMANDS[trimmed.split(" ")[0]];

    if (trimmed === "clear") {
      setLines([]);
      return;
    }

    if (handler) {
      const result = handler(trimmed);
      setLines((prev) => [...prev, prompt, ...(result || []), ""]);
    } else {
      setLines((prev) => [
        ...prev,
        prompt,
        `command not found: ${trimmed.split(" ")[0]}`,
        "",
      ]);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") {
      exec(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const next = Math.min(histIdx + 1, history.length - 1);
        setHistIdx(next);
        setInput(history[next]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx > 0) {
        const next = histIdx - 1;
        setHistIdx(next);
        setInput(history[next]);
      } else {
        setHistIdx(-1);
        setInput("");
      }
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "#000",
        ...M,
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Header */}
      <div
        style={{
          padding: "6px 16px",
          borderBottom: "1px solid #1a1a1a",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 10,
          background: "#080808",
        }}
      >
        <span style={{ color: "#0f0", opacity: 0.6 }}>●</span>
        <span style={{ opacity: 0.4 }}>0:bash</span>
        <span style={{ opacity: 0.15, marginLeft: "auto" }}>
          tmux 3.4
        </span>
      </div>

      {/* Terminal output */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 12px",
          fontSize: 12,
          lineHeight: 1.5,
          color: "#ccc",
        }}
      >
        {lines.map((line, i) => (
          <div key={i} style={{ minHeight: 18 }}>
            {line}
          </div>
        ))}

        {/* Input line */}
        <div style={{ display: "flex", gap: 0 }}>
          <span style={{ color: "#0f0", opacity: 0.6 }}>
            operator@blackroad-0:~${" "}
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            autoFocus
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: 12,
              ...M,
              caretColor: "#0f0",
              padding: 0,
            }}
          />
        </div>
        <div ref={endRef} />
      </div>

      {/* Status bar */}
      <div
        style={{
          padding: "4px 12px",
          background: "#080808",
          borderTop: "1px solid #1a1a1a",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          opacity: 0.3,
        }}
      >
        <span>[0] 0:bash*</span>
        <span>&quot;blackroad-0&quot; {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
