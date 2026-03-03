/**
 * Style Guide — BlackRoad OS Brand Reference
 *
 * Visual reference for the BlackRoad design system.
 * Colors, typography, spacing, and component patterns.
 */

const M = { fontFamily: "monospace" };
const GRAD = "linear-gradient(90deg,#FF8400,#FF4400,#FF0066,#CC00AA,#8800FF,#0066FF,#2233CC)";

const COLORS = [
  { name: "Black", hex: "#000000", usage: "Primary background" },
  { name: "White", hex: "#FFFFFF", usage: "Primary text" },
  { name: "Orange", hex: "#FF8400", usage: "Accent, interactive" },
  { name: "Red-Orange", hex: "#FF4400", usage: "Gradient stop" },
  { name: "Pink", hex: "#FF0066", usage: "Gradient stop" },
  { name: "Magenta", hex: "#CC00AA", usage: "Gradient stop" },
  { name: "Purple", hex: "#8800FF", usage: "Gradient stop" },
  { name: "Blue", hex: "#0066FF", usage: "Gradient stop" },
  { name: "Deep Blue", hex: "#2233CC", usage: "Gradient stop" },
  { name: "Border", hex: "#1a1a1a", usage: "Dividers, borders" },
  { name: "Muted", hex: "#555555", usage: "Secondary text" },
  { name: "Dim", hex: "#444444", usage: "Tertiary, icons" },
];

const TYPOGRAPHY = [
  { name: "Body", size: 12, weight: 400, sample: "The quick brown fox." },
  { name: "Label", size: 9, weight: 400, sample: "SECTION LABEL" },
  { name: "Heading", size: 13, weight: 600, sample: "Component Title" },
  { name: "Code", size: 12, weight: 400, sample: "const x = 42;" },
  { name: "Caption", size: 10, weight: 400, sample: "v1.0 · Dec 2025" },
];

export default function StyleGuide() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "#000",
        overflowY: "auto",
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
        <span style={{ fontSize: 12, color: "#444" }}>■</span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          Brand Style Guide
        </span>
        <span style={{ fontSize: 10, opacity: 0.3, marginLeft: 4 }}>
          BlackRoad OS Design System
        </span>
      </div>

      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 32 }}>
        {/* Gradient */}
        <section>
          <div
            style={{
              fontSize: 9,
              opacity: 0.3,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            GRADIENT
          </div>
          <div
            style={{
              height: 4,
              background: GRAD,
              marginBottom: 8,
            }}
          />
          <div style={{ fontSize: 10, opacity: 0.3 }}>
            7-stop gradient used for top/bottom rules and accents.
          </div>
        </section>

        {/* Colors */}
        <section>
          <div
            style={{
              fontSize: 9,
              opacity: 0.3,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            COLORS
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 8,
            }}
          >
            {COLORS.map((c) => (
              <div
                key={c.hex}
                style={{
                  border: "1px solid #1a1a1a",
                  padding: 10,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: 24,
                    background: c.hex,
                    border:
                      c.hex === "#000000"
                        ? "1px solid #333"
                        : "none",
                    marginBottom: 8,
                  }}
                />
                <div style={{ fontSize: 11, color: "#fff" }}>{c.name}</div>
                <div style={{ fontSize: 10, opacity: 0.4 }}>{c.hex}</div>
                <div style={{ fontSize: 9, opacity: 0.2, marginTop: 2 }}>
                  {c.usage}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section>
          <div
            style={{
              fontSize: 9,
              opacity: 0.3,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            TYPOGRAPHY
          </div>
          <div style={{ fontSize: 10, opacity: 0.3, marginBottom: 12 }}>
            All text uses monospace. Variation through size, weight, and
            opacity.
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {TYPOGRAPHY.map((t) => (
              <div
                key={t.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 60px 1fr",
                  gap: 12,
                  padding: "8px 12px",
                  borderBottom: "1px solid #0a0a0a",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 10, opacity: 0.4 }}>{t.name}</span>
                <span style={{ fontSize: 9, opacity: 0.2 }}>
                  {t.size}px / {t.weight}
                </span>
                <span
                  style={{
                    fontSize: t.size,
                    fontWeight: t.weight,
                    color: "#fff",
                  }}
                >
                  {t.sample}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Spacing */}
        <section>
          <div
            style={{
              fontSize: 9,
              opacity: 0.3,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            PRINCIPLES
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#555",
              lineHeight: 2,
            }}
          >
            <div>· Monochrome base — color only for meaning</div>
            <div>· Monospace everywhere — no sans-serif</div>
            <div>· Minimal borders — #1a1a1a dividers</div>
            <div>· No rounded corners — sharp edges only</div>
            <div>· Opacity for hierarchy — not color variation</div>
            <div>· Gradient as identity — top and bottom rules</div>
          </div>
        </section>
      </div>
    </div>
  );
}
