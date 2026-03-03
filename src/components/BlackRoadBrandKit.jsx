import { useState } from "react";

const GRAD = "linear-gradient(90deg, #FF8400, #FF4400, #FF0066, #CC00AA, #8800FF, #0066FF, #2233CC)";

const colors = [
  { hex: "#FF8400", name: "Orange",    stop: "1" },
  { hex: "#FF4400", name: "Red-Orange",stop: "2" },
  { hex: "#FF0066", name: "Hot Pink",  stop: "3" },
  { hex: "#CC00AA", name: "Magenta",   stop: "4" },
  { hex: "#8800FF", name: "Purple",    stop: "5" },
  { hex: "#0066FF", name: "Blue",      stop: "6" },
  { hex: "#2233CC", name: "Deep Navy", stop: "7" },
];

const neutrals = [
  { hex: "#000000", name: "BG" },
  { hex: "#0a0a0a", name: "Surface" },
  { hex: "#111111", name: "Elevated" },
  { hex: "#222222", name: "Border" },
  { hex: "#444444", name: "Muted" },
  { hex: "#ffffff", name: "FG" },
];

const gradients = [
  { name: "Full Spectrum", value: "linear-gradient(90deg,#FF8400,#FF4400,#FF0066,#CC00AA,#8800FF,#0066FF,#2233CC)", use: "Rule bars · strips · loaders" },
  { name: "Diagonal Quad", value: "linear-gradient(135deg,#FF8400,#FF0066,#8800FF,#0066FF)", use: "Large fills · titlebars" },
  { name: "Warm Pair", value: "linear-gradient(90deg,#FF8400,#FF0066)", use: "Alerts · errors · warm states" },
  { name: "Cool Pair", value: "linear-gradient(90deg,#8800FF,#0066FF)", use: "Info · agents · links" },
  { name: "Fade Out", value: "linear-gradient(90deg,#FF8400,transparent)", use: "Decorative tapers" },
];

const typeScale = [
  { role: "Display", font: "Space Grotesk 700", size: "48–72px", sample: "BlackRoad OS", big: true },
  { role: "Heading", font: "Space Grotesk 700", size: "28–36px", sample: "The Road Ahead", medium: true },
  { role: "Label", font: "JetBrains Mono 700", size: "0.52rem", sample: "SYSTEM STATUS · ONLINE", label: true },
  { role: "Body", font: "JetBrains Mono 400", size: "0.7rem", sample: "Distributed AI operating system built on novel mathematical foundations.", body: true },
  { role: "Code", font: "JetBrains Mono 400", size: "0.65rem", sample: "const agent = await Agent.spawn({ id: 'cecilia' })", code: true },
];

const motions = [
  { name: "Fade", anim: "fade-k 2s ease-in-out infinite", color: "#0066FF" },
  { name: "Pulse", anim: "pulse-k 1.5s ease-in-out infinite", color: "#FF8400" },
  { name: "Spin", anim: "spin-k 2s linear infinite", color: "#8800FF", square: true },
  { name: "Blink", anim: "blink-k 1s step-end infinite", color: "#CC00AA" },
  { name: "Bounce", anim: "bounce-k 1s ease-in-out infinite", color: "#FF4400" },
  { name: "Color Cycle", anim: "cc-k 3s linear infinite", color: "#FF0066" },
];

const rules = {
  do: [
    "Text is #ffffff or #000000 only",
    "Use opacity to dim — never a gray hex",
    "Colors on shapes, fills, dots, borders only",
    "JetBrains Mono for all UI, labels, code, data",
    "Space Grotesk for display headings only",
    "Sharp corners — 0 to 4px radius max",
    "Lines over boxes wherever possible",
    "Animate shapes in color, not text",
  ],
  dont: [
    "Never color text — orange, pink, purple, blue",
    "No gray hex values on text — #888, #555, #ccc",
    "No gradient text (-webkit-text-fill-color)",
    "No pill buttons (border-radius > 4px)",
    "No system fonts — Arial, Helvetica, system-ui",
    "No drop shadows on text",
    "No more than 2 accent colors per component",
    "No color on disabled states — opacity only",
  ],
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.42rem", letterSpacing: "0.1em", background: "transparent", color: copied ? "#FF8400" : "rgba(255,255,255,0.3)", border: "1px solid", borderColor: copied ? "#FF8400" : "rgba(255,255,255,0.15)", padding: "3px 8px", cursor: "pointer", transition: "all 0.2s" }}
    >
      {copied ? "COPIED" : "COPY"}
    </button>
  );
}

