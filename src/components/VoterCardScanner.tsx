import { useState } from "react";
import { Voter } from "../types";
import { T, sleep } from "../utils";
import { CreditCard, Scan, CheckCircle2, AlertTriangle } from "lucide-react";

interface VoterCardScannerProps {
  onPass: (voter: Voter) => void;
}

export default function VoterCardScanner({ onPass }: VoterCardScannerProps) {
  const [nin, setNin] = useState("");
  const [state, setState] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [voter, setVoter] = useState<Voter | null>(null);
  const [msg, setMsg] = useState("");

  async function handleScan() {
    if (!nin.trim()) {
      setMsg("Please enter your NIN or place your voter card on the reader.");
      return;
    }
    setState("scanning");
    setMsg("Reading card information securely…");
    await sleep(1500);

    try {
      const response = await fetch("/api/voter/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nin: nin.trim().toUpperCase() }),
      });
      const data = await response.json();

      if (response.ok) {
        setVoter(data.voter);
        setState("success");
        setMsg("");
      } else {
        setState("error");
        setMsg(data.error || "Card not recognised. Please check and try again.");
      }
    } catch (err: any) {
      setState("error");
      setMsg("Communication failure with NIMC/INEC register API.");
    }
  }

  const demoNINs = ["NIN001234567", "NIN009876543"];

  return (
    <div className="animate-in" id="voter-card-scanner" style={{ maxWidth: 560, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "'JetBrains Mono', monospace", color: "#22D3EE", fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
        Step 1 — Voter Card Ingestion & NIN Verification
      </h2>
      <p style={{ color: T.textLt, fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
        Place your Permanent Voter Card (PVC) on the NFC/RFID smartcard reader, or enter your 11-digit National Identification Number (NIN) below to fetch your INEC voter credentials.
      </p>

      {/* NFC Card slot visualisation */}
      <div
        style={{
          position: "relative",
          height: 140,
          background: "rgba(0,0,0,0.35)",
          borderRadius: 12,
          border: `2px dashed ${
            state === "success"
              ? T.gold
              : state === "error"
              ? T.danger
              : "rgba(43, 122, 85, 0.35)"
          }`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          overflow: "hidden",
        }}
      >
        {state === "scanning" && <div className="scan-line" />}
        <div style={{ textAlign: "center", zIndex: 2 }}>
          {state === "scanning" ? (
            <Scan size={38} className="animate-spin text-gold" style={{ color: T.goldLt, margin: "0 auto 8px" }} />
          ) : (
            <CreditCard size={38} style={{ color: state === "success" ? T.goldLt : "rgba(255,255,255,0.4)", margin: "0 auto 8px" }} />
          )}
          <div style={{ fontSize: 13, color: T.white, fontWeight: 500, opacity: 0.9 }}>
            {state === "idle" && "Smart Card Reader Slot — Empty"}
            {state === "scanning" && "Reading integrated PVC microchip…"}
            {state === "success" && "Voter PVC Successfully Decrypted & Authenticated"}
            {state === "error" && "Error Reading Identity Card"}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          placeholder="Enter NIN or Scan Card (e.g. NIN001234567)"
          value={nin}
          onChange={(e) => {
            setNin(e.target.value);
            setState("idle");
            setMsg("");
          }}
          disabled={state === "scanning"}
          style={{ flex: 1 }}
        />
        <button
          className="btn btn-primary"
          onClick={handleScan}
          disabled={state === "scanning"}
          style={{ padding: "0 28px", display: "flex", alignItems: "center", gap: 8 }}
        >
          {state === "scanning" ? "Verifying…" : "Submit"}
        </button>
      </div>

      {msg && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            marginBottom: 20,
            background: state === "error" ? "rgba(192, 57, 43, 0.15)" : "rgba(200, 150, 12, 0.1)",
            border: `1px solid ${state === "error" ? "rgba(231, 76, 60, 0.3)" : "rgba(200, 150, 12, 0.25)"}`,
            fontSize: 13,
            color: state === "error" ? "#FF8A7A" : T.goldLt,
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          {state === "error" ? <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> : <Scan size={16} style={{ flexShrink: 0, marginTop: 1 }} />}
          <div style={{ lineHeight: 1.4 }}>{msg}</div>
        </div>
      )}

      {voter && state === "success" && (
        <div className="card animate-in" style={{ border: `1px solid ${T.goldLt}`, background: "rgba(11, 94, 62, 0.35)", padding: 24, borderRadius: 12, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <CheckCircle2 color={T.goldLt} size={20} />
                <span style={{ fontSize: 13, color: T.goldLt, fontWeight: 600, letterSpacing: ".04em" }}>VALID VOTER CREDENTIALS RECOVERED</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, color: T.white, marginBottom: 8 }}>
                {voter.surname}, {voter.firstname}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "6px 12px", fontSize: 13, color: T.white, opacity: 0.8 }}>
                <span style={{ color: T.offWhite, opacity: 0.7 }}>NIN:</span>
                <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{voter.nin}</span>

                <span style={{ color: T.offWhite, opacity: 0.7 }}>Date of Birth:</span>
                <span>{voter.dob}</span>

                <span style={{ color: T.offWhite, opacity: 0.7 }}>State of Origin:</span>
                <span>{voter.state} State</span>

                <span style={{ color: T.offWhite, opacity: 0.7 }}>Registration Ward:</span>
                <span>{voter.ward}</span>

                <span style={{ color: T.offWhite, opacity: 0.7 }}>Polling Unit:</span>
                <span style={{ color: T.goldLt, fontWeight: 600 }}>{voter.pollingUnit}</span>
              </div>
            </div>
            <div
              style={{
                width: 90,
                height: 110,
                borderRadius: 8,
                background: "rgba(0,0,0,0.3)",
                border: "2px solid rgba(255,255,255,0.15)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 32 }}>👤</span>
              <span style={{ fontSize: 9, color: T.white, opacity: 0.5, letterSpacing: "0.05em" }}>NIMC FOTO</span>
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: 22, width: "100%", padding: "14px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
            onClick={() => onPass(voter)}
          >
            Confirm & Proceed to Biometric Stage II →
          </button>
        </div>
      )}

      <div
        style={{
          boxSizing: "border-box",
          padding: "12px 14px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 8,
          fontSize: 12,
          color: T.white,
          opacity: 0.7,
        }}
      >
        <span style={{ fontWeight: 600, color: T.goldLt }}>💡 Sandbox Demo NINs:</span>
        <div style={{ display: "flex", gap: 16, marginTop: 6, fontFamily: "monospace" }}>
          {demoNINs.map((demo) => (
            <span
              key={demo}
              style={{ cursor: "pointer", borderBottom: `1px dashed ${T.gold}`, paddingBottom: 2 }}
              onClick={() => {
                setNin(demo);
                setState("idle");
                setMsg("");
              }}
            >
              {demo}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
