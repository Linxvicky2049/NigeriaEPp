import { useState } from "react";
import { Voter } from "../types";
import { T, sleep } from "../utils";
import { Eye, ShieldCheck, RefreshCw } from "lucide-react";

interface RetinaScanProps {
  voter: Voter;
  onPass: () => void;
}

export default function RetinaScan({ voter, onPass }: RetinaScanProps) {
  const [phase, setPhase] = useState<"idle" | "aligning" | "scanning" | "verifying" | "done">("idle");
  const [progress, setProgress] = useState(0);

  async function startScan() {
    setPhase("aligning");
    for (let i = 0; i <= 40; i++) {
      setProgress(i);
      await sleep(35);
    }
    setPhase("scanning");
    for (let i = 41; i <= 85; i++) {
      setProgress(i);
      await sleep(25);
    }
    setPhase("verifying");
    for (let i = 86; i <= 100; i++) {
      setProgress(i);
      await sleep(30);
    }
    setPhase("done");
  }

  const phaseLabels = {
    idle: "Infrared Optical Iris Reader initialized.",
    aligning: "Booth Calibration: Align pupil within targeting focal grid…",
    scanning: "Surveillance Active: Mapping unique iris pattern cryptograms…",
    verifying: "Validating retina credentials against Central NIMC database…",
    done: "Iris Biometrics Match Confirmed! Verification Complete ✓",
  };

  return (
    <div className="animate-in" id="retina-scan" style={{ maxWidth: 520, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "'JetBrains Mono', monospace", color: "#22D3EE", fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
        Step 4 — Retina / Iris Cryptographic Scan
      </h2>
      <p style={{ color: T.textLt, fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
        Position your left or right eye 5–8 cm from the infrared sensor aperture. Keep your eye open and avoid blinking until the optical progress ring registers 100%.
      </p>

      {/* Iris Scanner Visual Grid */}
      <div
        style={{
          position: "relative",
          width: 200,
          height: 200,
          margin: "0 auto 28px",
          borderRadius: "50%",
          border: `3px solid ${phase === "done" ? "#4AE09A" : phase !== "idle" ? T.gold : "rgba(255,255,255,0.2)"}`,
          background: "radial-gradient(circle, rgba(26,111,168,0.25) 0%, rgba(6,17,12,0.95) 80%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          boxShadow: phase === "done" ? `0 0 20px rgba(74,224,154,0.3)` : "0 4px 16px rgba(0,0,0,0.4)",
        }}
      >
        <span style={{ fontSize: 60, zIndex: 1, filter: phase === "scanning" ? "drop-shadow(0 0 8px rgba(240,180,41,0.5))" : "none" }}>
          {phase === "done" ? "👁️" : "👁️"}
        </span>

        {/* Concentric high-tech scan markers */}
        {(phase === "aligning" || phase === "scanning") &&
          [1, 2, 3].map((n) => (
            <div
              key={n}
              className="animate-pulse"
              style={{
                position: "absolute",
                borderRadius: "50%",
                border: `1px solid ${T.goldLt}`,
                width: n * 55,
                height: n * 55,
                opacity: 0.35,
                animation: `pulse ${n * 0.75}s ease-in-out infinite`,
              }}
            />
          ))}

        {phase === "done" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(11, 94, 62, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#4AE09A",
            }}
          >
            <ShieldCheck size={72} strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Progress container */}
      <div className="progress-bar" style={{ marginBottom: 10 }}>
        <div
          className="progress-fill"
          style={{
            width: `${progress}%`,
            background: phase === "done" ? "#4AE09A" : `linear-gradient(90deg, ${T.gold}, ${T.goldLt})`,
          }}
        />
      </div>

      <div
        style={{
          textAlign: "center",
          fontSize: 13,
          fontWeight: 500,
          color: phase === "done" ? "#4AE09A" : T.goldLt,
          marginBottom: 24,
          minHeight: 20,
        }}
      >
        {phaseLabels[phase]}
      </div>

      {phase === "idle" && (
        <button
          className="btn btn-primary"
          style={{ width: "100%", padding: "14px", fontWeight: 600 }}
          onClick={startScan}
        >
          Activate Infrared Iris Scanner
        </button>
      )}

      {(phase === "aligning" || phase === "scanning" || phase === "verifying") && (
        <button className="btn btn-secondary" style={{ width: "100%", padding: "14px" }} disabled>
          <RefreshCw className="animate-spin" size={16} /> Scanning Eye Structures…
        </button>
      )}

      {phase === "done" && (
        <button
          className="btn btn-primary animate-in"
          style={{ width: "100%", padding: "14px", fontWeight: 600 }}
          onClick={onPass}
        >
          Lock Iris Token & Proceed to Stage V →
        </button>
      )}

      {/* Physical Hardware Integration Specs Alert */}
      <div className="card" style={{ marginTop: 28, padding: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 12, color: T.goldLt, letterSpacing: ".06em", marginBottom: 8 }}>
          INEC PHYSICAL HARDWARE SCHEMATICS
        </div>
        <ul style={{ paddingLeft: 18, fontSize: 11, color: T.white, opacity: 0.75, lineHeight: 1.8 }}>
          <li>
            <strong style={{ color: T.white }}>Sensors:</strong> Supports IriShield-USB MK2120U / BK2121U custom iris scanners.
          </li>
          <li>
            <strong style={{ color: T.white }}>Ingestion Payload:</strong> Grayscale 640 x 480 ISO/IEC 19794-6 raw image templates.
          </li>
          <li>
            <strong style={{ color: T.white }}>Matcher Protocol:</strong> Compares Hamming distance filters with a maximum acceptable match threshold of <code>0.31</code>.
          </li>
        </ul>
      </div>
    </div>
  );
}
