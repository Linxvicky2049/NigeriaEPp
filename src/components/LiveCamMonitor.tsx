import { useState, useEffect, useRef } from "react";
import { Voter, AVFlag, AVManifest, AVChunkPayload } from "../types";
import { T, formatTime } from "../utils";
import { Camera, Radio, ShieldAlert, CheckCircle2, AlertOctagon } from "lucide-react";

interface LiveCamMonitorProps {
  voter: Voter;
  sessionId: string;
  onPass: (result: { avManifest: AVManifest | null }) => void;
  onFlag: (flag: AVFlag) => void;
}

// ─── Cloud AV Recorder Implementation ───
class CloudRecorder {
  sessionId: string;
  stream: MediaStream;
  chunks: Blob[] = [];
  startTime: number | null = null;
  recorder: MediaRecorder | null = null;
  uploadLog: AVChunkPayload[] = [];
  onFlag: ((reason: string) => void) | null = null;
  onChunkUploaded: ((idx: number, payload: AVChunkPayload) => void) | null = null;

  constructor(stream: MediaStream, sessionId: string) {
    this.sessionId = sessionId;
    this.stream = stream;
  }

  start(chunkMs = 5000) {
    this.startTime = Date.now();
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";

    this.recorder = new MediaRecorder(this.stream, { mimeType });
    this.recorder.ondataavailable = async (e) => {
      if (e.data && e.data.size > 0) {
        this.chunks.push(e.data);
        const idx = this.chunks.length - 1;
        await this._uploadChunk(e.data, idx);
      }
    };
    this.recorder.start(chunkMs);
  }

  async _uploadChunk(blob: Blob, idx: number) {
    const ab = await blob.arrayBuffer();
    // Simulate computing SHA-256 hash or send to server
    const payload: AVChunkPayload = {
      sessionId: this.sessionId,
      chunkIndex: idx,
      timestamp: formatTime(),
      mimeType: blob.type,
      size: blob.size,
      sha256: "AV-HASH-" + Math.random().toString(36).slice(2, 10).toUpperCase(),
    };
    this.uploadLog.push(payload);
    
    // Server-side upload simulation via POST
    try {
      await fetch("/api/av/upload-chunk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      console.log(`[AV] Chunk ${idx} uploaded — ${blob.size} bytes`);
    } catch (err) {
      console.error("[AV] Upload failed:", err);
    }
    
    if (this.onChunkUploaded) this.onChunkUploaded(idx, payload);
    return payload;
  }

  async stop(): Promise<AVManifest> {
    return new Promise((resolve) => {
      if (!this.recorder) return;
      this.recorder.onstop = () => {
        const fullBlob = new Blob(this.chunks, { type: this.chunks[0]?.type });
        const manifest: AVManifest = {
          sessionId: this.sessionId,
          startTime: new Date(this.startTime || Date.now()).toISOString(),
          endTime: new Date().toISOString(),
          durationSec: Math.round((Date.now() - (this.startTime || Date.now())) / 1000),
          totalBytes: fullBlob.size,
          chunkCount: this.chunks.length,
          sha256: "MANIFEST-SHA-" + Math.random().toString(36).slice(2, 12).toUpperCase(),
          mimeType: fullBlob.type,
          uploadLog: this.uploadLog,
          url: `https://nses-av.gov.ng/sessions/${this.sessionId}/recording.webm`,
        };
        resolve(manifest);
      };
      this.recorder.stop();
    });
  }

  flag(reason: string) {
    console.warn("[AV SURVEILLANCE FLAG TRIGGERED]", reason);
    if (this.onFlag) this.onFlag(reason);
  }
}

// ─── Simple Canvas Frame Analyzer Heuristic ───
function analyzeFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { faceCount: 1, luminance: 0.5 };
  
  canvas.width = video.videoWidth || 320;
  canvas.height = video.videoHeight || 240;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  try {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    let lum = 0;
    for (let i = 0; i < d.length; i += 4) {
      lum += d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    }
    lum = lum / (d.length / 4) / 255;

    // Introduce stable realistic face variation for the sake of demo
    // and make sure multi-person and low-light states can be toggled manually or triggered
    const rand = Math.random();
    let faceCount = 1;
    if (rand < 0.04) {
      faceCount = 2; // Simulated multi-person in frame violation
    } else if (rand > 0.96) {
      faceCount = 0; // Simulated no-one in frame
    }

    return { faceCount, luminance: lum };
  } catch (err) {
    return { faceCount: 1, luminance: 0.5 };
  }
}

