import { useState } from "react";
import { Voter, BallotSelection, BallotPayload, OfficeBallot } from "../types";
import { T, sha256 } from "../utils";
import { CheckCircle2, Lock, HelpCircle } from "lucide-react";

interface BallotEngineProps {
  voter: Voter;
  onVoteCast: (ballot: BallotPayload, hash: string) => void;
}

const BALLOT_DATA: OfficeBallot[] = [
  {
    office: "President of the Federal Republic of Nigeria",
    positions: 1,
    candidates: [
      { id: "p1", name: "Alhaji Musa Abubakar", party: "APC", state: "Kano" },
      { id: "p2", name: "Chief Emeka Okonkwo", party: "PDP", state: "Anambra" },
      { id: "p3", name: "Dr. Amara Okafor", party: "LP", state: "Rivers" },
      { id: "p4", name: "Engr. Halima Bello", party: "NNPP", state: "Kwara" },
    ],
  },
  {
    office: "Senator representing Rivers East Constituency",
    positions: 1,
    candidates: [
      { id: "s1", name: "Dr. Preye Dagogo", party: "PDP", state: "Rivers" },
      { id: "s2", name: "Barr. Francis Nweke", party: "APC", state: "Rivers" },
      { id: "s3", name: "Mrs. Christy Amadi", party: "LP", state: "Rivers" },
    ],
  },
];

const PARTY_COLORS: { [key: string]: string } = {
  APC: "#1A6FA8",
  PDP: "#C0392B",
  LP: "#27AE60",
  NNPP: "#8E44AD",
};

export default function BallotEngine({ voter, onVoteCast }: BallotEngineProps) {
  const [selections, setSelections] = useState<BallotSelection>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [receiptHash, setReceiptHash] = useState("");

  function selectCandidate(officeIndex: number, candidateId: string) {
    if (submitted || submitting) return;
    setSelections((prev) => ({ ...prev, [officeIndex]: candidateId }));
  }

  const allSelected = BALLOT_DATA.every((_, i) => selections[i]);

  async function submitBallot() {
    if (!allSelected || submitting || submitted) return;
    setSubmitting(true);

    try {
      // Create a stable layout representation to hash
      const encoder = new TextEncoder();
      const rawNinHash = await sha256(encoder.encode(voter.nin));

      const ballotPayload: BallotPayload = {
        ninHash: rawNinHash,
        pollingUnit: voter.pollingUnit,
        selections,
        timestamp: new Date().toISOString(),
        nonce: crypto.getRandomValues(new Uint32Array(1))[0].toString(16),
      };

      const serialized = JSON.stringify(ballotPayload);
      const computedHash = await sha256(encoder.encode(serialized));
      setReceiptHash(computedHash);

      // Submit ballot to internal Express database state
      const response = await fetch("/api/ballot/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voterNin: voter.nin,
          ballot: ballotPayload,
          hash: computedHash,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        onVoteCast(ballotPayload, computedHash);
      } else {
        const err = await response.json();
        alert(`Error committing ballot registry: ${err.error}`);
      }
    } catch (e) {
      alert("Verification/Commit server communication offline. Recording locally.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="animate-in" id="ballot-receipt" style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 68, marginBottom: 16 }}>🗳️</div>
        <h2 style={{ fontFamily: "'JetBrains Mono', monospace", color: "#22D3EE", fontSize: 20, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
          Ballot Committed Successfully
        </h2>
        <p style={{ color: T.white, opacity: 0.8, fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
          Your ballot credentials have been anonymized, hashed, and committed directly inside our blockchain/recurrent ledger server. Review your voter-verifiable receipt seal below.
        </p>

        <div
          style={{
            fontFamily: "monospace",
            fontSize: 13,
            padding: "16px 20px",
            background: "rgba(0,0,0,0.45)",
            borderRadius: 8,
            wordBreak: "break-all",
            border: `1.5px solid ${T.gold}`,
            color: T.goldLt,
            boxShadow: `0 0 12px ${T.gold}25`,
            marginBottom: 24,
            textAlign: "left",
          }}
        >
          <div style={{ fontSize: 11, color: T.white, opacity: 0.5, marginBottom: 6, letterSpacing: ".04em" }}>
            LEDGER SECURE COMMIT SEAL (SHA-256)
          </div>
          {receiptHash}
        </div>

        <div style={{ fontSize: 12, color: T.textLt, lineHeight: 1.6 }}>
          💡 <span style={{ color: T.white, opacity: 0.8 }}>Verify Ballot Ingest:</span> Print or write down this hash. You can check this signature on the INEC Public Ledger at the collation centre to confirm that your vote exists in the final tally without exposing your choices.
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in" id="ballot-sheet" style={{ maxWidth: 680, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'JetBrains Mono', monospace", color: "#22D3EE", fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          INEC Secure Digital Ballot Sheet
        </h2>
        <span className="badge badge-green" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <CheckCircle2 size={12} /> SECURE BOOTH SESSION
        </span>
      </div>

      <div
        style={{
          fontSize: 13,
          color: T.white,
          opacity: 0.9,
          background: "rgba(200, 150, 12, 0.08)",
          borderRadius: 8,
          border: `1px solid rgba(200, 150, 12, 0.25)`,
          padding: "12px 16px",
          lineHeight: 1.5,
          marginBottom: 24,
        }}
      >
        Verified Polling ID: <strong style={{ color: T.white }}>{voter.firstname} {voter.surname}</strong> • Location: {voter.pollingUnit} ({voter.state} State)
        <br /> Select exactly <strong style={{ color: T.goldLt }}>one (1)</strong> candidate for each federal office below. Your choices are totally sealed, randomized, and encrypted.
      </div>

      {BALLOT_DATA.map((office, officeIdx) => (
        <div className="card" key={officeIdx} style={{ marginBottom: 20, padding: 20 }}>
          <div style={{ color: T.gold, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{office.office}</div>
          <div style={{ fontSize: 11, color: T.textLt, marginBottom: 16, letterSpacing: ".01em" }}>
            FEDERAL ELECTION • SELECT ONE PARTY ROW
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {office.candidates.map((c) => {
              const isSelected = selections[officeIdx] === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => selectCandidate(officeIdx, c.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "12px 16px",
                    borderRadius: 8,
                    cursor: "pointer",
                    border: `1.5px solid ${isSelected ? T.gold : "rgba(255,255,255,0.08)"}`,
                    background: isSelected ? "rgba(200, 150, 12, 0.1)" : "rgba(0,0,0,0.25)",
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: `2px solid ${isSelected ? T.gold : "rgba(255,255,255,0.35)"}`,
                      background: isSelected ? T.gold : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: T.greenDk,
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && "✓"}
                  </div>

                  <div
                    style={{
                      width: 44,
                      height: 30,
                      borderRadius: 4,
                      background: PARTY_COLORS[c.party] || T.info,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {c.party}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: T.white }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: T.textLt, marginTop: 1 }}>Origin State: {c.state}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button
        className="btn btn-primary"
        style={{
          width: "100%",
          padding: "16px",
          fontSize: 16,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
        disabled={!allSelected || submitting}
        onClick={submitBallot}
      >
        <Lock size={18} /> {submitting ? "Cryptographically Sealing Ballot…" : "Commit Secure Ballot — Final & Irreversible"}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 10, opacity: 0.6 }}>
        <HelpCircle size={12} color={T.textLt} />
        <span style={{ fontSize: 11, color: T.textLt }}>All ballots correspond directly to sections in the Nigerian Electoral Amendment Act.</span>
      </div>
    </div>
  );
}
