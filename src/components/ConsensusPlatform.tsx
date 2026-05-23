import { useState, useEffect } from "react";
import { ConsensusPoll } from "../types";
import { T } from "../utils";
import { FileText, Radio, BarChart2 } from "lucide-react";

export default function ConsensusPlatform() {
  const [polls, setPolls] = useState<ConsensusPoll[]>([]);
  const [voted, setVoted] = useState<{ [pollId: string]: number }>({});
  const [loading, setLoading] = useState(true);

  async function fetchPolls() {
    try {
      const resp = await fetch("/api/consensus/polls");
      if (resp.ok) {
        const data = await resp.json();
        setPolls(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function castReferendumVote(pollId: string, optionIndex: number) {
    if (voted[pollId] !== undefined) return;
    setVoted((prev) => ({ ...prev, [pollId]: optionIndex }));

    // Sync referendum ballot choice to Server State
    try {
      const resp = await fetch("/api/consensus/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId, optionIndex }),
      });
      if (resp.ok) {
        // Refresh ratios
        fetchPolls();
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchPolls();
  }, []);

  return (
    <div className="animate-in" id="consensus-platform" style={{ maxWidth: 760, margin: "0 auto", padding: "16px 24px" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'JetBrains Mono', monospace", color: "#22D3EE", fontSize: 20, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
          National Democratic Consensus Platform
        </h2>
        <p style={{ color: T.textLt, fontSize: 14, lineHeight: 1.5 }}>
          Participate in constitutional amendments, referenda, and town-hall consensus tracking. Each vote is cryptographically mapped to verified biometrics on the NIM-CORE ledger, completely preventing sybil or proxy voting.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: 30 }}>
          <span className="animate-spin" style={{ fontSize: 24, display: "inline-block" }}>⟳</span>
          <div style={{ marginTop: 8, color: T.textLt }}>Syncing polling metadata…</div>
        </div>
      ) : (
        polls.map((poll) => {
          const maxResultsIdx = poll.results.indexOf(Math.max(...poll.results));
          return (
            <div className="card" key={poll.id} style={{ marginBottom: 20, padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 12 }}>
                <div style={{ flex: 1, display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <FileText size={20} color={T.goldLt} style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.4, color: T.white }}>
                    {poll.question}
                  </div>
                </div>
                <span className="badge badge-green animate-pulse" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Radio size={10} /> {poll.status.toUpperCase()}
                </span>
              </div>

              <div style={{ fontSize: 11, color: T.textLt, marginBottom: 20 }}>
                {poll.totalVotes.toLocaleString()} Biometric-Verified Ballots • Constitutional Deadline: {poll.deadline}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                {poll.options.map((opt, idx) => {
                  const pct = poll.results[idx] || 0;
                  const isCurrentSelection = voted[poll.id] === idx;
                  const isWinner = idx === maxResultsIdx;
                  return (
                    <div key={idx}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                        <span style={{ fontWeight: isWinner ? 600 : 400, color: isWinner ? T.goldLt : T.white }}>
                          {opt} {isCurrentSelection && "• (Your Selection)"}
                        </span>
                        <span style={{ fontWeight: 600, color: isWinner ? T.goldLt : T.textLt }}>{pct.toFixed(1)}%</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          style={{
                            height: "100%",
                            borderRadius: 2,
                            width: `${pct}%`,
                            background: isWinner ? T.gold : T.greenLt,
                            transition: "width 1s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {voted[poll.id] === undefined ? (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
                  <div style={{ fontSize: 12, color: T.textLt, marginBottom: 10 }}>Cast your biometrically-verified opinion choice:</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {poll.options.map((opt, idx) => (
                      <button
                        className="btn btn-secondary"
                        key={idx}
                        style={{ padding: "8px 18px", fontSize: 12, borderRadius: 20 }}
                        onClick={() => castReferendumVote(poll.id, idx)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <BarChart2 size={16} color={T.goldLt} />
                  <span style={{ fontSize: 13, color: T.goldLt, fontWeight: 500 }}>
                    Referendum seal locked. Choice permanently aggregated onto live voting shares.
                  </span>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
