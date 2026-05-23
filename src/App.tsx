import { useState, useEffect } from "react";
import { SystemSession, Voter, AVFlag } from "./types";
import { T, generateSessionId } from "./utils";
import Header from "./components/Header";
import StepIndicator from "./components/StepIndicator";
import VoterCardScanner from "./components/VoterCardScanner";
import LiveCamMonitor from "./components/LiveCamMonitor";
import FaceMatcher from "./components/FaceMatcher";
import RetinaScan from "./components/RetinaScan";
import FingerprintScan from "./components/FingerprintScan";
import BallotEngine from "./components/BallotEngine";
import AdminDashboard from "./components/AdminDashboard";
import ConsensusPlatform from "./components/ConsensusPlatform";
import { ShieldAlert, BarChart2, CheckCircle2, Award, Zap, Heart } from "lucide-react";

export default function App() {
  const [view, setView] = useState<"welcome" | "auth" | "admin" | "consensus">("welcome");
  const [session, setSession] = useState<SystemSession | null>(null);
  const [step, setStep] = useState(0);
  const [voter, setVoter] = useState<Voter | null>(null);
  const [flags, setFlags] = useState<AVFlag[]>([]);

  // Globally loaded inline CSS to implement aesthetic custom classes
  useEffect(() => {
    const cssText = `
      @keyframes scanLine {
        0% { top: 5%; }
        100% { top: 95%; }
      }
      .scan-line {
        position: absolute;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, transparent, #22D3EE, transparent);
        box-shadow: 0 0 10px #22D3EE;
        animation: scanLine 2.5s linear infinite alternate;
        z-index: 5;
        pointer-events: none;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 2px;
        font-size: 10px;
        font-family: 'JetBrains Mono', monospace;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .badge-gold {
        background: rgba(34, 211, 238, 0.1);
        color: #22D3EE;
        border: 1px solid rgba(34, 211, 238, 0.3);
        box-shadow: 0 0 6px rgba(34, 211, 238, 0.1);
      }
      .badge-green {
        background: rgba(52, 211, 153, 0.1);
        color: #34D399;
        border: 1px solid rgba(52, 211, 153, 0.3);
      }
      .badge-danger {
        background: rgba(239, 68, 68, 0.1);
        color: #F87171;
        border: 1px solid rgba(239, 68, 68, 0.3);
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px 18px;
        font-size: 12px;
        font-weight: 500;
        border-radius: 2px;
        border: none;
        cursor: pointer;
        transition: all 0.15s ease-in-out;
        font-family: 'JetBrains Mono', monospace;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .btn-primary {
        background: #22D3EE;
        color: #0A0B0D;
        box-shadow: 0 0 8px rgba(34, 211, 238, 0.25);
      }
      .btn-primary:hover {
        background: #67E8F9;
        box-shadow: 0 0 14px rgba(34, 211, 238, 0.4);
      }
      .btn-primary:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        box-shadow: none !important;
      }
      .btn-secondary {
        background: rgba(31, 41, 55, 0.4);
        border: 1px solid #1F2937;
        color: #D1D5DB;
      }
      .btn-secondary:hover {
        background: rgba(31, 41, 55, 0.75);
        border-color: #22D3EE;
        color: #FFFFFF;
      }
      .btn-danger {
        background: rgba(239, 68, 68, 0.2);
        border: 1px solid rgba(239, 68, 68, 0.5);
        color: #F87171;
      }
      .btn-danger:hover {
        background: rgba(239, 68, 68, 0.4);
        color: #FFFFFF;
      }
      .card {
        background: #111827 / 60;
        background: rgba(17, 24, 39, 0.6);
        border: 1px solid #1F2937;
        border-radius: 4px;
        padding: 16px;
      }
      .progress-bar {
        height: 4px;
        background: #1F2937;
        border-radius: 1px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        border-radius: 1px;
        transition: width 0.3s ease;
      }
      input {
        background: rgba(10, 11, 13, 0.82);
        border: 1px solid #1F2937;
        color: #FFFFFF;
        border-radius: 2px;
        padding: 8px 12px;
        font-size: 13px;
        font-family: 'JetBrains Mono', monospace;
        outline: none;
        transition: all 0.15s ease-in-out;
      }
      input:focus {
        border-color: #22D3EE;
        box-shadow: 0 0 8px rgba(34, 211, 238, 0.2);
      }
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      ::-webkit-scrollbar-track {
        background: #0A0B0D;
      }
      ::-webkit-scrollbar-thumb {
        background: #1F2937;
        border-radius: 2px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #22D3EE;
      }
    `;
    const styleEl = document.createElement("style");
    styleEl.innerHTML = cssText;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  function handleStart(mode: "vote" | "admin" | "consensus") {
    const sId = generateSessionId();
    setSession({ id: sId, mode, startTime: Date.now(), flags: [] });
    setStep(0);
    setVoter(null);
    setFlags([]);
    setView(mode === "vote" ? "auth" : mode === "admin" ? "admin" : "consensus");
  }

  function handleAddFlag(newFlag: AVFlag) {
    setFlags((prev) => [...prev, newFlag]);
  }

  function handleReset() {
    setView("welcome");
    setSession(null);
    setStep(0);
    setVoter(null);
    setFlags([]);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0B0D",
        color: T.white,
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header session={session} onReset={handleReset} />

      <main style={{ flex: 1, padding: "32px 24px" }}>
        {/* Welcome Screen */}
        {view === "welcome" && (
          <div className="animate-in" style={{ maxWidth: 880, margin: "30px auto", padding: "0 16px" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 32,
                  color: "#22D3EE",
                  lineHeight: 1.2,
                  marginBottom: 16,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Nigeria Secure Electoral System (NSES)
              </div>
              <p style={{ fontSize: 16, color: T.white, opacity: 0.75, maxWidth: 640, margin: "0 auto", lineHeight: 1.6 }}>
                INEC high-security, biometric-locked portal. Powered by triple biometric vector authentication, server-secured computer vision, and immutable audit logs to secure your vote.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 20,
                marginBottom: 44,
              }}
            >
              {[
                {
                  icon: "🗳️",
                  title: "Cast Secure Ballot",
                  description: "Ingest voter card, complete triple-biometric calibration, and cast encrypted ledger ballot.",
                  mode: "vote",
                  accent: T.goldLt,
                },
                {
                  icon: "📊",
                  title: "Central Command Centre",
                  description: "Monitor real-time demographics, audit trails, and live video surveillance alerts.",
                  mode: "admin",
                  accent: "#4AE09A",
                },
                {
                  icon: "📜",
                  title: "National Referendum",
                  description: "Vote on active constitutional opinion polls and transparent consensus bills.",
                  mode: "consensus",
                  accent: "#7FC6F8",
                },
              ].map((card) => (
                <div
                  className="card"
                  key={card.mode}
                  onClick={() => handleStart(card.mode as any)}
                  style={{
                    cursor: "pointer",
                    textAlign: "center",
                    border: `1.5px solid rgba(43, 122, 85, 0.25)`,
                    transition: "transform 0.2s ease, border-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.borderColor = card.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "rgba(43, 122, 85, 0.25)";
                  }}
                >
                  <div style={{ fontSize: 44, marginBottom: 16 }}>{card.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: card.accent, marginBottom: 8 }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: 13, color: T.white, opacity: 0.7, lineHeight: 1.5 }}>
                    {card.description}
                  </div>
                </div>
              ))}
            </div>

            {/* Hardware calibration indicators */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
                background: "rgba(0,0,0,0.2)",
                padding: "20px 24px",
                borderRadius: 12,
                border: "1px solid rgba(43,122,85,0.15)",
              }}
            >
              {[
                { label: "Secure Handshake", info: "E2E TLS Tunneling & HSM keys", icon: <Award size={18} color={T.goldLt} /> },
                { label: "AI Verification", info: "Server-side Gemini face-match", icon: <Zap size={18} color={T.goldLt} /> },
                { label: "Booth Surveillance", info: "Continuous chunked video uploads", icon: <ShieldAlert size={18} color={T.goldLt} /> },
              ].map((item, idx) => (
                <div key={idx} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ padding: 8, borderRadius: "50%", background: "rgba(200,150,12,0.1)" }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: T.textLt, marginTop: 1 }}>{item.info}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auth / Biometrics Workflow */}
        {view === "auth" && session && (
          <div style={{ maxWidth: 840, margin: "0 auto" }}>
            <StepIndicator current={step} />

            {flags.length > 0 && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  marginBottom: 24,
                  background: "rgba(192, 57, 43, 0.12)",
                  border: "1px solid rgba(231, 76, 60, 0.35)",
                  color: "#FF8A7A",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <ShieldAlert size={16} />
                <span>
                  <strong>Surveillance Alert Ingested:</strong> {flags.length} violation flag(s) registered on this active session. Commando Center alerted.
                </span>
              </div>
            )}

            <div className="card animate-in" style={{ padding: "28px 24px" }}>
              {step === 0 && (
                <VoterCardScanner
                  onPass={(v) => {
                    setVoter(v);
                    setStep(1);
                  }}
                />
              )}
              {step === 1 && voter && (
                <LiveCamMonitor
                  voter={voter}
                  sessionId={session.id}
                  onPass={() => setStep(2)}
                  onFlag={handleAddFlag}
                />
              )}
              {step === 2 && voter && (
                <FaceMatcher
                  voter={voter}
                  onPass={() => setStep(3)}
                  onFail={(reason) =>
                    handleAddFlag({
                      reason: `Bio-Matching Error: ${reason}`,
                      ts: new Date().toLocaleTimeString("en-NG", { timeZone: "Africa/Lagos" }),
                    })
                  }
                />
              )}
              {step === 3 && voter && <RetinaScan voter={voter} onPass={() => setStep(4)} />}
              {step === 4 && voter && <FingerprintScan voter={voter} onPass={() => setStep(5)} />}
              {step === 5 && voter && (
                <BallotEngine
                  voter={voter}
                  onVoteCast={() => {
                    setTimeout(() => {
                      handleReset();
                    }, 6000); // Send back to home screen after 6 seconds of receipt display!
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Admin Dashboard */}
        {view === "admin" && <AdminDashboard />}

        {/* Consensus Referendum */}
        {view === "consensus" && <ConsensusPlatform />}
      </main>

      <footer
        style={{
          borderTop: "1px solid rgba(43, 122, 85, 0.15)",
          padding: "20px 24px",
          textAlign: "center",
          fontSize: 12,
          color: T.textLt,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          background: "rgba(0,0,0,0.15)",
        }}
      >
        <span>
          © INDEPENDENT NATIONAL ELECTORAL COMMISSION (INEC) • Federal Republic of Nigeria.
        </span>
        <Heart size={12} color="#C0392B" fill="#C0392B" />
        <span>Electoral Act 2022 compliant templates.</span>
      </footer>
    </div>
  );
}