function Section({ id, label, children }) {
  return (
    <div id={id} style={{ padding: "56px 0 48px", borderBottom: "1px solid #fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem", color: "#fff", opacity: 0.3, letterSpacing: "0.2em", textTransform: "uppercase" }}>{label}</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
      </div>
      {children}
    </div>
  );
}

function Row({ children, top, last }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "18px 0", borderTop: top ? "1px solid rgba(255,255,255,0.08)" : "none", borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap" }}>
      {children}
    </div>
  );
}

export default function BlackRoadBrandKit() {
  const [activeNav, setActiveNav] = useState("colors");

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", fontFamily: "'JetBrains Mono', monospace" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@600;700&display=swap'); * { margin: 0; padding: 0; box-sizing: border-box; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #000; } ::-webkit-scrollbar-thumb { background: #333; } @keyframes fade-k { 0%,100%{opacity:1} 50%{opacity:0} } @keyframes pulse-k { 0%,100%{transform:scale(1)} 50%{transform:scale(1.9)} } @keyframes spin-k { from{transform:rotate(0)} to{transform:rotate(360deg)} } @keyframes blink-k { 0%,49%,100%{opacity:1} 50%,99%{opacity:0} } @keyframes bounce-k { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-11px)} } @keyframes cc-k { 0%{background:#FF8400}25%{background:#FF0066}50%{background:#8800FF}75%{background:#0066FF}100%{background:#FF8400} } @keyframes pulse-s { 0%,100%{transform:scale(1)} 50%{transform:scale(1.7)} } @keyframes gradshift { 0%,100%{background-position:0%} 50%{background-position:100%} } .nav-link { opacity: 0.35; transition: opacity 0.15s; cursor: pointer; } .nav-link:hover, .nav-link.active { opacity: 1; } .swatch-row:hover .swatch-bar { opacity: 1 !important; }`}</style>

      {/* Grad rule top */}
      <div style={{ height: 3, background: GRAD }} />

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "#000", padding: "0 24px", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #fff" }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.85rem", fontWeight: 700 }}>BlackRoad</span>
        <div style={{ display: "flex", gap: 24 }}>
          {["colors", "type", "gradients", "components", "motion", "rules"].map(s => (
            <a key={s} className={`nav-link ${activeNav === s ? "active" : ""}`} onClick={() => { setActiveNav(s); document.getElementById(s)?.scrollIntoView({ behavior: "smooth" }); }} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.5rem", color: "#fff", textDecoration: "none", letterSpacing: "0.12em", textTransform: "uppercase" }}>{s}</a>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px" }}>

        {/* Hero */}
        <div style={{ padding: "72px 0 56px", borderBottom: "1px solid #fff" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem", opacity: 0.3, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 20 }}>BlackRoad OS, Inc. · Design System v1.0</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(3rem,11vw,6rem)", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em" }}>Brand<br />Kit</h1>
          <p style={{ marginTop: 20, fontSize: "0.68rem", opacity: 0.45, lineHeight: 1.9, maxWidth: 480 }}>The canonical reference for BlackRoad's visual language — colors, typography, gradients, components, and motion primitives.</p>
          <div style={{ height: 1, background: GRAD, width: 160, margin: "32px 0" }} />
          <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
            {[["7", "Accent Colors"], ["2", "Typefaces"], ["17", "Motion Primitives"], ["1", "Text Rule"]].map(([n, l], i, arr) => (
              <div key={l} style={{ paddingRight: i < arr.length-1 ? 32 : 0, marginRight: i < arr.length-1 ? 32 : 0, borderRight: i < arr.length-1 ? "1px solid rgba(255,255,255,0.12)" : "none" }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "2.2rem", fontWeight: 700, lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: "0.46rem", opacity: 0.3, letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Wordmark */}
        <Section id="wordmark" label="01 · Wordmark">
          <Row top>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.8rem", fontWeight: 700, flex: 1 }}>BlackRoad</div>
            <div style={{ fontSize: "0.48rem", opacity: 0.2 }}>Space Grotesk 700 · primary</div>
          </Row>
          <Row>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.06em", flex: 1 }}>BLACKROAD</div>
            <div style={{ fontSize: "0.48rem", opacity: 0.2 }}>JetBrains Mono 700 · terminal variant</div>
          </Row>
          <Row last>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.4rem", fontWeight: 700 }}>BlackRoad</div>
              <div style={{ height: 2, width: 64, background: GRAD, marginTop: 6 }} />
            </div>
            <div style={{ fontSize: "0.48rem", opacity: 0.2 }}>Wordmark + gradient rule · marketing</div>
          </Row>
        </Section>

        {/* Colors */}
        <Section id="colors" label="02 · Color Palette">
          {colors.map((c, i) => (
            <div key={c.hex} className="swatch-row" style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 0", borderTop: i === 0 ? "1px solid rgba(255,255,255,0.08)" : "none", borderBottom: i === colors.length-1 ? "none" : "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.hex, flexShrink: 0 }} />
              <div style={{ fontSize: "0.65rem", fontWeight: 700, minWidth: 86 }}>{c.hex}</div>
              <div style={{ fontSize: "0.5rem", opacity: 0.35, letterSpacing: "0.1em", textTransform: "uppercase", minWidth: 90 }}>{c.name}</div>
              <div style={{ flex: 1, height: 2, background: c.hex, opacity: 0.6 }} />
              <CopyButton text={c.hex} />
            </div>
          ))}

          {/* Gradient strip */}
          <div style={{ height: 3, background: GRAD, margin: "28px 0 8px" }} />
          <div style={{ fontSize: "0.5rem", opacity: 0.25, letterSpacing: "0.1em" }}>Full spectrum · shapes and surfaces only · never on text</div>

          {/* Neutrals */}
          <div style={{ marginTop: 32, fontSize: "0.5rem", opacity: 0.25, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>Neutrals</div>
          <div style={{ display: "flex", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {neutrals.map(n => (
              <div key={n.hex} style={{ flex: 1, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.hex, marginBottom: 6, border: n.hex === "#000000" ? "1px solid rgba(255,255,255,0.2)" : "none" }} />
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.48rem", opacity: 0.5 }}>{n.hex}</div>
                <div style={{ fontSize: "0.4rem", opacity: 0.25, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.08em" }}>{n.name}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section id="type" label="03 · Typography">
          {typeScale.map((t, i) => (
            <Row key={t.role} top={i === 0} last={i === typeScale.length - 1}>
              <div style={{ minWidth: 140, flexShrink: 0 }}>
                <div style={{ fontSize: "0.5rem", opacity: 0.35, letterSpacing: "0.15em", textTransform: "uppercase" }}>{t.role}</div>
                <div style={{ fontSize: "0.46rem", opacity: 0.2, marginTop: 3 }}>{t.font}</div>
                <div style={{ fontSize: "0.46rem", opacity: 0.15, marginTop: 1 }}>{t.size}</div>
              </div>
              <div style={{ flex: 1 }}>
                {t.big && <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.8rem,5vw,2.8rem)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.02em" }}>{t.sample}</div>}
                {t.medium && <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.6rem", fontWeight: 700 }}>{t.sample}</div>}
                {t.label && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase" }}>{t.sample}</div>}
                {t.body && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", opacity: 0.5, lineHeight: 1.9 }}>{t.sample}</div>}
                {t.code && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", opacity: 0.7, lineHeight: 1.8 }}>{t.sample}</div>}
              </div>
            </Row>
          ))}
        </Section>

        {/* Text Rules */}
        <Section id="text-rules" label="04 · Text Color Rules">
          <Row top>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.46rem", fontWeight: 700, padding: "3px 8px", background: "#fff", color: "#000", minWidth: 56, textAlign: "center" }}>DO</div>
            <div style={{ fontSize: "0.52rem", opacity: 0.3, minWidth: 130 }}>White on black</div>
            <div style={{ flex: 1 }}><span style={{ fontSize: "1rem", fontWeight: 700 }}>BlackRoad OS</span></div>
            <div style={{ fontSize: "0.48rem", opacity: 0.2 }}>#ffffff on any dark bg</div>
          </Row>
          <Row>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.46rem", fontWeight: 700, padding: "3px 8px", background: "#fff", color: "#000", minWidth: 56, textAlign: "center" }}>DO</div>
            <div style={{ fontSize: "0.52rem", opacity: 0.3, minWidth: 130 }}>Black on white</div>
            <div style={{ flex: 1 }}><span style={{ fontSize: "1rem", fontWeight: 700, color: "#000", background: "#fff", padding: "2px 12px" }}>BlackRoad OS</span></div>
            <div style={{ fontSize: "0.48rem", opacity: 0.2 }}>#000 on white only</div>
          </Row>
          <Row>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.46rem", fontWeight: 700, padding: "3px 8px", background: "#fff", color: "#000", minWidth: 56, textAlign: "center" }}>DO</div>
            <div style={{ fontSize: "0.52rem", opacity: 0.3, minWidth: 130 }}>Opacity to dim</div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: "0.65rem", opacity: 1 }}>Full — opacity: 1</span>
              <span style={{ fontSize: "0.65rem", opacity: 0.5 }}>Dim — opacity: 0.5</span>
              <span style={{ fontSize: "0.65rem", opacity: 0.25 }}>Muted — opacity: 0.25</span>
            </div>
            <div style={{ fontSize: "0.48rem", opacity: 0.2 }}>Never a gray hex</div>
          </Row>
          <Row>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.46rem", fontWeight: 700, padding: "2px 8px", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", minWidth: 56, textAlign: "center" }}>DON'T</div>
            <div style={{ fontSize: "0.52rem", opacity: 0.3, minWidth: 130 }}>Colored text</div>
            <div style={{ flex: 1 }}><span style={{ fontSize: "1rem", fontWeight: 700, color: "#FF8400", textDecoration: "line-through", opacity: 0.4 }}>BlackRoad OS</span></div>
            <div style={{ fontSize: "0.48rem", opacity: 0.2 }}>Colors are for shapes</div>
          </Row>
          <Row last>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.46rem", fontWeight: 700, padding: "2px 8px", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", minWidth: 56, textAlign: "center" }}>DON'T</div>
            <div style={{ fontSize: "0.52rem", opacity: 0.3, minWidth: 130 }}>Gray hex text</div>
            <div style={{ flex: 1 }}><span style={{ fontSize: "1rem", fontWeight: 700, color: "#888", textDecoration: "line-through", opacity: 0.4 }}>BlackRoad OS</span></div>
            <div style={{ fontSize: "0.48rem", opacity: 0.2 }}>No #888 — use white + opacity</div>
          </Row>
        </Section>

        {/* Gradients */}
        <Section id="gradients" label="05 · Gradient System">
          {gradients.map((g, i) => (
            <Row key={g.name} top={i === 0} last={i === gradients.length - 1}>
              <div style={{ height: 3, width: 100, background: g.value, flexShrink: 0 }} />
              <div style={{ fontSize: "0.6rem", fontWeight: 700, minWidth: 160 }}>{g.name}</div>
              <div style={{ fontSize: "0.5rem", opacity: 0.3, flex: 1 }}>{g.use}</div>
              <CopyButton text={g.value} />
            </Row>
          ))}
        </Section>

        {/* Components */}
        <Section id="components" label="06 · Components">
          <Row top>
            <div style={{ fontSize: "0.5rem", opacity: 0.3, letterSpacing: "0.15em", textTransform: "uppercase", minWidth: 100 }}>Buttons</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, flexWrap: "wrap" }}>
              {[["#fff", "#000", "transparent", "Primary"], ["transparent", "#fff", "#fff", "Ghost"], [GRAD, "#000", "none", "Gradient"]].map(([bg, color, border, label]) => (
                <button key={label} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.05em", background: bg, color, padding: "8px 16px", border: border === "none" ? "none" : `1px solid ${border}`, cursor: "default" }}>{label}</button>
              ))}
            </div>
            <div style={{ fontSize: "0.46rem", opacity: 0.18, maxWidth: 180, textAlign: "right", lineHeight: 1.7 }}>text #000 or #fff · no pill radius · sharp corners</div>
          </Row>
          <Row>
            <div style={{ fontSize: "0.5rem", opacity: 0.3, letterSpacing: "0.15em", textTransform: "uppercase", minWidth: 100 }}>Badges</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, flexWrap: "wrap" }}>
              {[["#fff", "#fff", "transparent", "ONLINE"], ["#000", "#FF8400", "#FF8400", "ACTIVE"], ["#fff", "#8800FF", "#8800FF", "AGENT"], ["#000", "#FF0066", "#FF0066", "ALERT"]].map(([color, bg, borderColor, label]) => (
                <span key={label} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.48rem", fontWeight: 700, padding: "2px 7px", border: `1px solid ${borderColor}`, letterSpacing: "0.08em", color, background: bg }}>{label}</span>
              ))}
            </div>
          </Row>
          <Row>
            <div style={{ fontSize: "0.5rem", opacity: 0.3, letterSpacing: "0.15em", textTransform: "uppercase", minWidth: 100 }}>Status</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              {[["#FF8400", "cecilia · active", false], ["#0066FF", "cadence · processing", false], ["#FF0066", "eve · alert", true], ["rgba(255,255,255,0.15)", "olympia · offline", false, true]].map(([dotColor, label, pulse, dim]) => (
                <div key={label} style={{ fontSize: "0.58rem", opacity: dim ? 0.3 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0, animation: pulse ? "pulse-s 1.5s ease-in-out infinite" : "none" }} />
                  {label}
                </div>
              ))}
            </div>
          </Row>
          <Row last>
            <div style={{ fontSize: "0.5rem", opacity: 0.3, letterSpacing: "0.15em", textTransform: "uppercase", minWidth: 100 }}>Dividers</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
              <div style={{ height: 1, background: "#fff" }} />
              <div style={{ height: 1, background: "rgba(255,255,255,0.1)" }} />
              <div style={{ height: 2, background: GRAD, maxWidth: 180 }} />
              <div style={{ height: 1, background: "linear-gradient(90deg,#FF8400,transparent)", maxWidth: 140 }} />
            </div>
            <div style={{ fontSize: "0.46rem", opacity: 0.18, maxWidth: 140, textAlign: "right", lineHeight: 1.7 }}>white · dim · gradient · gradient fade</div>
          </Row>
        </Section>

        {/* Motion */}
        <Section id="motion" label="07 · Motion Primitives">
          {motions.map((m, i) => (
            <Row key={m.name} top={i === 0} last={i === motions.length - 1}>
              <div style={{ fontSize: "0.48rem", opacity: 0.2, width: 22 }}>0{i + 1}</div>
              <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div style={{ width: m.square ? 9 : 8, height: m.square ? 9 : 8, borderRadius: m.square ? 0 : "50%", background: m.color, animation: m.anim }} />
              </div>
              <div style={{ fontSize: "0.58rem", fontWeight: 700, minWidth: 110 }}>{m.name}</div>
              <div style={{ fontSize: "0.5rem", opacity: 0.3, flex: 1 }}>{m.anim.split(" ").slice(1, 3).join(" ")} · CSS keyframe</div>
              <div style={{ fontSize: "0.48rem", opacity: 0.18 }}>{m.anim.split(" ")[1]} · {m.anim.split(" ")[2]}</div>
            </Row>
          ))}
        </Section>

        {/* Rules */}
        <Section id="rules" label="08 · Rules">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            <div style={{ paddingRight: 32, borderRight: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.15em", opacity: 0.4, marginBottom: 12 }}>DO</div>
              {rules.do.map(r => (
                <div key={r} style={{ fontSize: "0.54rem", opacity: 0.35, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", lineHeight: 1.5 }}>{r}</div>
              ))}
            </div>
            <div style={{ paddingLeft: 32 }}>
              <div style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.15em", opacity: 0.4, marginBottom: 12 }}>DON'T</div>
              {rules.dont.map(r => (
                <div key={r} style={{ fontSize: "0.54rem", opacity: 0.35, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", lineHeight: 1.5 }}>{r}</div>
              ))}
            </div>
          </div>
        </Section>

        {/* Footer */}
        <div style={{ padding: "32px 0", display: "flex", justifyContent: "space-between", fontSize: "0.5rem", opacity: 0.18, flexWrap: "wrap", gap: 8 }}>
          <span>BlackRoad OS, Inc. · Design System v1.0 · Est. Nov 2025</span>
          <span>JetBrains Mono · Space Grotesk · JSX</span>
        </div>

      </div>

      {/* Grad rule bottom */}
      <div style={{ height: 3, background: GRAD }} />
    </div>
  );
}
