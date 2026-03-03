/**
 * Agent Dashboard — Agent Registry
 *
 * Displays registered BlackRoad OS agents, their status, and capabilities.
 * All agent data is local — no external calls.
 */

const M = { fontFamily: "monospace" };

const AGENTS = [
  {
    id: "lucidia",
    name: "Lucidia",
    type: "conversational",
    status: "active",
    version: "1.0.0",
    desc: "Primary AI chat interface for BlackRoad OS.",
  },
  {
    id: "operator",
    name: "Operator",
    type: "orchestrator",
    status: "active",
    version: "1.0.0",
    desc: "Task orchestration and system coordination agent.",
  },
  {
    id: "cecilia",
    name: "Cecilia",
    type: "analyst",
    status: "standby",
    version: "0.9.0",
    desc: "Data analysis and reporting agent.",
  },
  {
    id: "silas",
    name: "Silas",
    type: "security",
    status: "standby",
    version: "0.8.0",
    desc: "Security monitoring and audit agent.",
  },
];

function StatusBadge({ status }) {
  const colors = {
    active: "#0f0",
    standby: "#555",
    error: "#f00",
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: colors[status] || "#333",
        }}
      />
      <span style={{ fontSize: 10, opacity: 0.5 }}>{status}</span>
    </div>
  );
}

export default function AgentDashboard() {
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
        <span style={{ fontSize: 12, color: "#444" }}>◉</span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Agent Registry</span>
        <span style={{ fontSize: 10, opacity: 0.3, marginLeft: 4 }}>
          {AGENTS.length} registered
        </span>
      </div>

      {/* Agent list */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "140px 100px 80px 1fr",
              gap: 12,
              padding: "8px 12px",
              fontSize: 9,
              opacity: 0.3,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              borderBottom: "1px solid #1a1a1a",
            }}
          >
            <span>Agent</span>
            <span>Type</span>
            <span>Status</span>
            <span>Description</span>
          </div>

          {/* Agent rows */}
          {AGENTS.map((agent) => (
            <div
              key={agent.id}
              style={{
                display: "grid",
                gridTemplateColumns: "140px 100px 80px 1fr",
                gap: 12,
                padding: "10px 12px",
                borderBottom: "1px solid #0a0a0a",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: "#fff" }}>
                  {agent.name}
                </div>
                <div style={{ fontSize: 9, opacity: 0.2 }}>
                  v{agent.version}
                </div>
              </div>
              <span style={{ fontSize: 11, color: "#555" }}>{agent.type}</span>
              <StatusBadge status={agent.status} />
              <span style={{ fontSize: 11, color: "#444" }}>{agent.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
