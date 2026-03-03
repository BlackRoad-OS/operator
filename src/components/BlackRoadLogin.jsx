import { useState } from "react";

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: #0a0a0a;
  color: #f5f5f5;
  font-family: 'Inter', sans-serif;
  min-height: 100vh;
}

@keyframes gradShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes blink {
  0%, 49%, 100% { opacity: 1; }
  50%, 99%      { opacity: 0; }
}

.grad-rule {
  height: 3px;
  background: linear-gradient(90deg, #FF8400, #FF4400, #FF0066, #CC00AA, #8800FF, #0066FF, #2233CC);
  background-size: 300%;
  animation: gradShift 5s ease infinite;
}
`;

const GradRule = () => (
  <div style={{
    height: 3,
    background: "linear-gradient(90deg, #FF8400, #FF4400, #FF0066, #CC00AA, #8800FF, #0066FF, #2233CC)",
  }} />
);

export default function BlackRoadLogin() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [focused, setFocused]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!email || !password) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1800);
  };

  const inputStyle = (field) => ({
    width: "100%",
    background: "#0a0a0a",
    border: "none",
    borderBottom: `1px solid ${focused === field ? "#fff" : "rgba(255,255,255,0.18)"}`,
    color: "#f5f5f5",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.78rem",
    padding: "10px 0",
    outline: "none",
    transition: "border-color 0.2s",
    letterSpacing: "0.02em",
  });

  return (
    <>
      <style>{styles}</style>

      {/* Top gradient rule */}
      <GradRule />

      {/* Nav */}
      <nav style={{
        background: "#000",
        borderBottom: "1px solid #fff",
        height: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
      }}>
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: "0.9rem",
          letterSpacing: "-0.01em",
        }}>BlackRoad</span>

        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.46rem",
          opacity: 0.3,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}>OS · v1.0</span>
      </nav>

      {/* Main */}
      <div style={{
        minHeight: "calc(100vh - 51px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        background: "#000",
      }}>
        <div style={{
          width: "100%",
          maxWidth: 400,
          animation: "fadeUp 0.5s ease forwards",
        }}>

          {/* Eyebrow */}
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.48rem",
            opacity: 0.3,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginBottom: 24,
          }}>
            BlackRoad OS · Authentication
          </div>

          {/* Heading */}
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: "clamp(2.2rem, 7vw, 3rem)",
            lineHeight: 1.0,
            letterSpacing: "-0.02em",
            marginBottom: 8,
          }}>
            Welcome<br />back.
          </h1>

          {/* Gradient accent */}
          <div style={{
            height: 2,
            width: 80,
            background: "linear-gradient(90deg, #FF8400, #FF4400, #FF0066, #CC00AA, #8800FF, #0066FF)",
            marginBottom: 36,
            marginTop: 16,
          }} />

          {/* Submitted state */}
          {submitted ? (
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.7rem",
              opacity: 0.6,
              lineHeight: 1.8,
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: 24,
            }}>
              <span style={{ opacity: 1, color: "#fff", fontWeight: 700 }}>✓</span>{" "}
              Access granted. Redirecting to workspace
              <span style={{
                display: "inline-block",
                width: 1.5,
                height: 12,
                background: "#fff",
                marginLeft: 3,
                verticalAlign: "middle",
                animation: "blink 0.8s step-end infinite",
              }} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {/* Email */}
              <div>
                <label style={{
                  display: "block",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.46rem",
                  opacity: 0.3,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}>Email</label>
                <input
                  type="email"
                  value={email}
                  placeholder="you@blackroad.io"
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  style={inputStyle("email")}
                />
              </div>

              {/* Password */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <label style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.46rem",
                    opacity: 0.3,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}>Password</label>
                  <button style={{
                    background: "none",
                    border: "none",
                    color: "#fff",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.44rem",
                    opacity: 0.25,
                    cursor: "pointer",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: 0,
                  }}>
                    Forgot?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  placeholder="••••••••••••"
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  style={{
                    ...inputStyle("password"),
                    letterSpacing: password ? "0.12em" : "0.02em",
                  }}
                />
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading || !email || !password}
                style={{
                  width: "100%",
                  background: (!email || !password) ? "transparent" : "#fff",
                  color: (!email || !password) ? "rgba(255,255,255,0.2)" : "#000",
                  border: `1px solid ${(!email || !password) ? "rgba(255,255,255,0.1)" : "#fff"}`,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  letterSpacing: "0.08em",
                  padding: "13px 0",
                  cursor: (!email || !password) ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#000",
                      animation: "blink 0.8s step-end infinite",
                    }} />
                    Authenticating
                  </>
                ) : "Sign In →"}
              </button>

              {/* Footer links */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.48rem",
                  opacity: 0.22,
                  letterSpacing: "0.08em",
                }}>
                  No account?{" "}
                  <span style={{
                    opacity: 1,
                    borderBottom: "1px solid rgba(255,255,255,0.3)",
                    cursor: "pointer",
                    paddingBottom: 1,
                  }}>
                    Request access
                  </span>
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.44rem",
                  opacity: 0.15,
                }}>
                  SSO ↗
                </span>
              </div>
            </div>
          )}

          {/* Status indicator */}
          <div style={{
            marginTop: 48,
            display: "flex",
            alignItems: "center",
            gap: 8,
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#FF8400",
              animation: "blink 2s ease-in-out infinite",
            }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.44rem",
              opacity: 0.22,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}>
              Systems online · All regions nominal
            </span>
          </div>
        </div>
      </div>

      {/* Bottom gradient rule */}
      <GradRule />
    </>
  );
}
