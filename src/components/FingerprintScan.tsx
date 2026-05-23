import { useState } from "react";
import { Voter } from "../types";
import { T, sleep } from "../utils";
import { RefreshCw, CheckCircle } from "lucide-react";

interface FingerprintScanProps {
  voter: Voter;
  onPass: () => void;
}

export default function FingerprintScan({ voter, onPass }: FingerprintScanProps) {
  const [finger, setFinger] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "press" | "scanning" | "done">("idle");
  const [progress, setProgress] = useState(0);

  const fingers = [
    { id: "right-thumb", label: "R.Thumb", top: "54%", left: "20%" },
    { id: "right-index", label: "R.Index", top: "25%", left: "26%" },
    { id: "right-middle", label: "R.Middle", top: "15%", left: "37%" },
    { id: "right-ring", label: "R.Ring", top: "20%", left: "48%" },
    { id: "right-little", label: "R.Little", top: "34%", left: "59%" },
    { id: "left-thumb", label: "L.Thumb", top: "54%", left: "76%" },
    { id: "left-index", label: "L.Index", top: "25%", left: "69%" },
    { id: "left-middle", label: "L.Middle", top: "15%", left: "59%" },
    { id: "left-ring", label: "L.Ring", top: "20%", left: "48%" },
    { id: "left-little", label: "L.Little", top: "34%", left: "37%" },
  ];

  async function startFingerprintScan(fingerId: string) {
    setFinger(fingerId);
    setPhase("press");
    await sleep(1000);
    setPhase("scanning");
    for (let i = 0; i <= 100; i += 4) {
      setProgress(i);
      await sleep(25);
    }
    setPhase("done");
  }

  return (
    <div className="animate-in" id="fingerprint-scan" style={{ maxWidth: 560, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "'JetBrains Mono', monospace", color: "#22D3EE", fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
        Step 5 — Optical Fingerprint Biometrics Lock
      </h2>
      <p style={{ color: T.textLt, fontSize: 14, marginBottom: 20 }}>
        Select a target registration finger on the graphic map, then press the selected finger firmly to the optical prism scanner.
      </p>

      {/* Optical hand mapping */}
      <div style={{ position: "relative", height: 160, marginBottom: 24 }}>
        <div style={{ textAlign: "center", fontSize: 90, opacity: 0.15, userSelect: "none" }}>🖐️</div>
        <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
          {fingers.slice(0, 5).map((f) => (
            <button
              key={f.id}
              onClick={() => phase === "idle" && startFingerprintScan(f.id)}
              style={{
                background: finger === f.id ? T.gold : "rgba(255,255,255,0.06)",
                border: `1.5px solid ${finger === f.id ? T.goldLt : "rgba(255,255,255,0.25)"}`,
                color: finger === f.id ? T.greenDk : T.white,
                padding: "6px 12px",
                borderRadius: 20,
                fontSize: 10,
                fontWeight: 600,
                cursor: phase === "idle" ? "pointer" : "not-allowed",
                margin: "0 4px",
                transition: "all 0.2s",
              }}
            >
              {f.label} {finger === f.id && phase === "done" && "✓"}
            </button>
          ))}
        </div>
      </div>

      {/* Scanner Visualizer Grid */}
      <div
        style={{
          width: 170,
          height: 220,
          margin: "0 auto 24px",
          borderRadius: 16,
          background: "rgba(0,0,0,0.55)",
          border: `3px solid ${phase === "done" ? "#4AE09A" : finger ? T.gold : "rgba(255,255,255,0.15)"}`,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          boxShadow: "inset 0 4px 12px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        {phase === "scanning" && <div className="scan-line" />}

        {phase === "done" ? (
          <CheckCircle size={56} color="#4AE09A" />
        ) : (
          <span style={{ fontSize: 56, opacity: finger ? 1 : 0.2, filter: phase === "scanning" ? "drop-shadow(0 0 4px rgba(240,180,41,0.5))" : "none" }}>
            🖐️
          </span>
        )}

        <div style={{ fontSize: 12, color: T.white, opacity: 0.8, fontWeight: 500, padding: "0 10px", textAlign: "center" }}>
          {phase === "idle" && "Select finger above"}
          {phase === "press" && <span className="animate-pulse" style={{ color: T.goldLt }}>POSITION FINGER ON READER</span>}
          {phase === "scanning" && <span className="animate-pulse" style={{ color: T.goldLt }}>INGESTING MINUTIAE INDEX</span>}
          {phase === "done" && <span style={{ color: "#4AE09A" }}>RECORD SECURED</span>}
        </div>

        {phase === "scanning" && (
          <div className="progress-bar" style={{ width: "70%" }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {phase === "done" && (
        <div className="animate-in" style={{ marginTop: 12 }}>
          <div
            className="card"
            style={{
              borderColor: T.gold,
              background: "rgba(200, 150, 12, 0.08)",
              padding: 16,
              borderRadius: 10,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 600, color: T.goldLt }}>
              Triple-Biometric Vector Locked ✓
            </div>
            <div style={{ color: T.white, opacity: 0.8, fontSize: 12, marginTop: 4 }}>
              Face Comparison • Iris Encryption Pattern • Fingerprint Minutiae verified against core records.
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: "100%", padding: "14px", fontWeight: 600 }}
            onClick={onPass}
          >
            Decrypt & UNLOCK Secure Ballot Sheet →
          </button>
        </div>
      )}

      {/* Technical Specifications */}
      <div className="card" style={{ marginTop: 24, padding: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 12, color: T.goldLt, letterSpacing: ".06em", marginBottom: 8 }}>
          INEC PERIPHERAL INTEGRATION MANUAL
        </div>
        <ul style={{ paddingLeft: 18, fontSize: 11, color: T.white, opacity: 0.75, lineHeight: 1.8 }}>
          <li>
            <strong style={{ color: T.white }}>Drivers:</strong> SecuGen Hamster Pro 20 (FAP 20 certified) or Crossmatch single-finger scanners.
          </li>
          <li>
            <strong style={{ color: T.white }}>Format:</strong> Compiles ISO/IEC 19794-2 (ANSI-378 Compatible) minutiae records locally.
          </li>
          <li>
            <strong style={{ color: T.white }}>Verification:</strong> Minimum of <code>22</code> pairing minutiae features required to map verification success.
          </li>
        </ul>
      </div>
    </div>
  );
}
