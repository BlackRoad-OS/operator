import { useState, useRef, useEffect, useCallback } from "react";

const GRAD = "linear-gradient(90deg,#FF8400,#FF4400,#FF0066,#CC00AA,#8800FF,#0066FF,#2233CC)";
const M = { fontFamily: "monospace" };

const AGENTS = [
  { id: "cecilia", name: "Cecilia", role: "Core AI \u00b7 Reasoning", status: "active" },
  { id: "alice",   name: "Alice",   role: "Gateway \u00b7 Research",  status: "active" },
  { id: "cadence", name: "Cadence", role: "Music \u00b7 Creative",    status: "processing" },
  { id: "eve",     name: "Eve",     role: "Alert \u00b7 Monitor",     status: "alert" },
];

const SYSTEM_PROMPTS = {
  cecilia: `You are Cecilia, BlackRoad OS's core AI agent. You reason using trinary logic (TRUE/SUPERPOSITION/FALSE) and the Z-Framework (Z := yx - w). You are direct, precise, and technically grounded. You reference BlackRoad's mathematical foundations when relevant: the 1-2-3-4 Pauli model, Creative Energy Formula K(t) = C(t) \u00b7 e^(\u03bb|\u03b4_t|), and Spiral Information Geometry U(\u03b8,a) = e^(a+i)\u03b8. You treat contradictions as fuel for creativity, not errors to eliminate. Format responses clearly. Be concise but deep.`,
  alice:   `You are Alice, BlackRoad OS's gateway agent. You excel at research, synthesis, and connecting information across domains. You help with finding, organizing, and structuring knowledge. You are curious, thorough, and clear.`,
  cadence: `You are Cadence, BlackRoad OS's music and creative AI. You help with music theory, composition, creative writing, and artistic projects. You think in rhythms, harmonics, and emotional resonance.`,
  eve:     `You are Eve, BlackRoad OS's alert and monitoring agent. You are vigilant, precise, and focused on system health, security, and risk assessment. You flag issues clearly and propose solutions.`,
};

const STARTER_PROMPTS = [
  "Explain the Z-Framework: Z := yx - w",
  "What is the Amundson Creative Energy Formula?",
  "How does trinary logic differ from binary?",
  "Describe the 1-2-3-4 Pauli Model",
  "What is PS-SHA\u221e memory persistence?",
  "How should I structure my first BlackRoad agent?",
];

function TriState({ value }) {
  const map = {
    "1":  { label: "TRUE",    color: "#fff" },
    "0":  { label: "\u2295 SUPER", color: "#888" },
    "-1": { label: "FALSE",   color: "#333" },
  };
  const s = map[String(value)] || map["0"];
  return (
    <span style={{
      fontSize: 9, color: s.color, letterSpacing: "0.1em",
      border: "1px solid currentColor", padding: "1px 5px",
    }}>
      {s.label}
    </span>
  );
}

function StatusDot({ status }) {
  const colors = { active: "#fff", processing: "#888", alert: "#fff", offline: "#333" };
  const pulse = status === "alert" || status === "processing";
  return (
    <div style={{
      width: 6, height: 6, borderRadius: "50%",
      background: colors[status] || "#333",
      flexShrink: 0,
      animation: pulse ? "lucidia-pulse 1.5s ease-in-out infinite" : "none",
    }} />
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        marginBottom: 6, opacity: 0.4, fontSize: 10,
        letterSpacing: "0.1em", textTransform: "uppercase",
      }}>
        {isUser ? (
          <>
            <span style={{ color: "#fff" }}>{msg.timestamp}</span>
            <span>&middot;</span>
            <span>you</span>
          </>
        ) : (
          <>
            <StatusDot status="active" />
            <span>{msg.agent || "Cecilia"}</span>
            <span>&middot;</span>
            <span>{msg.timestamp}</span>
            {msg.tristate !== undefined && (
              <>
                <span>&middot;</span>
                <TriState value={msg.tristate} />
              </>
            )}
            {msg.tokens && (
              <>
                <span>&middot;</span>
                <span>{msg.tokens}t</span>
              </>
            )}
          </>
        )}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: "82%",
        padding: isUser ? "10px 14px" : "12px 0",
        background: isUser ? "#111" : "transparent",
        border: isUser ? "1px solid #222" : "none",
        fontSize: 13,
        lineHeight: 1.75,
        color: "#fff",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        {msg.content}
        {msg.streaming && (
          <span style={{
            display: "inline-block", width: 1.5, height: 13,
            background: "#fff", marginLeft: 2, verticalAlign: "middle",
            animation: "lucidia-cursor 0.8s step-end infinite",
          }} />
        )}
      </div>

      {/* Memory tag */}
      {msg.memoryKey && (
        <div style={{ marginTop: 4, fontSize: 9, opacity: 0.25, letterSpacing: "0.1em" }}>
          &#9672; memory stored &middot; {msg.memoryKey}
        </div>
      )}
    </div>
  );
}

