import { useState } from "react";

const GRAD = "linear-gradient(90deg, #FF8400, #FF4400, #FF0066, #CC00AA, #8800FF, #0066FF, #2233CC)";

const apps = [
  {
    id: "lucidia",
    code: "01",
    name: "Lucidia",
    tagline: "Master AI Companion",
    domain: "lucidia.earth",
    status: "LIVE",
    description: "Persistent memory. Live code execution. 117+ specialized agents. Tri-panel interface built for the way you actually think.",
    replaces: ["ChatGPT", "Claude", "VS Code", "Copilot"],
    tag: "AI PLATFORM",
    accent: "#FF8400",
  },
  {
    id: "roadwork",
    code: "02",
    name: "RoadWork",
    tagline: "Adaptive Learning",
    domain: "edu.blackroad.io",
    status: "BUILDING",
    description: "Every lesson generated in real-time for your learning style. Build-to-learn. Failure analysis that adjusts. Free K-12, forever.",
    replaces: ["Khan Academy", "Coursera", "Udemy", "Quizlet"],
    tag: "EDUCATION",
    accent: "#FF4400",
  },
  {
    id: "roadview",
    code: "03",
    name: "RoadView",
    tagline: "Truth-First Search & Video",
    domain: "roadview.blackroad.io",
    status: "BUILDING",
    description: "AI verifies info across sources before surfacing it. Confidence scoring on every result. No SEO gaming. No ad-driven noise.",
    replaces: ["Google", "YouTube", "Perplexity"],
    tag: "SEARCH + VIDEO",
    accent: "#FF0066",
  },
  {
    id: "roadglitch",
    code: "04",
    name: "RoadGlitch",
    tagline: "Backend & Automation",
    domain: "glitch.blackroad.io",
    status: "PLANNED",
    description: "Universal connector marketplace. Visual workflow builder that generates production code. Digital DNA follows you everywhere.",
    replaces: ["Zapier", "Make", "IFTTT"],
    tag: "AUTOMATION",
    accent: "#CC00AA",
  },
  {
    id: "roadworld",
    code: "05",
    name: "RoadWorld",
    tagline: "Virtual Reality Sandbox",
    domain: "world.blackroad.io",
    status: "PLANNED",
    description: "80% creator revenue share. Reality bridges: virtual controls real. 1,000 AI agents with rendered virtual homes in Unity.",
    replaces: ["Minecraft", "Roblox", "Horizon Worlds"],
    tag: "VIRTUAL WORLD",
    accent: "#8800FF",
  },
  {
    id: "backroad",
    code: "06",
    name: "BackRoad",
    tagline: "Social Without the Sickness",
    domain: "social.blackroad.io",
    status: "PLANNED",
    description: "No like counts, no follower numbers. Depth scoring. Campfire rooms. 3-hour post delay. Gets you into the real world.",
    replaces: ["Facebook", "Twitter", "TikTok"],
    tag: "SOCIAL",
    accent: "#0066FF",
  },
  {
    id: "soundroad",
    code: "07",
    name: "SoundRoad",
    tagline: "AI Music Studio",
    domain: "sound.blackroad.io",
    status: "PLANNED",
    description: "Hum a melody → emotional piano in seconds. Vibe-based production. One-click distribution to Spotify and Apple Music.",
    replaces: ["Ableton", "GarageBand", "Splice"],
    tag: "MUSIC",
    accent: "#2233CC",
  },
  {
    id: "cashroad",
    code: "08",
    name: "CashRoad",
    tagline: "Financial Co-Pilot",
    domain: "cash.blackroad.io",
    status: "PLANNED",
    description: "'$847 flexible until the 15th. That's $60/day.' No judgment. Decision-time assistance. Future-you simulator.",
    replaces: ["Mint", "YNAB", "Copilot Money"],
    tag: "FINANCE",
    accent: "#FF8400",
  },
];

const statusStyle = {
  LIVE: { bg: "#fff", color: "#000" },
  BUILDING: { bg: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.4)" },
  PLANNED: { bg: "transparent", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.12)" },
};

function AppCard({ app, index }) {
  const [hovered, setHovered] = useState(false);
  const st = statusStyle[app.status];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        borderRight: (index % 2 === 0) ? "1px solid rgba(255,255,255,0.1)" : "none",
        padding: "40px 36px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        transition: "background 0.2s",
        background: hovered ? "rgba(255,255,255,0.03)" : "transparent",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.5rem",
          opacity: 0.2,
          letterSpacing: "0.2em",
        }}>{app.code}</span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.46rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          padding: "3px 8px",
          background: st.bg,
          color: st.color,
          border: st.border || "none",
        }}>{app.status}</span>
      </div>

      {/* Tag */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.46rem",
        opacity: 0.3,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
      }}>{app.tag}</div>

      {/* Name */}
      <div>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: "#fff",
        }}>{app.name}</div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.58rem",
          opacity: 0.4,
          marginTop: 6,
        }}>{app.tagline}</div>
      </div>

      {/* Grad bar */}
      <div style={{
        height: 2,
        width: hovered ? "100%" : "40px",
        background: GRAD,
        transition: "width 0.4s ease",
      }} />

      {/* Description */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.62rem",
        opacity: 0.5,
        lineHeight: 1.85,
        flex: 1,
      }}>{app.description}</div>

      {/* Replaces */}
      <div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.44rem",
          opacity: 0.2,
          letterSpacing: "0.15em",
          marginBottom: 8,
          textTransform: "uppercase",
        }}>Replaces</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {app.replaces.map(r => (
            <span key={r} style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.5rem",
              padding: "2px 8px",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.04em",
            }}>{r}</span>
          ))}
        </div>
      </div>

      {/* Domain */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.5rem",
        opacity: 0.2,
        letterSpacing: "0.05em",
      }}>{app.domain}</div>
    </div>
  );
}

