import { SystemSession } from "../types";
import { T, formatTime } from "../utils";
import { useState, useEffect } from "react";
import { ShieldAlert, Cpu } from "lucide-react";

interface HeaderProps {
  session: SystemSession | null;
  onReset: () => void;
}

export default function Header({ session, onReset }: HeaderProps) {
  const [timeStr, setTimeStr] = useState(formatTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(formatTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header
      id="app-header"
      style={{
        borderBottom: "1px solid #1F2937",
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#111827",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div 
        style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
        onClick={onReset}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 4,
            background: "#0A0B0D",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "monospace",
            color: "#22D3EE",
            border: "1.5px solid #22D3EE",
            boxShadow: "0 0 8px #22D3EE",
          }}
        >
          NG
        </div>
        <div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              color: "#22D3EE",
              letterSpacing: ".08em",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Independent National Electoral Commission
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#6B7280",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: ".04em",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
            NSES TACTICAL COLLATED LEDGER • {timeStr}
          </div>
        </div>
      </div>
      {session ? (
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div className="badge badge-gold" style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#22D3EE", display: "inline-block" }}></span>
            SECURE LINK ACTIVE
          </div>
          <div style={{ fontSize: 10, color: "#6B7280", fontFamily: "monospace", letterSpacing: "0.02em" }}>
            ID: {session.id}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldAlert size={14} color="#22D3EE" />
          <span style={{ fontSize: 10, color: "#22D3EE", fontWeight: 600, fontFamily: "monospace", letterSpacing: "0.05em" }}>E2E CRYPTO ENCRYPTED</span>
        </div>
      )}
    </header>
  );
}
