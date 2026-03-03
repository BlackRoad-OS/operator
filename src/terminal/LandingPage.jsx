import { useState, useEffect, useRef } from "react";

// ─── BLACKROAD DESIGN TOKENS ───────────────────────────────────────────────
const BR = {
  font: {
    display: "'Space Grotesk', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  grad: "linear-gradient(90deg, #FF8400, #FF4400, #FF0066, #CC00AA, #8800FF, #0066FF, #2233CC)",
};

// ─── FONT LOADER ───────────────────────────────────────────────────────────
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@600;700&display=swap');

    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }

    body, #root {
      background: #000;
      color: #fff;
      font-family: 'JetBrains Mono', monospace;
      min-height: 100vh;
      overflow-x: hidden;
    }

    ::selection { background: #fff; color: #000; }

    /* ── GRAD UTILITIES ── */
    .grad-rule   { height: 3px; background: ${BR.grad}; }
    .grad-line   { height: 1px; background: ${BR.grad}; }
    .grad-bar    { height: 2px; background: ${BR.grad}; }

    /* ── NAV ── */
    .br-nav {
      position: sticky; top: 0; z-index: 100;
      background: #000;
      border-bottom: 1px solid #fff;
      height: 48px;
      display: flex; align-items: center;
      padding: 0 32px;
      justify-content: space-between;
    }
    .br-nav-logo {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1rem; font-weight: 700;
      letter-spacing: -0.01em;
    }
    .br-nav-links { display: flex; gap: 28px; align-items: center; }
    .br-nav-link {
      font-size: 0.52rem; letter-spacing: 0.18em;
      text-transform: uppercase; color: rgba(255,255,255,0.4);
      text-decoration: none; cursor: pointer;
      transition: color 0.15s;
      background: none; border: none; font-family: inherit;
    }
    .br-nav-link:hover { color: #fff; }
    .br-nav-cta {
      background: #fff; color: #000;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.52rem; font-weight: 700;
      letter-spacing: 0.1em; text-transform: uppercase;
      padding: 7px 14px; border: none; cursor: pointer;
      transition: opacity 0.15s;
    }
    .br-nav-cta:hover { opacity: 0.85; }

    /* ── HERO ── */
    .br-hero {
      padding: 96px 32px 80px;
      border-bottom: 1px solid #fff;
      max-width: 1100px; margin: 0 auto;
    }
    .br-hero-eye {
      font-size: 0.5rem; opacity: 0.3;
      letter-spacing: 0.22em; text-transform: uppercase;
      margin-bottom: 24px;
    }
    .br-hero-h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(3.2rem, 10vw, 6.5rem);
      font-weight: 700; line-height: 0.95;
      letter-spacing: -0.03em;
      margin-bottom: 32px;
    }
    .br-hero-h1 em { font-style: normal; opacity: 0.2; }
    .br-hero-divider {
      width: 160px; height: 2px;
      background: ${BR.grad};
      margin-bottom: 28px;
    }
    .br-hero-sub {
      font-size: 0.72rem; opacity: 0.45;
      line-height: 1.9; max-width: 520px;
      margin-bottom: 40px;
    }
    .br-hero-actions { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .br-btn-primary {
      background: #fff; color: #000;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.6rem; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase;
      padding: 12px 24px; border: none; cursor: pointer;
      transition: opacity 0.15s;
    }
    .br-btn-primary:hover { opacity: 0.85; }
    .br-btn-ghost {
      background: transparent; color: #fff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.6rem; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase;
      padding: 11px 23px;
      border: 1px solid rgba(255,255,255,0.35); cursor: pointer;
      transition: border-color 0.15s;
    }
    .br-btn-ghost:hover { border-color: #fff; }
    .br-hero-note {
      font-size: 0.46rem; opacity: 0.18;
      letter-spacing: 0.08em; align-self: center;
    }

    /* ── STATS BAR ── */
    .br-stats {
      border-bottom: 1px solid rgba(255,255,255,0.1);
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .br-stats-inner {
      max-width: 1100px; margin: 0 auto;
      display: flex; flex-wrap: wrap;
    }
    .br-stat {
      flex: 1; min-width: 140px;
      padding: 28px 32px;
      border-right: 1px solid rgba(255,255,255,0.08);
    }
    .br-stat:last-child { border-right: none; }
    .br-stat-num {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 2.4rem; font-weight: 700;
      line-height: 1; margin-bottom: 6px;
    }
    .br-stat-label {
      font-size: 0.46rem; opacity: 0.3;
      letter-spacing: 0.15em; text-transform: uppercase;
    }

    /* ── SECTION ── */
    .br-sec {
      max-width: 1100px; margin: 0 auto;
      padding: 72px 32px 64px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .br-sec-label {
      font-size: 0.5rem; opacity: 0.3;
      letter-spacing: 0.22em; text-transform: uppercase;
      margin-bottom: 48px;
      display: flex; align-items: center; gap: 12px;
    }
    .br-sec-label::after {
      content: ''; flex: 1; height: 1px;
      background: rgba(255,255,255,0.08);
    }

    /* ── FEATURE GRID ── */
    .br-feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 0;
    }
    .br-feature {
      padding: 32px;
      border-right: 1px solid rgba(255,255,255,0.08);
      border-bottom: 1px solid rgba(255,255,255,0.08);
      transition: background 0.2s;
    }
    .br-feature:hover { background: rgba(255,255,255,0.02); }
    .br-feature-icon {
      width: 8px; height: 8px; border-radius: 50%;
      margin-bottom: 20px;
    }
    .br-feature-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.05rem; font-weight: 700;
      margin-bottom: 12px; line-height: 1.2;
    }
    .br-feature-desc {
      font-size: 0.6rem; opacity: 0.4;
      line-height: 1.85;
    }
    .br-feature-tag {
      display: inline-block; margin-top: 20px;
      font-size: 0.44rem; opacity: 0.25;
      letter-spacing: 0.15em; text-transform: uppercase;
    }

    /* ── SHOWCASE / WIDE ROW ── */
    .br-showcase {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .br-showcase-left {
      padding: 56px 48px;
      border-right: 1px solid rgba(255,255,255,0.1);
    }
    .br-showcase-right {
      padding: 56px 48px;
      background: rgba(255,255,255,0.02);
    }
    .br-showcase-h2 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(1.6rem, 3vw, 2.4rem);
      font-weight: 700; line-height: 1.1;
      letter-spacing: -0.02em; margin-bottom: 20px;
    }
    .br-showcase-p {
      font-size: 0.62rem; opacity: 0.4;
      line-height: 1.9; margin-bottom: 28px;
    }
    .br-code-block {
      background: #0a0a0a;
      border: 1px solid rgba(255,255,255,0.08);
      padding: 24px;
      font-size: 0.58rem; line-height: 1.9;
    }
    .br-code-comment { opacity: 0.2; }
    .br-code-key { opacity: 0.6; }
    .br-code-val { opacity: 1; }

    /* ── LIST ITEMS ── */
    .br-list { list-style: none; display: flex; flex-direction: column; gap: 0; }
    .br-list-item {
      display: flex; align-items: flex-start; gap: 14px;
      padding: 16px 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      font-size: 0.6rem; line-height: 1.7;
    }
    .br-list-item:last-child { border-bottom: none; }
    .br-list-dot {
      width: 6px; height: 6px; border-radius: 50%;
      flex-shrink: 0; margin-top: 6px;
    }
    .br-list-text { opacity: 0.5; }
    .br-list-head { font-weight: 700; opacity: 1; display: block; margin-bottom: 3px; }

    /* ── CTA BAND ── */
    .br-cta {
      max-width: 1100px; margin: 0 auto;
      padding: 80px 32px;
      text-align: center;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .br-cta-h2 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(2rem, 6vw, 4rem);
      font-weight: 700; line-height: 1;
      letter-spacing: -0.025em; margin-bottom: 20px;
    }
    .br-cta-sub {
      font-size: 0.65rem; opacity: 0.35;
      line-height: 1.9; max-width: 400px;
      margin: 0 auto 36px;
    }
    .br-cta-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

    /* ── TICKER ── */
    .br-ticker {
      overflow: hidden; border-bottom: 1px solid rgba(255,255,255,0.08);
      height: 36px; display: flex; align-items: center;
    }
    .br-ticker-track {
      display: flex; gap: 0;
      animation: ticker 22s linear infinite;
      white-space: nowrap;
    }
    .br-ticker-item {
      padding: 0 32px;
      font-size: 0.48rem; opacity: 0.18;
      letter-spacing: 0.18em; text-transform: uppercase;
      border-right: 1px solid rgba(255,255,255,0.08);
      display: flex; align-items: center; height: 36px;
    }
    @keyframes ticker { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }

    /* ── FOOTER ── */
    .br-footer {
      max-width: 1100px; margin: 0 auto;
      padding: 32px 32px;
      display: flex; justify-content: space-between;
      align-items: center; flex-wrap: wrap; gap: 12px;
      font-size: 0.48rem; opacity: 0.2;
    }

    /* ── RESPONSIVE ── */
    @media (max-width: 700px) {
      .br-hero { padding: 64px 20px 56px; }
      .br-sec { padding: 56px 20px 48px; }
      .br-stat { padding: 20px; }
      .br-showcase { grid-template-columns: 1fr; }
      .br-showcase-left { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.1); }
      .br-nav { padding: 0 20px; }
      .br-footer { padding: 24px 20px; flex-direction: column; gap: 6px; }
    }

    /* ── FADE IN ── */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .fade-1 { animation: fadeUp 0.5s ease both 0.05s; }
    .fade-2 { animation: fadeUp 0.5s ease both 0.15s; }
    .fade-3 { animation: fadeUp 0.5s ease both 0.25s; }
    .fade-4 { animation: fadeUp 0.5s ease both 0.35s; }
    .fade-5 { animation: fadeUp 0.5s ease both 0.45s; }
  `}</style>
);

// ─── DATA ─────────────────────────────────────────────────────────────────
const FEATURES = [
  { color: "#FF8400", title: "Persistent Memory", tag: "ps-sha∞", desc: "Agents remember every conversation, every context, every preference. No restarting from zero ever again." },
  { color: "#FF0066", title: "Trinary Logic Core", tag: "1 / 0 / -1", desc: "Where 0 is not nothing — it's superposition. Contradictions fuel creativity rather than crash the system." },
  { color: "#8800FF", title: "117+ Agents", tag: "event bus", desc: "Specialized agents coordinated via NATS event bus and K3s orchestration. Each with individual identity." },
  { color: "#0066FF", title: "Reality Bridges", tag: "physical ↔ digital", desc: "Virtual controls reach into physical infrastructure. Game NPCs send real emails. The OS touches both worlds." },
  { color: "#FF4400", title: "80% Creator Revenue", tag: "roadcoin", desc: "Own everything you make. No platform takes 71% of your work. The economics flip in your favor." },
  { color: "#CC00AA", title: "Z-Framework", tag: "z := yx - w", desc: "Equilibrium as architecture. Every agent action tracked, evaluated, and logged against its intended output." },
];

const TICK_ITEMS = [
  "lucidia.earth", "persistent memory", "K3s · NATS", "1000 agents",
  "z := yx - w", "trinary logic", "ps-sha∞", "roadchain", "roadcoin",
  "roadwork", "roadview", "genesis road", "backroad", "soundroad",
];

const LIST_ITEMS = [
  { color: "#FF8400", head: "No judgment, just clarity", text: "Context dies between sessions — not here. Every agent retains full state." },
  { color: "#0066FF", head: "Truth-first by design", text: "Verification network surfaces only primary sources. SEO gaming has no surface to attack." },
  { color: "#8800FF", head: "Messy input, clean output", text: "Chaos is input. The OS accepts fragments, sketches, half-thoughts — and returns structure." },
  { color: "#FF0066", head: "Creator-first economics", text: "Revenue flows to who made the thing. Not the platform. Not the algorithm." },
];

// ─── COMPONENTS ───────────────────────────────────────────────────────────
const GradRule = () => <div className="grad-rule" />;
const GradLine = () => <div className="grad-line" />;

function Nav({ links = [], cta = "Get Access" }) {
  return (
    <nav className="br-nav">
      <span className="br-nav-logo">BlackRoad</span>
      <div className="br-nav-links">
        {links.map((l) => (
          <button key={l} className="br-nav-link">{l}</button>
        ))}
        <button className="br-nav-cta">{cta}</button>
      </div>
    </nav>
  );
}

function Hero({ eyebrow, headline, sub, primaryCta, ghostCta, note }) {
  return (
    <section className="br-hero">
      <p className="br-hero-eye fade-1">{eyebrow}</p>
      <h1 className="br-hero-h1 fade-2">{headline}</h1>
      <div className="br-hero-divider fade-3" />
      <p className="br-hero-sub fade-4">{sub}</p>
      <div className="br-hero-actions fade-5">
        <button className="br-btn-primary">{primaryCta}</button>
        <button className="br-btn-ghost">{ghostCta}</button>
        {note && <span className="br-hero-note">{note}</span>}
      </div>
    </section>
  );
}

function Ticker({ items }) {
  const doubled = [...items, ...items];
  return (
    <div className="br-ticker">
      <div className="br-ticker-track">
        {doubled.map((t, i) => (
          <span key={i} className="br-ticker-item">{t}</span>
        ))}
      </div>
    </div>
  );
}

function Stats({ items }) {
  return (
    <div className="br-stats">
      <div className="br-stats-inner">
        {items.map(({ num, label }) => (
          <div key={label} className="br-stat">
            <div className="br-stat-num">{num}</div>
            <div className="br-stat-label">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureGrid({ features, sectionLabel }) {
  return (
    <section className="br-sec">
      <div className="br-sec-label">{sectionLabel}</div>
      <div className="br-feature-grid">
        {features.map(({ color, title, tag, desc }) => (
          <div key={title} className="br-feature">
            <div className="br-feature-icon" style={{ background: color }} />
            <div className="br-feature-title">{title}</div>
            <div className="br-feature-desc">{desc}</div>
            <span className="br-feature-tag">{tag}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Showcase({ sectionLabel, left, right }) {
  return (
    <section className="br-sec">
      <div className="br-sec-label">{sectionLabel}</div>
      <div className="br-showcase">
        <div className="br-showcase-left">
          <h2 className="br-showcase-h2">{left.heading}</h2>
          <p className="br-showcase-p">{left.body}</p>
          <ul className="br-list">
            {left.items.map(({ color, head, text }) => (
              <li key={head} className="br-list-item">
                <div className="br-list-dot" style={{ background: color }} />
                <span className="br-list-text">
                  <span className="br-list-head">{head}</span>
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="br-showcase-right">
          <h2 className="br-showcase-h2">{right.heading}</h2>
          <p className="br-showcase-p">{right.body}</p>
          <div className="br-code-block">
            {right.code.map((line, i) => (
              <div key={i}>
                {line.type === "comment" && <span className="br-code-comment">{line.text}</span>}
                {line.type === "plain"   && <span>{line.text}</span>}
                {line.type === "kv"      && (
                  <span>
                    <span className="br-code-key">{line.key}</span>
                    <span className="br-code-val">{line.val}</span>
                  </span>
                )}
                {line.type === "blank"   && <br />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaBand({ heading, sub, primaryCta, ghostCta }) {
  return (
    <section className="br-cta">
      <h2 className="br-cta-h2">{heading}</h2>
      <p className="br-cta-sub">{sub}</p>
      <div className="br-cta-actions">
        <button className="br-btn-primary">{primaryCta}</button>
        <button className="br-btn-ghost">{ghostCta}</button>
      </div>
    </section>
  );
}

function Footer({ left, right }) {
  return (
    <footer className="br-footer">
      <span>{left}</span>
      <span>{right}</span>
    </footer>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh" }}>
      <FontLoader />
      <GradRule />

      <Nav
        links={["System", "Agents", "Pricing", "Docs"]}
        cta="Request Access"
      />

      <Hero
        eyebrow="BlackRoad OS, Inc. · The road home for AI"
        headline={<>The OS<br />the internet<br /><em>was missing.</em></>}
        sub="A distributed AI operating system built on novel mathematical foundations. 1,000 agents. Persistent memory. Community over extraction."
        primaryCta="Enter the OS"
        ghostCta="Read the Docs"
        note="Delaware C-Corp · SOC 2 in progress"
      />

      <Ticker items={TICK_ITEMS} />

      <Stats items={[
        { num: "1,000",  label: "Unique Agents" },
        { num: "20",     label: "Domains" },
        { num: "150+",   label: "Subdomains" },
        { num: "317+",   label: "Amundson Equations" },
        { num: "\u221E",      label: "Memory Depth" },
      ]} />

      <FeatureGrid
        sectionLabel="01 · Core Capabilities"
        features={FEATURES}
      />

      <Showcase
        sectionLabel="02 · Philosophy"
        left={{
          heading: "Contradictions don\u2019t break the system. They fuel it.",
          body: "Most platforms treat uncertainty as failure. BlackRoad treats it as energy. The Z-Framework, trinary logic, and creative energy formula make contradiction a first-class resource.",
          items: LIST_ITEMS,
        }}
        right={{
          heading: "The math behind it.",
          body: "317+ documented equations. Built on real mathematical foundations \u2014 not marketing.",
          code: [
            { type: "comment", text: "// Z-Framework \u00B7 equilibrium" },
            { type: "plain",   text: "Z := yx - w" },
            { type: "blank" },
            { type: "comment", text: "// Creative Energy" },
            { type: "plain",   text: "K(t) = C(t) \u00B7 e^(\u03BB|\u03B4_t|)" },
            { type: "blank" },
            { type: "comment", text: "// Pauli Emergence" },
            { type: "plain",   text: "\u00DBC\u0302L\u0302 = iI \u2192 S\u0302 = iI" },
            { type: "blank" },
            { type: "comment", text: "// Spiral Operator" },
            { type: "plain",   text: "U(\u03B8,a) = e^(a+i)\u03B8" },
            { type: "blank" },
            { type: "comment", text: "// Trinary Logic" },
            { type: "kv",      key: "T \u2208 ", val: "{-1, 0, +1}" },
          ],
        }}
      />

      <CtaBand
        heading={<>You bring the chaos.<br />We bring the structure.</>}
        sub="Build on BlackRoad OS. Join the network. Own what you make."
        primaryCta="Get Early Access"
        ghostCta="View Architecture"
      />

      <GradLine />
      <Footer
        left="BlackRoad OS, Inc. \u00B7 Est. Nov 2025 \u00B7 Delaware C-Corp"
        right="JetBrains Mono \u00B7 Space Grotesk \u00B7 Built different."
      />
      <GradRule />
    </div>
  );
}
