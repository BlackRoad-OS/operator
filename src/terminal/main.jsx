import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import LandingPage from "./LandingPage";

function Root() {
  const [view, setView] = useState("landing");

  if (view === "terminal") {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{
          height: 28,
          background: "#000",
          borderBottom: "1px solid #222",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          fontFamily: "monospace",
          fontSize: 11,
          flexShrink: 0,
        }}>
          <button
            onClick={() => setView("landing")}
            style={{
              background: "none",
              border: "1px solid #333",
              color: "#555",
              fontFamily: "monospace",
              fontSize: 10,
              padding: "2px 10px",
              cursor: "pointer",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            ← Back to Landing
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <App />
        </div>
      </div>
    );
  }

  return (
    <div>
      <LandingPage />
      <div style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 1000,
      }}>
        <button
          onClick={() => setView("terminal")}
          style={{
            background: "#fff",
            color: "#000",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.55rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "10px 18px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          Open Terminal
        </button>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