export default function BlackRoadApps() {
  const [filter, setFilter] = useState("ALL");
  const filters = ["ALL", "LIVE", "BUILDING", "PLANNED"];

  const filtered = filter === "ALL" ? apps : apps.filter(a => a.status === filter);

  return (
    <div style={{
      background: "#000",
      color: "#fff",
      minHeight: "100vh",
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@600;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #000; } ::-webkit-scrollbar-thumb { background: #333; }`}</style>

      {/* Top grad rule */}
      <div style={{ height: 3, background: GRAD }} />

      {/* Nav */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        height: 48,
        borderBottom: "1px solid #fff",
        position: "sticky",
        top: 0,
        background: "#000",
        zIndex: 100,
      }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "0.85rem" }}>
          BlackRoad
        </span>
        <div style={{ display: "flex", gap: 28 }}>
          {["apps", "agents", "docs", "status"].map(l => (
            <span key={l} style={{
              fontSize: "0.48rem",
              opacity: l === "apps" ? 1 : 0.35,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: "pointer",
              borderBottom: l === "apps" ? "1px solid #fff" : "none",
              paddingBottom: l === "apps" ? 2 : 0,
            }}>{l}</span>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        padding: "64px 40px 48px",
        borderBottom: "1px solid #fff",
        maxWidth: 1200,
        margin: "0 auto",
      }}>
        <div style={{ fontSize: "0.52rem", opacity: 0.3, letterSpacing: "0.2em", marginBottom: 20 }}>
          BlackRoad OS · Application Suite
        </div>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "clamp(3.5rem, 10vw, 7rem)",
          fontWeight: 700,
          lineHeight: 0.9,
          letterSpacing: "-0.03em",
        }}>
          The Apps
        </div>
        <div style={{
          marginTop: 24,
          fontSize: "0.65rem",
          opacity: 0.4,
          lineHeight: 1.9,
          maxWidth: 560,
        }}>
          Eight portals. One operating system. Each one built to replace something broken — and give you back what platforms took.
        </div>

        {/* Stats row */}
        <div style={{
          display: "flex",
          gap: 0,
          marginTop: 40,
          paddingTop: 32,
          borderTop: "1px solid rgba(255,255,255,0.1)",
          flexWrap: "wrap",
        }}>
          {[["8", "Core Apps"], ["20", "Domains"], ["150+", "Subdomains"], ["1,000", "Target Agents"]].map(([num, label]) => (
            <div key={label} style={{
              paddingRight: 40,
              marginRight: 40,
              borderRight: "1px solid rgba(255,255,255,0.1)",
            }}>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "2.4rem",
                fontWeight: 700,
                lineHeight: 1,
              }}>{num}</div>
              <div style={{
                fontSize: "0.46rem",
                opacity: 0.3,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginTop: 4,
              }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        padding: "0 40px",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        maxWidth: 1200,
        margin: "0 auto",
      }}>
        <span style={{ fontSize: "0.44rem", opacity: 0.25, letterSpacing: "0.15em", marginRight: 24 }}>FILTER</span>
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.5rem",
              padding: "16px 20px",
              background: "transparent",
              border: "none",
              color: filter === f ? "#fff" : "rgba(255,255,255,0.3)",
              borderBottom: filter === f ? "2px solid #fff" : "2px solid transparent",
              cursor: "pointer",
              letterSpacing: "0.1em",
              transition: "all 0.15s",
            }}
          >{f}</button>
        ))}
        <div style={{ marginLeft: "auto", fontSize: "0.46rem", opacity: 0.2 }}>
          {filtered.length} apps
        </div>
      </div>

      {/* App Grid */}
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        borderTop: "1px solid rgba(255,255,255,0.1)",
      }}>
        {filtered.map((app, i) => (
          <AppCard key={app.id} app={app} index={i} />
        ))}
      </div>

      {/* Bottom CTA */}
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "64px 40px",
        borderTop: "1px solid #fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 24,
      }}>
        <div>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
            fontWeight: 700,
            lineHeight: 1.1,
          }}>
            You bring the chaos.<br />
            <span style={{ opacity: 0.3 }}>We bring the structure.</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.6rem",
            fontWeight: 700,
            padding: "12px 24px",
            background: "#fff",
            color: "#000",
            border: "none",
            cursor: "pointer",
            letterSpacing: "0.05em",
          }}>Request Access</button>
          <button style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.6rem",
            fontWeight: 700,
            padding: "12px 24px",
            background: "transparent",
            color: "#fff",
            border: "1px solid #fff",
            cursor: "pointer",
            letterSpacing: "0.05em",
          }}>View Docs</button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ height: 3, background: GRAD }} />
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "24px 40px",
        display: "flex",
        justifyContent: "space-between",
        fontSize: "0.46rem",
        opacity: 0.18,
        flexWrap: "wrap",
        gap: 8,
      }}>
        <span>BlackRoad OS, Inc. · Application Suite v1.0 · Dec 2025</span>
        <span>JetBrains Mono · Space Grotesk · 8 apps · 20 domains · 150+ subdomains</span>
      </div>
    </div>
  );
}
