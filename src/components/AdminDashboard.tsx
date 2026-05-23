import { useState, useEffect } from "react";
import { T } from "../utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Radio, RefreshCw, AlertTriangle, Database, Activity } from "lucide-react";

const PARTY_COLORS: { [key: string]: string } = {
  APC: "#1A6FA8",
  PDP: "#C0392B",
  LP: "#27AE60",
  NNPP: "#8E44AD",
};

export default function AdminDashboard() {
  const [tab, setTab] = useState<"results" | "states" | "census" | "flags" | "auditlog">("results");
  const [loading, setLoading] = useState(true);

  // States fetched dynamically from server
  const [results, setResults] = useState<any[]>([]);
  const [census, setCensus] = useState<any[]>([]);
  const [statesResults, setStatesResults] = useState<any[]>([]);
  const [flags, setFlags] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [counters, setCounters] = useState({
    totalRegistered: "93,469,008",
    votesCast: "37,758,751",
    turnout: "40.4%",
    flaggedSessions: "0",
    validVotes: "37,538,751",
    rejectedVotes: "220,000",
  });

  async function fetchMetrics() {
    setLoading(true);
    try {
      const resp = await fetch("/api/admin/metrics");
      if (resp.ok) {
        const data = await resp.json();
        setResults(data.partyResults);
        setStatesResults(data.statesResults);
        setCensus(data.censusData);
        setFlags(data.flags);
        setAuditLogs(data.auditLogs);
        setCounters(data.counters);
      }
    } catch (e) {
      console.error("Error fetching live metrics:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(() => {
      fetchMetrics();
    }, 5000); // Dynamic poll every 5 seconds!
    return () => clearInterval(interval);
  }, []);

  const totalVotesCast = results.reduce((sum, item) => sum + item.votes, 0);

  return (
    <div className="animate-in" id="admin-dashboard" style={{ maxWidth: 960, margin: "0 auto", padding: "16px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "'JetBrains Mono', monospace", color: "#22D3EE", fontSize: 20, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
            INEC Central Command & Collation Centre
          </h2>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: T.textLt, display: "flex", alignItems: "center", gap: 5 }}>
            <Radio size={12} className="animate-pulse" style={{ color: "#34D399" }} />
            REAL-TIME BIOMETRIC VOTER CENSUS INDICATORS: ONLINE SECURE LINK
          </div>
        </div>
        <button
          className="btn btn-secondary"
          onClick={fetchMetrics}
          style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Sync Now
        </button>
      </div>

      {/* Grid counters strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Registered", value: counters.totalRegistered, color: T.white },
          { label: "Valid Ballots Cast", value: counters.validVotes, color: T.goldLt },
          { label: "Booths Turnout Rate", value: counters.turnout, color: "#4AE09A" },
          { label: "Active Surveillance Flags", value: counters.flaggedSessions, color: flags.length > 0 ? T.dangerLt : T.white },
        ].map((c) => (
          <div
            key={c.label}
            style={{
              background: "rgba(0,0,0,0.3)",
              borderRadius: 10,
              padding: "16px 18px",
              border: "1px solid rgba(43, 122, 85, 0.25)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ fontSize: 10, color: T.textLt, marginBottom: 6, letterSpacing: ".06em", fontWeight: 600 }}>
              {c.label.toUpperCase()}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Admin Tab Control List */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 24,
          borderBottom: "1px solid rgba(43, 122, 85, 0.3)",
          overflowX: "auto",
        }}
      >
        {[
          { key: "results", label: "National Electoral Results" },
          { key: "states", label: "Aggregation by State" },
          { key: "census", label: "Demographic Census Insights" },
          { key: "flags", label: `Camera Surveillance Monitor (${flags.length})` },
          { key: "auditlog", label: "Ledger Audit Trail" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            style={{
              padding: "10px 18px",
              fontSize: 13,
              background: "none",
              border: "none",
              borderBottom: tab === t.key ? `2.5px solid ${T.gold}` : "2.5px solid transparent",
              color: tab === t.key ? T.goldLt : T.textLt,
              fontWeight: tab === t.key ? 600 : 400,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: results */}
      {tab === "results" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24, minHeight: 280 }}>
            {/* Recharts Bar */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: T.goldLt, fontWeight: 600, marginBottom: 14 }}>
                PARTY DECISION TALLY (BAR CHART REPRESENTATION)
              </div>
              <div style={{ width: "100%", height: 230 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: T.textLt, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fill: T.textLt, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v.toLocaleString())}
                    />
                    <Tooltip
                      formatter={(v) => [v.toLocaleString(), "Total Ballots"]}
                      contentStyle={{ background: T.greenDk, border: "none", borderRadius: 8, color: T.white }}
                    />
                    <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
                      {results.map((r, i) => (
                        <Cell key={i} fill={PARTY_COLORS[r.name] || T.info} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recharts Pie */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: T.goldLt, fontWeight: 600, marginBottom: 14 }}>
                NATIONAL SHARE (PERCENT)
              </div>
              <div style={{ width: "100%", height: 230 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={results}
                      dataKey="votes"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {results.map((r, i) => (
                        <Cell key={i} fill={PARTY_COLORS[r.name] || T.info} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [v.toLocaleString(), "Votes"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: T.goldLt, fontWeight: 600, marginBottom: 16, letterSpacing: ".04em" }}>
              CANDIDATES PERFORMANCE MATRIX
            </div>
            {results
              .sort((a, b) => b.votes - a.votes)
              .map((r, idx) => {
                const percentage = totalVotesCast > 0 ? (r.votes / totalVotesCast) * 100 : 0;
                return (
                  <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 18, color: T.textLt, fontSize: 12, textAlign: "right" }}>{idx + 1}.</div>
                    <div
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: 4,
                        background: PARTY_COLORS[r.name] || T.info,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#fff",
                      }}
                    >
                      {r.name}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="progress-bar">
                        <div
                          style={{
                            height: "100%",
                            background: PARTY_COLORS[r.name] || T.goldLt,
                            width: `${percentage}%`,
                            borderRadius: 2,
                            transition: "width 1s ease",
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, minWidth: 100, textAlign: "right" }}>
                      {r.votes.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: T.goldLt, minWidth: 50, textAlign: "right" }}>
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB: states */}
      {tab === "states" && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: T.goldLt, fontWeight: 600, marginBottom: 20 }}>
            TERRITORIAL PARTY DEBATE SHARE (APC vs PDP vs LP • MILLIONS OF VOTES)
          </div>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statesResults} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="state" tick={{ fill: T.textLt, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.textLt, fontSize: 11 }} axisLine={false} tickLine={false} unit="M" />
                <Tooltip contentStyle={{ background: T.greenDk, border: "none", borderRadius: 8, color: T.white }} />
                <Bar dataKey="apc" name="APC" fill={PARTY_COLORS.APC} radius={[3, 3, 0, 0]} />
                <Bar dataKey="pdp" name="PDP" fill={PARTY_COLORS.PDP} radius={[3, 3, 0, 0]} />
                <Bar dataKey="lp" name="LP" fill={PARTY_COLORS.LP} radius={[3, 3, 0, 0]} />
                <Legend wrapperStyle={{ color: T.white, fontSize: 12, paddingTop: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB: census */}
      {tab === "census" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 13, color: T.textLt, lineHeight: 1.5 }}>
            Verified demographic indicators are accumulated asynchronously immediately upon successful biometric login. All individual entries are cryptographically hashed and separated to keep citizen votes private.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {census.map((item) => (
              <div
                className="card"
                key={item.label}
                style={{ background: "rgba(0,0,0,0.2)", display: "grid", gridTemplateColumns: "1fr 90px", alignItems: "center", padding: 18 }}
              >
                <div>
                  <div style={{ fontSize: 11, color: T.textLt, letterSpacing: ".04em", fontWeight: 600, marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: T.goldLt }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: T.white, opacity: 0.6 }}>{item.sub}</div>
                </div>
                <div style={{ opacity: 0.1, fontSize: 44, textAlign: "right" }}>📊</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: flags */}
      {tab === "flags" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {flags.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
              <Database size={40} color={T.white} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <div style={{ fontSize: 14, color: T.textLt }}>Zero active surveillance violations detected.</div>
            </div>
          ) : (
            flags.map((f, idx) => (
              <div
                className="card animate-in"
                key={idx}
                style={{
                  borderLeft: `4px solid ${
                    f.status === "Confirmed Fraud"
                      ? T.danger
                      : f.status === "Resolved"
                      ? T.greenLt
                      : T.gold
                  }`,
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: T.white, marginBottom: 4 }}>{f.reason}</div>
                    <div style={{ display: "flex", gap: 14, fontSize: 12, color: T.textLt }}>
                      <span style={{ fontFamily: "monospace", color: T.goldLt }}>Session: {f.sessionId}</span>
                      <span>Trigger: {f.ts}</span>
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      f.status === "Confirmed Fraud"
                        ? "badge-danger"
                        : f.status === "Resolved"
                        ? "badge-green"
                        : "badge-gold"
                    }`}
                  >
                    {f.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: auditlog */}
      {tab === "auditlog" && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: T.goldLt, fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <Activity size={14} /> IMMUTABLE SECURITY LEDGER RECORDS (REACTIVE UPDATE)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {auditLogs.map((log, idx) => (
              <div
                className="animate-in"
                key={idx}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  fontSize: 12,
                }}
              >
                <span style={{ color: T.textLt, minWidth: 60, fontFamily: "monospace" }}>{log.ts}</span>
                <span style={{ flex: 1, color: T.white, opacity: 0.9 }}>{log.event}</span>
                <span style={{ color: T.white, opacity: 0.5, fontFamily: "monospace", fontSize: 11 }}>NIN ID: {log.nin}</span>
                <span style={{ color: T.gold, fontFamily: "monospace", fontSize: 11 }}>SEAL-HASH: {log.hash.slice(0, 14)}…</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