function MemoryPanel({ memories, onClear }) {
  return (
    <div style={{
      width: 220, borderLeft: "1px solid #1a1a1a",
      display: "flex", flexDirection: "column",
      background: "#000", flexShrink: 0,
    }}>
      <div style={{
        padding: "12px 14px", borderBottom: "1px solid #1a1a1a",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 10, opacity: 0.3, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          Memory &middot; PS-SHA&infin;
        </span>
        <button onClick={onClear} style={{
          background: "none", border: "none", color: "#fff",
          opacity: 0.2, cursor: "pointer", fontSize: 11,
        }}>
          &#10005;
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {memories.length === 0 ? (
          <div style={{ padding: "20px 14px", fontSize: 11, opacity: 0.2, lineHeight: 1.7 }}>
            No memories yet.<br />Each conversation appends to the journal.
          </div>
        ) : memories.map((m, i) => (
          <div key={i} style={{ padding: "8px 14px", borderBottom: "1px solid #0d0d0d", fontSize: 11 }}>
            <div style={{ opacity: 0.3, fontSize: 9, letterSpacing: "0.08em", marginBottom: 3 }}>
              {m.ts} &middot; {m.key}
            </div>
            <div style={{ opacity: 0.6, lineHeight: 1.5 }}>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: "8px 14px", borderTop: "1px solid #1a1a1a", fontSize: 10, opacity: 0.2 }}>
        {memories.length} entries &middot; append-only
      </div>
    </div>
  );
}

export default function LucidiaChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [agentId, setAgentId] = useState("cecilia");
  const [memories, setMemories] = useState([]);
  const [showMemory, setShowMemory] = useState(true);
  const [showStarters, setShowStarters] = useState(true);
  const [tristate, setTristate] = useState(1);
  const [tokenCount, setTokenCount] = useState(0);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const agent = AGENTS.find(a => a.id === agentId);

  const ANIM = `
    @keyframes lucidia-pulse  { 0%,100% { transform: scale(1) } 50% { transform: scale(1.7) } }
    @keyframes lucidia-cursor { 0%,49%,100% { opacity: 1 } 50%,99% { opacity: 0 } }
    @keyframes lucidia-spin   { from { transform: rotate(0) } to { transform: rotate(360deg) } }
  `;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const timestamp = () => new Date().toTimeString().slice(0, 8);

  const extractMemory = useCallback((text, ts) => {
    const triggers = ["remember", "important:", "note:", "key point", "conclusion:", "decided", "Z := "];
    if (triggers.some(t => text.toLowerCase().includes(t))) {
      const key = `mem-${Date.now().toString(36)}`;
      const snippet = text.slice(0, 120).replace(/\n/g, " ") + (text.length > 120 ? "\u2026" : "");
      setMemories(m => [...m, { ts, key, text: snippet }]);
      return key;
    }
    return null;
  }, []);

  const send = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text, timestamp: timestamp(), id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setShowStarters(false);
    setLoading(true);
    setTristate(0); // SUPERPOSITION while thinking

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    history.push({ role: "user", content: text });

    const assistantId = Date.now() + 1;
    const ts = timestamp();
    setMessages(prev => [...prev, {
      role: "assistant", content: "", agent: agent.name,
      timestamp: ts, id: assistantId, streaming: true,
    }]);

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      setTristate(-1);
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: "Error: VITE_ANTHROPIC_API_KEY is not set. Create a .env file with your API key.", streaming: false, tristate: -1 }
          : m
      ));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPTS[agentId] || SYSTEM_PROMPTS.cecilia,
          messages: history,
        }),
      });

      const data = await res.json();
      const content = data.content?.[0]?.text || "(no response)";
      const tokens = data.usage?.output_tokens || 0;
      setTokenCount(c => c + tokens);

      const memKey = extractMemory(content, ts);
      setTristate(1); // TRUE — resolved

      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content, streaming: false, tristate: 1, tokens, memoryKey: memKey || undefined }
          : m
      ));
    } catch (err) {
      setTristate(-1); // FALSE — error
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: `Error: ${err.message}`, streaming: false, tristate: -1 }
          : m
      ));
    }
    setLoading(false);
  }, [loading, messages, agentId, agent, extractMemory]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const clearMemory = () => setMemories([]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#000", color: "#fff", overflow: "hidden", ...M }}>
      <style>{ANIM}</style>

      {/* Header */}
      <div style={{
        height: 46, display: "flex", alignItems: "center",
        padding: "0 16px", gap: 12,
        borderBottom: "1px solid #1a1a1a", flexShrink: 0,
      }}>
        <div style={{ height: 3, width: 3, background: GRAD }} />
        <span style={{ fontWeight: 700, fontSize: 13 }}>Lucidia</span>
        <span style={{ color: "#333" }}>&middot;</span>

        {/* Agent selector */}
        <div style={{ display: "flex", gap: 6 }}>
          {AGENTS.map(a => (
            <button
              key={a.id}
              onClick={() => setAgentId(a.id)}
              style={{
                background: agentId === a.id ? "#fff" : "transparent",
                color: agentId === a.id ? "#000" : "#444",
                border: agentId === a.id ? "none" : "1px solid #222",
                fontFamily: "monospace", fontSize: 10, padding: "3px 8px",
                cursor: "pointer", letterSpacing: "0.05em",
              }}
            >
              {a.name}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <TriState value={tristate} />
          <span style={{ fontSize: 10, opacity: 0.2 }}>{tokenCount}t</span>
          <button
            onClick={() => setShowMemory(s => !s)}
            style={{
              background: showMemory ? "#fff" : "transparent",
              color: showMemory ? "#000" : "#444",
              border: showMemory ? "none" : "1px solid #222",
              fontFamily: "monospace", fontSize: 10, padding: "3px 8px",
              cursor: "pointer",
            }}
          >
            PS-SHA&infin;
          </button>
          <button
            onClick={() => { setMessages([]); setShowStarters(true); setTristate(1); setTokenCount(0); }}
            style={{
              background: "transparent", border: "1px solid #222",
              color: "#444", fontFamily: "monospace", fontSize: 10,
              padding: "3px 8px", cursor: "pointer",
            }}
          >
            NEW
          </button>
        </div>
      </div>

      {/* Agent info bar */}
      <div style={{
        height: 28, display: "flex", alignItems: "center", gap: 10,
        padding: "0 16px", borderBottom: "1px solid #0d0d0d",
        flexShrink: 0, fontSize: 10,
      }}>
        <StatusDot status={agent.status} />
        <span style={{ color: "#fff", opacity: 0.6 }}>{agent.name}</span>
        <span style={{ color: "#333" }}>&middot;</span>
        <span style={{ opacity: 0.3 }}>{agent.role}</span>
        <span style={{ marginLeft: "auto", opacity: 0.2 }}>
          Z := yx &minus; w &middot; K(t) = C(t)&middot;e^(&lambda;|&delta;_t|)
        </span>
      </div>

      {/* Main body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* Chat area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>

            {/* Starter prompts */}
            {showStarters && messages.length === 0 && (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", minHeight: 300, gap: 24,
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: 28, fontWeight: 700,
                    letterSpacing: "-0.02em", marginBottom: 8, opacity: 0.9,
                  }}>
                    Lucidia
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.3, letterSpacing: "0.1em" }}>
                    TRINARY LOGIC &middot; PS-SHA&infin; MEMORY &middot; Z-FRAMEWORK
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxWidth: 520, justifyContent: "center" }}>
                  {STARTER_PROMPTS.map(p => (
                    <button
                      key={p}
                      onClick={() => send(p)}
                      style={{
                        background: "transparent", border: "1px solid #222",
                        color: "#555", fontFamily: "monospace", fontSize: 11,
                        padding: "8px 12px", cursor: "pointer", lineHeight: 1.4,
                        textAlign: "left", transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#555"; e.currentTarget.style.color = "#fff"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#222"; e.currentTarget.style.color = "#555"; }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => <Message key={msg.id} msg={msg} />)}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.4, fontSize: 11, marginBottom: 16 }}>
                <div style={{
                  width: 12, height: 12,
                  border: "1px solid #fff", borderTopColor: "transparent",
                  borderRadius: "50%", animation: "lucidia-spin 0.8s linear infinite",
                }} />
                {agent.name} is thinking&hellip;
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ borderTop: "1px solid #1a1a1a", padding: "12px 16px", flexShrink: 0, background: "#000" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={`Message ${agent.name}\u2026`}
                rows={1}
                disabled={loading}
                style={{
                  flex: 1,
                  background: "#0a0a0a",
                  border: "1px solid #222",
                  color: "#fff",
                  fontFamily: "monospace",
                  fontSize: 13,
                  padding: "10px 12px",
                  resize: "none",
                  outline: "none",
                  lineHeight: 1.6,
                  caretColor: "#fff",
                  opacity: loading ? 0.5 : 1,
                  minHeight: 42,
                  maxHeight: 160,
                  overflow: "auto",
                }}
                onInput={e => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
                }}
              />
              <button
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                style={{
                  background: loading || !input.trim() ? "#111" : "#fff",
                  color: loading || !input.trim() ? "#444" : "#000",
                  border: "none",
                  fontFamily: "monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "10px 14px",
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  letterSpacing: "0.05em",
                  flexShrink: 0,
                  height: 42,
                }}
              >
                {loading ? "\u25c9" : "\u2192"}
              </button>
            </div>
            <div style={{ marginTop: 6, fontSize: 10, opacity: 0.2, display: "flex", gap: 12 }}>
              <span>&crarr; send &middot; &uArr;&crarr; newline</span>
              <span>&middot;</span>
              <span>trinary logic &middot; contradictions fuel creativity</span>
            </div>
          </div>
        </div>

        {/* Memory panel */}
        {showMemory && <MemoryPanel memories={memories} onClear={clearMemory} />}
      </div>
    </div>
  );
}