export default function LiveCamMonitor({ voter, sessionId, onPass, onFlag }: LiveCamMonitorProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recorderRef = useRef<CloudRecorder | null>(null);
  const intervalRef = useRef<any | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [camState, setCamState] = useState<"idle" | "requesting" | "active" | "flagged" | "ready">("idle");
  const [faceCount, setFaceCount] = useState<number>(1);
  const [luminance, setLuminance] = useState<number>(0.4);
  const [chunkCount, setChunkCount] = useState<number>(0);
  const [flagReason, setFlagReason] = useState("");
  const [recSecs, setRecSecs] = useState(0);

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  async function startCamera() {
    setCamState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Initialize chunked multi-media upload
      const rec = new CloudRecorder(stream, sessionId);
      rec.onChunkUploaded = (idx) => {
        setChunkCount(idx + 1);
      };
      
      rec.onFlag = async (reason) => {
        const flagEvent: AVFlag = {
          sessionId,
          reason,
          ts: formatTime(),
          status: "Under Review"
        };
        onFlag(flagEvent);
        
        // POST to serve state database
        try {
          await fetch("/api/flag/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(flagEvent)
          });
        } catch (e) {
          console.error(e);
        }
      };

      rec.start();
      recorderRef.current = rec;
      setCamState("active");

      let elapsed = 0;
      intervalRef.current = setInterval(() => {
        if (!videoRef.current || !canvasRef.current) return;
        elapsed++;
        setRecSecs(elapsed);

        // Frame heuristics
        const result = analyzeFrame(videoRef.current, canvasRef.current);
        setFaceCount(result.faceCount);
        setLuminance(result.luminance);

        if (result.faceCount === 0) {
          doFlag("Surveillance Trigger: No face detected in camera viewport.");
        } else if (result.faceCount > 1) {
          doFlag(`Surveillance Trigger: Multi-voter threshold violated. ${result.faceCount} faces scanned.`);
        } else if (result.luminance < 0.05) {
          doFlag("Heuristic Alert: Critical low-lighting in polling booth.");
        }

        if (elapsed >= 5 && camState !== "flagged") {
          setCamState("ready");
        }
      }, 1000);
    } catch (err: any) {
      setCamState("idle");
      alert("booth camera registration error: " + err.message);
    }
  }

  async function doFlag(reason: string) {
    setFlagReason(reason);
    setCamState("flagged");
    recorderRef.current?.flag(reason);
    clearInterval(intervalRef.current);
    
    const flagEvent: AVFlag = {
      sessionId,
      reason,
      ts: formatTime(),
      status: "Under Review"
    };
    onFlag(flagEvent);

    try {
      await fetch("/api/flag/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flagEvent)
      });
    } catch (e) {
      console.error(e);
    }
  }

  async function proceed() {
    clearInterval(intervalRef.current);
    const avManifest = recorderRef.current ? await recorderRef.current.stop() : null;
    
    // Stop tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    
    onPass({ avManifest });
  }

  const faceOk = faceCount === 1;
  const lumOk = luminance > 0.08;

  return (
    <div className="animate-in" id="live-cam-monitor" style={{ maxWidth: 760, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "'JetBrains Mono', monospace", color: "#22D3EE", fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
        Step 2 — Surveillance Camera Calibration & Booth Security Check
      </h2>
      <p style={{ color: T.textLt, fontSize: 14, marginBottom: 20 }}>
        An active secure AV container is mapped to your vote. You must remain alone in the polling booth. Artificial intelligence logs multi-person and coaching attempts immediately.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 20 }}>
        {/* WebRTC Video container */}
        <div
          style={{
            position: "relative",
            borderRadius: 12,
            overflow: "hidden",
            background: "#000",
            aspectRatio: "4/3",
            border: `2px solid ${
              camState === "flagged"
                ? T.danger
                : camState === "ready"
                ? T.gold
                : "rgba(255,255,255,0.15)"
            }`,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          <video
            ref={videoRef}
            muted
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {camState === "idle" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                background: "rgba(6, 17, 12, 0.9)",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "rgba(200,150,12,0.1)",
                  border: `1px solid ${T.gold}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Camera size={30} color={T.goldLt} />
              </div>
              <div style={{ textAlign: "center", padding: "0 24px" }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Verify Camera Connection</div>
                <div style={{ fontSize: 12, color: T.textLt, marginBottom: 16 }}>
                  Click to establish a secure WebRTC audio/video link.
                </div>
                <button className="btn btn-primary" onClick={startCamera}>
                  Authorize Device Feed
                </button>
              </div>
            </div>
          )}

          {camState === "requesting" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(8,31,22,0.95)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <Radio className="animate-spin" color={T.goldLt} size={36} />
                <div style={{ fontSize: 13, color: T.goldLt, marginTop: 12, fontWeight: 500 }}>
                  Exchanging WebRTC handshake…
                </div>
              </div>
            </div>
          )}

          {camState === "flagged" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(192,57,43,0.92)",
                zIndex: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                textAlign: "center",
              }}
            >
              <AlertOctagon size={48} color="#fff" style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 18, fontWeight: 700, color: T.white }}>BOOTH SURVEILLANCE CRITICAL WARNING</div>
              <div style={{ fontSize: 13, marginTop: 10, lineHeight: 1.5, background: "rgba(0,0,0,0.25)", padding: "12px 16px", borderRadius: 8, maxWidth: "90%" }}>
                {flagReason}
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 20, background: T.white, color: T.danger }}
                onClick={() => {
                  setCamState("idle");
                  setFlagReason("");
                }}
              >
                Reset Calibration Feed
              </button>
            </div>
          )}

          {/* Rec timer badge */}
          {(camState === "active" || camState === "ready") && (
            <div
              style={{
                position: "absolute",
                top: 14,
                left: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(0,0,0,0.75)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 20,
                padding: "6px 14px",
              }}
            >
              <span className="animate-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: T.dangerLt, display: "inline-block" }}></span>
              <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "monospace", color: T.white }}>
                SECURE AV LINK: {String(Math.floor(recSecs / 60)).padStart(2, "0")}:{String(recSecs % 60).padStart(2, "0")}
              </span>
            </div>
          )}

          {/* Physical framing aid overlay */}
          {(camState === "active" || camState === "ready") && (
            <div
              style={{
                position: "absolute",
                top: "12%",
                left: "28%",
                right: "28%",
                bottom: "16%",
                border: `2px dashed ${faceOk ? T.goldLt : T.dangerLt}`,
                borderRadius: "50%",
                pointerEvents: "none",
                transition: "border-color 0.3s",
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.3)",
              }}
            />
          )}
        </div>

        {/* Telemetry Stats Side Navigation */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: T.goldLt, fontWeight: 600, letterSpacing: ".06em", marginBottom: 12 }}>
              AV COMPLIANCE STATS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: T.offWhite }}>Faces Found:</span>
                <span className={`badge ${faceCount === 1 ? "badge-green" : "badge-danger"}`}>
                  {faceCount}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: T.offWhite }}>Lux Density:</span>
                <span className={`badge ${lumOk ? "badge-green" : "badge-danger"}`}>
                  {Math.round(luminance * 100)}%
                </span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: T.goldLt, fontWeight: 600, letterSpacing: ".06em", marginBottom: 12 }}>
              CLOUD AV SHARDS
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.4 }}>
              <span style={{ color: T.white, opacity: 0.7 }}>Booths Relay Node:</span>
              <div style={{ color: "#4AE09A", fontFamily: "monospace", fontSize: 11, fontWeight: 600, marginTop: 2 }}>
                relay-ng.etc.inec.gov
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ color: T.white, opacity: 0.6 }}>Uploaded Chunks:</span>
                <span style={{ color: T.gold, fontWeight: 600 }}>{chunkCount} (AES-256)</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 11, color: T.goldLt, fontWeight: 600, letterSpacing: ".06em", marginBottom: 12 }}>
              CALIBRATION CHECKLIST
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
              {[
                { label: "Booth camera attached", done: camState !== "idle" && camState !== "requesting" },
                { label: "Intelligent facial outline", done: faceOk && camState !== "idle" },
                { label: "Luminance threshold optimal", done: lumOk && camState !== "idle" },
                { label: "Surveillance log clean (5s)", done: camState === "ready" },
              ].map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {item.done ? (
                    <CheckCircle2 size={14} color="#4AE09A" style={{ flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1px dashed rgba(255,255,255,0.4)", flexShrink: 0 }} />
                  )}
                  <span style={{ color: item.done ? T.white : T.textLt }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {camState === "ready" && (
            <button
              className="btn btn-primary animate-in"
              style={{ width: "100%", padding: "12px", fontSize: 14, fontWeight: 600 }}
              onClick={proceed}
            >
              Confirm Booth Calibration →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
