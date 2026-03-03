/**
 * Status Dashboard — System Health
 *
 * Displays service health, uptime, and system metrics.
 * All monitoring is local — no external status endpoints.
 */

import { useState, useEffect } from "react";

const M = { fontFamily: "monospace" };

const SERVICES = [
  { name: "Core Runtime", status: "operational", uptime: "99.99%" },
  { name: "Agent Registry", status: "operational", uptime: "99.95%" },
  { name: "Local Inference", status: "degraded", uptime: "97.20%" },
  { name: "File System", status: "operational", uptime: "100.00%" },
  { name: "Task Scheduler", status: "operational", uptime: "99.98%" },
  { name: "Network Layer", status: "offline", uptime: "—" },
];

function StatusIndicator({ status }) {
  const config = {
    operational: { color: "#0f0", label: "Operational" },
    degraded: { color: "#FF8400", label: "Degraded" },
    offline: { color: "#555", label: "Offline" },
    down: { color: "#f00", label: "Down" },
  };
  const c = config[status] || config.offline;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: c.color,
        }}
      />
      <span style={{ fontSize: 10, color: c.color, opacity: 0.8 }}>
        {c.label}
      </span>
    </div>
  );
}

export default function StatusDashboard() {
  const [ts, setTs] = useState("");
  useEffect(() => {
    const tick = () =>
      setTs(new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC");
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  const operational = SERVICES.filter(
    (s) => s.status === "operational"
  ).length;
  const total = SERVICES.length;

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
        <span style={{ fontSize: 12, color: "#444" }}>●</span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>System Health</span>
        <span style={{ fontSize: 10, opacity: 0.3, marginLeft: 4 }}>
          {operational}/{total} operational
        </span>
        <span
          style={{ fontSize: 10, opacity: 0.15, marginLeft: "auto" }}
        >
          {ts}
        </span>
      </div>

      {/* Services */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {SERVICES.map((svc) => (
            <div
              key={svc.name}
              style={{
                display: "grid",
                gridTemplateColumns: "200px 140px 80px",
                gap: 12,
                padding: "10px 12px",
                borderBottom: "1px solid #0a0a0a",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 12, color: "#ccc" }}>{svc.name}</span>
              <StatusIndicator status={svc.status} />
              <span
                style={{
                  fontSize: 10,
                  opacity: 0.3,
                  textAlign: "right",
                }}
              >
                {svc.uptime}
              </span>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div
          style={{
            marginTop: 24,
            padding: "12px",
            border: "1px solid #1a1a1a",
            fontSize: 11,
            color: "#555",
            lineHeight: 1.8,
          }}
        >
          <div>
            System status:{" "}
            <span style={{ color: "#FF8400" }}>Partially degraded</span>
          </div>
          <div>
            Local inference running with reduced capacity. Network layer
            offline (offline-first mode).
          </div>
        </div>
      </div>
    </div>
  );
}
