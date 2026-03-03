/**
 * Code Runner — Local Code Execution
 *
 * In-browser code editor and runner for BlackRoad OS.
 * Executes code locally — no external services.
 */

import { useState } from "react";

const M = { fontFamily: "monospace" };

const PLACEHOLDER = `// BlackRoad OS — Code Runner
// Write JavaScript here and press Run.

function greet(name) {
  return \`Hello, \${name}. Welcome to BlackRoad OS.\`;
}

console.log(greet("operator"));
`;

export default function CodeRunner() {
  const [code, setCode] = useState(PLACEHOLDER);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    setOutput("");
    const logs = [];
    const fakeConsole = {
      log: (...args) => logs.push(args.map(String).join(" ")),
      error: (...args) => logs.push("[error] " + args.map(String).join(" ")),
      warn: (...args) => logs.push("[warn] " + args.map(String).join(" ")),
    };
    try {
      const fn = new Function("console", code);
      fn(fakeConsole);
      setOutput(logs.join("\n") || "(no output)");
    } catch (err) {
      setOutput("[error] " + err.message);
    }
    setRunning(false);
  };

  const clear = () => {
    setCode("");
    setOutput("");
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
        <span style={{ fontSize: 12, color: "#444" }}>▶</span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Code Runner</span>
        <span style={{ fontSize: 10, opacity: 0.3, marginLeft: 4 }}>
          JavaScript · local execution
        </span>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 6,
          }}
        >
          <button
            onClick={clear}
            style={{
              background: "transparent",
              border: "1px solid #1a1a1a",
              color: "#555",
              padding: "4px 10px",
              cursor: "pointer",
              fontSize: 10,
              ...M,
            }}
          >
            Clear
          </button>
          <button
            onClick={run}
            disabled={running}
            style={{
              background: running ? "#111" : "transparent",
              border: "1px solid #1a1a1a",
              color: running ? "#333" : "#fff",
              padding: "4px 10px",
              cursor: running ? "default" : "pointer",
              fontSize: 10,
              ...M,
            }}
          >
            {running ? "Running…" : "Run ▶"}
          </button>
        </div>
      </div>

      {/* Editor + Output */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Code editor */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid #1a1a1a",
          }}
        >
          <div
            style={{
              padding: "6px 12px",
              fontSize: 9,
              opacity: 0.2,
              borderBottom: "1px solid #0a0a0a",
            }}
          >
            INPUT
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#ccc",
              padding: 12,
              fontSize: 12,
              lineHeight: 1.6,
              resize: "none",
              ...M,
              caretColor: "#FF8400",
            }}
          />
        </div>

        {/* Output panel */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "6px 12px",
              fontSize: 9,
              opacity: 0.2,
              borderBottom: "1px solid #0a0a0a",
            }}
          >
            OUTPUT
          </div>
          <pre
            style={{
              flex: 1,
              margin: 0,
              padding: 12,
              fontSize: 12,
              lineHeight: 1.6,
              color: output.startsWith("[error]") ? "#f44" : "#0f0",
              overflowY: "auto",
              whiteSpace: "pre-wrap",
              opacity: output ? 1 : 0.2,
              ...M,
            }}
          >
            {output || "Press Run to execute."}
          </pre>
        </div>
      </div>
    </div>
  );
}
