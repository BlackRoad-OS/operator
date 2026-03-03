/**
 * Lucidia Chat — AI Chat Interface
 *
 * Local-first conversational UI for the Lucidia AI assistant.
 * No external telemetry or tracking. All data stays on-device.
 */

import { useState, useRef, useEffect } from "react";

const M = { fontFamily: "monospace" };

export default function LucidiaChat() {
  const [messages, setMessages] = useState([
    {
      role: "system",
      text: "Lucidia v1.0 · BlackRoad OS · Local inference ready.",
    },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text: trimmed },
      {
        role: "assistant",
        text: "Inference endpoint not connected. Configure a local model to enable responses.",
      },
    ]);
    setInput("");
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
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #1a1a1a",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 12, color: "#444" }}>◈</span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Lucidia</span>
        <span style={{ fontSize: 10, opacity: 0.3, marginLeft: 4 }}>
          AI Chat · offline
        </span>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 10,
              opacity: msg.role === "system" ? 0.3 : 1,
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: msg.role === "user" ? "#FF8400" : "#555",
                width: 12,
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              {msg.role === "user" ? "›" : msg.role === "system" ? "·" : "◈"}
            </span>
            <div style={{ fontSize: 12, lineHeight: 1.6, color: "#ccc" }}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "10px 16px",
          borderTop: "1px solid #1a1a1a",
          display: "flex",
          gap: 8,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="Message Lucidia…"
          style={{
            flex: 1,
            background: "transparent",
            border: "1px solid #1a1a1a",
            outline: "none",
            color: "#fff",
            padding: "8px 12px",
            fontSize: 12,
            ...M,
            caretColor: "#FF8400",
          }}
        />
        <button
          onClick={send}
          style={{
            background: "transparent",
            border: "1px solid #1a1a1a",
            color: "#555",
            padding: "8px 16px",
            cursor: "pointer",
            fontSize: 11,
            ...M,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
