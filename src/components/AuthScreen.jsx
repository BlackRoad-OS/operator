import { useState, useEffect } from "react";

// ─── FONT + GLOBAL STYLES ─────────────────────────────────────────────────
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@600;700&display=swap');

    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    ::selection { background: #fff; color: #000; }

    .br-auth-root {
      background: #000;
      color: #fff;
      font-family: 'JetBrains Mono', monospace;
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    /* ── LEFT PANEL ── */
    .br-auth-left {
      border-right: 1px solid rgba(255,255,255,0.1);
      display: flex;
      flex-direction: column;
      padding: 40px;
      position: relative;
      overflow: hidden;
    }
    .br-auth-left-logo {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1rem; font-weight: 700;
      letter-spacing: -0.01em;
      display: flex; align-items: center; gap: 10px;
    }
    .br-auth-left-logo-dot {
      width: 7px; height: 7px; border-radius: 50%;
    }
    @keyframes color-cycle {
      0%   { background: #FF8400; }
      25%  { background: #FF0066; }
      50%  { background: #8800FF; }
      75%  { background: #0066FF; }
      100% { background: #FF8400; }
    }
    .br-auth-logo-dot-anim { animation: color-cycle 4s linear infinite; }

    .br-auth-left-center {
      flex: 1;
      display: flex; flex-direction: column;
      justify-content: center;
      padding: 40px 0;
    }
    .br-auth-tagline {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(2rem, 4vw, 3.2rem);
      font-weight: 700;
      line-height: 1.0;
      letter-spacing: -0.03em;
      margin-bottom: 28px;
    }
    .br-auth-tagline em { font-style: normal; opacity: 0.2; }
    .br-auth-grad-bar {
      width: 120px; height: 2px;
      background: linear-gradient(90deg, #FF8400, #FF4400, #FF0066, #CC00AA, #8800FF, #0066FF, #2233CC);
      margin-bottom: 24px;
    }
    .br-auth-desc {
      font-size: 0.6rem; opacity: 0.35;
      line-height: 1.9; max-width: 380px;
      margin-bottom: 40px;
    }
    .br-auth-stats {
      display: flex; flex-direction: column; gap: 0;
    }
    .br-auth-stat {
      display: flex; align-items: center; gap: 16px;
      padding: 14px 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .br-auth-stat:last-child { border-bottom: none; }
    .br-auth-stat-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
    .br-auth-stat-val {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1rem; font-weight: 700; min-width: 64px;
    }
    .br-auth-stat-label { font-size: 0.48rem; opacity: 0.3; letter-spacing: 0.08em; }

    /* Decorative grid */
    .br-auth-grid {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 180px;
      opacity: 0.04;
      background-image:
        linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px);
      background-size: 32px 32px;
      mask-image: linear-gradient(to top, rgba(255,255,255,0.8), transparent);
    }
    .br-auth-grad-rule {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, #FF8400, #FF4400, #FF0066, #CC00AA, #8800FF, #0066FF, #2233CC);
    }

    /* Left footer */
    .br-auth-left-footer {
      font-size: 0.44rem; opacity: 0.18;
      letter-spacing: 0.08em;
    }

    /* ── RIGHT PANEL ── */
    .br-auth-right {
      display: flex; flex-direction: column;
      justify-content: center;
      padding: 40px 56px;
    }
    .br-auth-form-header { margin-bottom: 40px; }
    .br-auth-form-eyebrow {
      font-size: 0.48rem; opacity: 0.3;
      letter-spacing: 0.2em; text-transform: uppercase;
      margin-bottom: 12px;
    }
    .br-auth-form-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.8rem; font-weight: 700;
      letter-spacing: -0.02em; line-height: 1;
      margin-bottom: 8px;
    }
    .br-auth-form-sub {
      font-size: 0.52rem; opacity: 0.3; line-height: 1.7;
    }

    /* Form */
    .br-auth-form { display: flex; flex-direction: column; gap: 0; }
    .br-field { margin-bottom: 28px; }
    .br-field-label {
      font-size: 0.46rem; opacity: 0.4;
      letter-spacing: 0.14em; text-transform: uppercase;
      margin-bottom: 10px; display: block;
    }
    .br-field-wrap { position: relative; }
    .br-input {
      width: 100%;
      background: transparent;
      border: none;
      border-bottom: 1px solid rgba(255,255,255,0.2);
      color: #fff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      padding: 10px 0;
      outline: none;
      transition: border-color 0.2s;
      letter-spacing: 0.02em;
    }
    .br-input::placeholder { color: rgba(255,255,255,0.15); }
    .br-input:focus { border-bottom-color: #fff; }
    .br-input-icon {
      position: absolute; right: 0; top: 50%;
      transform: translateY(-50%);
      opacity: 0.2; font-size: 0.65rem;
      cursor: pointer; background: none;
      border: none; color: #fff;
      font-family: inherit;
      transition: opacity 0.15s;
    }
    .br-input-icon:hover { opacity: 0.6; }
    .br-field-hint {
      font-size: 0.42rem; opacity: 0.2;
      margin-top: 6px; letter-spacing: 0.05em;
    }
    .br-field-error {
      font-size: 0.44rem; color: #FF0066;
      margin-top: 6px; letter-spacing: 0.05em;
      opacity: 0.85;
    }

    /* Role selector */
    .br-role-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 8px; margin-top: 2px;
    }
    .br-role-btn {
      padding: 12px 16px;
      border: 1px solid rgba(255,255,255,0.12);
      background: transparent; color: #fff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.5rem; cursor: pointer;
      text-align: left; transition: border-color 0.15s, background 0.15s;
      display: flex; align-items: center; gap: 8px;
    }
    .br-role-btn:hover { border-color: rgba(255,255,255,0.4); }
    .br-role-btn.selected { background: #fff; color: #000; border-color: #fff; }
    .br-role-btn.selected .br-role-dot { background: #000 !important; }
    .br-role-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
    .br-role-label { flex: 1; }
    .br-role-sub { font-size: 0.38rem; opacity: 0.4; margin-top: 2px; }
    .br-role-btn.selected .br-role-sub { opacity: 0.4; }

    /* Submit */
    .br-auth-submit {
      width: 100%; padding: 14px;
      background: #fff; color: #000;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.6rem; font-weight: 700;
      letter-spacing: 0.1em; text-transform: uppercase;
      border: none; cursor: pointer;
      margin-top: 8px; margin-bottom: 16px;
      transition: opacity 0.15s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .br-auth-submit:hover { opacity: 0.88; }
    .br-auth-submit:disabled { opacity: 0.3; cursor: not-allowed; }
    @keyframes spin { from { transform: rotate(0) } to { transform: rotate(360deg) } }
    .br-spinner {
      width: 10px; height: 10px;
      border: 1.5px solid #000;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    /* Divider */
    .br-auth-divider {
      display: flex; align-items: center; gap: 12px;
      margin: 16px 0;
    }
    .br-auth-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.08); }
    .br-auth-divider-text { font-size: 0.42rem; opacity: 0.25; letter-spacing: 0.1em; }

    /* Magic link */
    .br-auth-magic {
      width: 100%; padding: 13px;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.2);
      color: #fff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.56rem; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase;
      cursor: pointer; transition: border-color 0.15s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .br-auth-magic:hover { border-color: rgba(255,255,255,0.5); }

    /* Switch */
    .br-auth-switch {
      margin-top: 24px;
      font-size: 0.48rem; opacity: 0.3;
      text-align: center; letter-spacing: 0.04em;
    }
    .br-auth-switch-link {
      opacity: 1; text-decoration: underline;
      cursor: pointer; background: none;
      border: none; color: #fff;
      font-family: inherit; font-size: inherit;
    }
    .br-auth-switch-link:hover { opacity: 0.7; }

    /* Terms */
    .br-auth-terms {
      margin-top: 32px;
      font-size: 0.4rem; opacity: 0.15;
      text-align: center; line-height: 1.8;
    }

    /* Success state */
    .br-auth-success {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      text-align: center; gap: 20px;
      padding: 40px 0;
    }
    .br-success-icon {
      width: 48px; height: 48px;
      border: 1px solid rgba(255,255,255,0.3);
      display: flex; align-items: center;
      justify-content: center; font-size: 1.2rem;
    }
    .br-success-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.4rem; font-weight: 700;
      letter-spacing: -0.02em;
    }
    .br-success-sub { font-size: 0.55rem; opacity: 0.35; line-height: 1.8; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { animation: fadeIn 0.4s ease both; }

    @media (max-width: 700px) {
      .br-auth-root { grid-template-columns: 1fr; }
      .br-auth-left { display: none; }
      .br-auth-right { padding: 40px 24px; justify-content: flex-start; padding-top: 60px; }
    }
  `}</style>
);

// ─── DATA ─────────────────────────────────────────────────────────────────
const STATS = [
  { color: "#FF8400", val: "1,000",  label: "Unique AI Agents" },
  { color: "#0066FF", val: "ps-sha\u221E", label: "Memory Persistence" },
  { color: "#8800FF", val: "Z = \u2205",  label: "System Equilibrium" },
  { color: "#FF0066", val: "317+",   label: "Amundson Equations" },
];

const ROLES = [
  { color: "#FF8400", id: "builder",  label: "Builder",  sub: "Developer / Founder" },
  { color: "#0066FF", id: "student",  label: "Student",  sub: "Learner / Researcher" },
  { color: "#8800FF", id: "creator",  label: "Creator",  sub: "Artist / Musician / Writer" },
  { color: "#FF0066", id: "educator", label: "Educator", sub: "Teacher / Instructor" },
];

// ─── FORM MODES ───────────────────────────────────────────────────────────
function LoginForm({ onSwitch, onSuccess }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = () => {
    if (!email) { setError("Email is required."); return; }
    setError(""); setLoading(true);
    setTimeout(() => { setLoading(false); onSuccess(); }, 1800);
  };

  return (
    <>
      <div className="br-auth-form-header">
        <div className="br-auth-form-eyebrow">BlackRoad OS &middot; Identity</div>
        <div className="br-auth-form-title">Welcome back.</div>
        <div className="br-auth-form-sub">Sign in to your OS. Your agents are waiting.</div>
      </div>

      <div className="br-auth-form">
        <div className="br-field">
          <label className="br-field-label">Email address</label>
          <div className="br-field-wrap">
            <input
              className="br-input"
              type="email"
              placeholder="you@blackroad.io"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="br-field">
          <label className="br-field-label">Password</label>
          <div className="br-field-wrap">
            <input
              className="br-input"
              type={showPw ? "text" : "password"}
              placeholder="\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ paddingRight: 28 }}
            />
            <button className="br-input-icon" onClick={() => setShowPw(!showPw)}>
              {showPw ? "\u25CB" : "\u25CF"}
            </button>
          </div>
          <div className="br-field-hint">Forgot password? Send a magic link instead.</div>
          {error && <div className="br-field-error">{error}</div>}
        </div>

        <button className="br-auth-submit" onClick={handleSubmit} disabled={loading}>
          {loading ? <><div className="br-spinner" /> Authenticating&hellip;</> : "Enter the OS \u2192"}
        </button>

        <div className="br-auth-divider">
          <div className="br-auth-divider-line" />
          <span className="br-auth-divider-text">or</span>
          <div className="br-auth-divider-line" />
        </div>

        <button className="br-auth-magic">
          &#x25C8; &nbsp;Send Magic Link
        </button>
      </div>

      <div className="br-auth-switch">
        No account?&nbsp;
        <button className="br-auth-switch-link" onClick={onSwitch}>Create one &rarr;</button>
      </div>

      <div className="br-auth-terms">
        By continuing you agree to the BlackRoad OS Terms of Service<br />
        and Privacy Policy. Delaware C-Corp &middot; SOC 2 in progress.
      </div>
    </>
  );
}

function SignupForm({ onSwitch, onSuccess }) {
  const [email, setEmail]     = useState("");
  const [name, setName]       = useState("");
  const [role, setRole]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = () => {
    if (!email || !name || !role) { setError("All fields required."); return; }
    setError(""); setLoading(true);
    setTimeout(() => { setLoading(false); onSuccess(); }, 1800);
  };

  return (
    <>
      <div className="br-auth-form-header">
        <div className="br-auth-form-eyebrow">BlackRoad OS &middot; Identity</div>
        <div className="br-auth-form-title">Join the OS.</div>
        <div className="br-auth-form-sub">Create your identity. Your agents will remember everything.</div>
      </div>

      <div className="br-auth-form">
        <div className="br-field">
          <label className="br-field-label">Full name</label>
          <input
            className="br-input"
            type="text"
            placeholder="Alexa Amundson"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="br-field">
          <label className="br-field-label">Email address</label>
          <input
            className="br-input"
            type="email"
            placeholder="you@blackroad.io"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="br-field">
          <label className="br-field-label">I am a &mdash;</label>
          <div className="br-role-grid">
            {ROLES.map(({ color, id, label, sub }) => (
              <button
                key={id}
                className={`br-role-btn${role === id ? " selected" : ""}`}
                onClick={() => setRole(id)}
              >
                <div className="br-role-dot" style={{ background: color }} />
                <div>
                  <div className="br-role-label">{label}</div>
                  <div className="br-role-sub">{sub}</div>
                </div>
              </button>
            ))}
          </div>
          {error && <div className="br-field-error" style={{ marginTop: 12 }}>{error}</div>}
        </div>

        <button className="br-auth-submit" onClick={handleSubmit} disabled={loading}>
          {loading ? <><div className="br-spinner" /> Creating identity&hellip;</> : "Create Identity \u2192"}
        </button>
      </div>

      <div className="br-auth-switch">
        Already have an account?&nbsp;
        <button className="br-auth-switch-link" onClick={onSwitch}>Sign in &rarr;</button>
      </div>

      <div className="br-auth-terms">
        Your data is yours. BlackRoad never sells it.<br />
        ps-sha&infin; memory &middot; Z-Framework governance &middot; SOC 2 in progress.
      </div>
    </>
  );
}

function SuccessState({ mode }) {
  return (
    <div className="br-auth-success fade-in">
      <div className="br-success-icon">&#x25C8;</div>
      <div className="br-success-title">
        {mode === "login" ? "Identity confirmed." : "Identity created."}
      </div>
      <div className="br-success-sub">
        {mode === "login"
          ? "Restoring your memory state. Loading agents\u2026"
          : "Your PS-SHA\u221E hash is being generated. Welcome to the OS."}
      </div>
      <div style={{ height: 2, width: 80, background: "linear-gradient(90deg, #FF8400, #FF4400, #FF0066, #CC00AA, #8800FF, #0066FF, #2233CC)", marginTop: 8 }} />
      <div style={{ fontSize: "0.44rem", opacity: 0.2, letterSpacing: "0.1em" }}>
        Z := yx - w &middot; Z = &empty;
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────
export default function AuthScreen() {
  const [mode, setMode]       = useState("login"); // "login" | "signup"
  const [success, setSuccess] = useState(false);
  const [time, setTime]       = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = d => d.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh" }}>
      <FontLoader />
      <div
        style={{
          height: 3,
          background: "linear-gradient(90deg, #FF8400, #FF4400, #FF0066, #CC00AA, #8800FF, #0066FF, #2233CC)"
        }}
      />
      <div className="br-auth-root">

        {/* ── LEFT PANEL ── */}
        <div className="br-auth-left">
          <div className="br-auth-left-logo">
            <div className="br-auth-logo-dot-anim" style={{ width: 7, height: 7, borderRadius: "50%" }} />
            BlackRoad
          </div>

          <div className="br-auth-left-center">
            <h1 className="br-auth-tagline">
              The OS<br />the internet<br /><em>was missing.</em>
            </h1>
            <div className="br-auth-grad-bar" />
            <p className="br-auth-desc">
              A distributed AI operating system. 1,000 agents with persistent memory,
              individual identities, and orientation toward community &mdash; not extraction.
            </p>
            <div className="br-auth-stats">
              {STATS.map(({ color, val, label }) => (
                <div key={label} className="br-auth-stat">
                  <div className="br-auth-stat-dot" style={{ background: color }} />
                  <div className="br-auth-stat-val">{val}</div>
                  <div className="br-auth-stat-label">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="br-auth-left-footer">
            BlackRoad OS, Inc. &middot; Delaware C-Corp &middot; Est. Nov 2025
            <br />
            <span style={{ opacity: 0.6 }}>{fmt(time)}</span>
          </div>

          <div className="br-auth-grid" />
          <div className="br-auth-grad-rule" />
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="br-auth-right">
          {success ? (
            <SuccessState mode={mode} />
          ) : mode === "login" ? (
            <LoginForm
              onSwitch={() => setMode("signup")}
              onSuccess={() => setSuccess(true)}
            />
          ) : (
            <SignupForm
              onSwitch={() => setMode("login")}
              onSuccess={() => setSuccess(true)}
            />
          )}
        </div>

      </div>
      <div
        style={{
          height: 3,
          background: "linear-gradient(90deg, #FF8400, #FF4400, #FF0066, #CC00AA, #8800FF, #0066FF, #2233CC)"
        }}
      />
    </div>
  );
}
