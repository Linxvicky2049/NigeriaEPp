import { useState, useRef, useEffect } from "react";
import { Voter } from "../types";
import { T, sleep } from "../utils";
import { Camera, RefreshCw, UserCheck, ShieldAlert, Cpu } from "lucide-react";

interface FaceMatcherProps {
  voter: Voter;
  onPass: () => void;
  onFail: (reason: string) => void;
}

export default function FaceMatcher({ voter, onPass, onFail }: FaceMatcherProps) {
  const [state, setState] = useState<"idle" | "capturing" | "verifying" | "pass" | "fail">("idle");
  const [result, setResult] = useState<{ match: boolean; confidence: number; reason: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  async function startCapture() {
    setState("capturing");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      setState("idle");
      alert("Permission to access local camera denied.");
    }
  }

  async function captureAndVerify() {
    if (!videoRef.current || !canvasRef.current) return;
    setState("verifying");

    // Grab picture frame from Canvas
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    const livePhotoData = canvas.toDataURL("image/jpeg", 0.85);

    // Stop live track during matching
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Call server-side API proxy which uses the Gemini API safely
    try {
      const resp = await fetch("/api/biometric/face/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          livePhoto: livePhotoData,
          nin: voter.nin,
        }),
      });
      const data = await resp.json();

      setResult(data);
      if (data.match) {
        setState("pass");
      } else {
        setState("fail");
        onFail(data.reason || "AI Facial comparison mismatch.");
      }
    } catch (e: any) {
      setState("fail");
      setResult({
        match: false,
        confidence: 0,
        reason: "Network error calling secure biometric face-match server.",
      });
      onFail("Biometric matching server connection lost.");
    }
  }

  return (
    <div className="animate-in" id="face-matcher" style={{ maxWidth: 640, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "'JetBrains Mono', monospace", color: "#22D3EE", fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
        Step 3 — High-Fidelity Facial Bio-Match
      </h2>
      <p style={{ color: T.textLt, fontSize: 14, marginBottom: 24 }}>
        The multi-modal verification system takes a high-definition snapshot of your face and feeds it alongside your registered NIMC voter record into our secure server-side Gemini liveness and matching engine to block injection or mask spoofing.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Booth Frame */}
        <div>
          <div style={{ fontSize: 11, color: T.goldLt, fontWeight: 600, letterSpacing: ".06em", marginBottom: 8 }}>
            LIVE BOOTH FEED
          </div>
          <div
            style={{
              position: "relative",
              borderRadius: 12,
              background: "#000",
              aspectRatio: "3/4",
              overflow: "hidden",
              border: `2px solid ${
                state === "pass" ? T.gold : state === "fail" ? T.danger : "rgba(255,255,255,0.15)"
              }`,
              boxShadow: "0 6px 18px rgba(0,0,0,0.4)",
            }}
          >
            <video
              ref={videoRef}
              muted
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            {state === "verifying" && <div className="scan-line" />}

            {state === "idle" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,0,0,0.8)",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <Camera size={32} color={T.white} style={{ margin: "0 auto 12px", opacity: 0.6 }} />
                  <button className="btn btn-primary" onClick={startCapture}>
                    Initialize Scan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NIMC profile card */}
        <div>
          <div style={{ fontSize: 11, color: T.goldLt, fontWeight: 600, letterSpacing: ".06em", marginBottom: 8 }}>
            NIM-CORE ID RECORD ({voter.nin})
          </div>
          <div
            style={{
              padding: 24,
              borderRadius: 12,
              background: "rgba(11, 94, 62, 0.2)",
              border: `2px solid rgba(43, 122, 85, 0.4)`,
              aspectRatio: "3/4",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "rgba(200, 150, 12, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                marginBottom: 16,
                border: `1px solid ${T.gold}`,
              }}
            >
              🧑‍✈️
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.goldLt }}>
              {voter.firstname} {voter.surname}
            </div>
            <div style={{ fontSize: 12, color: T.white, opacity: 0.8, marginTop: 4 }}>
              DOB: {voter.dob}
            </div>
            <div style={{ fontSize: 11, color: T.textLt, marginTop: 12, lineHeight: 1.5, padding: "0 10px" }}>
              NIMC Biometric ID template uploaded during citizen census indexation matches registry hash structure.
            </div>
          </div>
        </div>
      </div>

      {state === "capturing" && (
        <button
          className="btn btn-primary"
          style={{ width: "100%", padding: "14px", fontWeight: 600 }}
          onClick={captureAndVerify}
        >
          Capture Frame & Verify Matching
        </button>
      )}

      {state === "verifying" && (
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <RefreshCw className="animate-spin" color={T.goldLt} size={20} />
          <div style={{ fontSize: 13, color: T.white, opacity: 0.8 }}>
            Calling server-side biometrics module. Querying Gemini to execute face structure analysis…
          </div>
        </div>
      )}

      {state === "pass" && result && (
        <div
          className="card animate-in"
          style={{
            border: `1px solid #4AE09A`,
            background: "rgba(11, 148, 94, 0.15)",
            padding: 20,
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(74,224,154,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <UserCheck size={22} color="#4AE09A" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: T.white, marginBottom: 4 }}>
                Facial Biometric Match Verified ✓
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <span className="badge badge-green">CLASSIFIED IDENTICAL</span>
                <span style={{ fontSize: 12, color: T.gold, fontWeight: 500 }}>
                  Match Confidence: {Math.round(result.confidence * 100)}%
                </span>
              </div>
              <p style={{ fontSize: 13, color: T.offWhite, opacity: 0.9, lineHeight: 1.4, marginBottom: 14 }}>
                {result.reason}
              </p>
              <button
                className="btn btn-primary"
                style={{ width: "100%", py: 12 }}
                onClick={onPass}
              >
                Proceed to Stage IV: Infrared Retina Verification →
              </button>
            </div>
          </div>
        </div>
      )}

      {state === "fail" && result && (
        <div
          className="card animate-in"
          style={{
            border: `1px solid ${T.dangerLt}`,
            background: "rgba(192, 57, 43, 0.15)",
            padding: 20,
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(231,76,60,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ShieldAlert size={22} color={T.dangerLt} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#FFA69E", marginBottom: 6 }}>
                Critical Identity Flag Alert
              </div>
              <p style={{ fontSize: 13, color: "#FFD0CB", lineHeight: 1.4, marginBottom: 14 }}>
                {result.reason}
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setState("idle");
                    setResult(null);
                  }}
                >
                  Recalibrate / Retry Scan
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => onFail(result.reason || "Biometric failure")}
                >
                  Escalate Incident Lockout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
