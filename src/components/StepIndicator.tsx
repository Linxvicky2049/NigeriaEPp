import { T } from "../utils";
import { Check } from "lucide-react";

export const AUTH_STEPS = [
  { label: "PVC Reader", icon: "💳" },
  { label: "Cam Analysis", icon: "📷" },
  { label: "Face Match", icon: "👤" },
  { label: "Iris Pattern", icon: "👁" },
  { label: "Fingerprint", icon: "🖐" },
  { label: "Cast Ballot", icon: "🗳" },
];

interface StepIndicatorProps {
  current: number;
}

export default function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <div
      id="step-indicator"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        overflowX: "auto",
        padding: "12px 20px",
        background: "#111827",
        borderRadius: 4,
        border: "1px solid #1F2937",
        marginBottom: 24,
      }}
    >
      {AUTH_STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < AUTH_STEPS.length - 1 ? 1 : "none" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                opacity: done || active ? 1 : 0.35,
                transition: "opacity 0.3s",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 4,
                  background: done
                    ? "#22D3EE"
                    : active
                    ? "rgba(34, 211, 238, 0.1)"
                    : "transparent",
                  border: `1.5px solid ${
                    done ? "#22D3EE" : active ? "#22D3EE" : "rgba(255, 255, 255, 0.15)"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: done ? 13 : 15,
                  color: done ? "#0A0B0D" : active ? "#67E8F9" : "#FFFFFF",
                  fontWeight: 600,
                  boxShadow: active ? "0 0 10px rgba(34, 211, 238, 0.25)" : "none",
                  transition: "all 0.3s",
                }}
              >
                {done ? <Check size={16} strokeWidth={3} /> : step.icon}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: active ? 600 : 400,
                  textTransform: "uppercase",
                  color: active ? "#22D3EE" : done ? "#FFFFFF" : "#6B7280",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {step.label}
              </span>
            </div>
            {i < AUTH_STEPS.length - 1 && (
              <div
                style={{
                  height: 1,
                  flex: 1,
                  margin: "0 10px",
                  marginBottom: 16,
                  background: i < current ? "#22D3EE" : "rgba(255,255,255,0.08)",
                  transition: "background 0.5s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
