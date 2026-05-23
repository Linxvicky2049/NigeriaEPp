export interface Voter {
  nin: string;
  surname: string;
  firstname: string;
  dob: string;
  state: string;
  ward: string;
  pollingUnit: string;
  photo: string | null;
  voted: boolean;
  gender: "M" | "F";
}

export interface BallotSelection {
  [officeIndex: number]: string;
}

export interface BallotPayload {
  ninHash: string;
  pollingUnit: string;
  selections: BallotSelection;
  timestamp: string;
  nonce: string;
}

export interface AVFlag {
  id?: string;
  sessionId?: string;
  reason: string;
  ts: string;
  status?: "Under Review" | "Confirmed Fraud" | "Resolved";
}

export interface AVChunkPayload {
  sessionId: string;
  chunkIndex: number;
  timestamp: string;
  mimeType: string;
  size: number;
  sha256: string;
  flag?: boolean;
  reason?: string;
}

export interface AVManifest {
  sessionId: string;
  startTime: string;
  endTime: string;
  durationSec: number;
  totalBytes: number;
  chunkCount: number;
  sha256: string;
  mimeType: string;
  uploadLog: AVChunkPayload[];
  url: string;
}

export interface ConsensusPoll {
  id: string;
  question: string;
  options: string[];
  results: number[];
  totalVotes: number;
  deadline: string;
  status: "active" | "closed";
}

export interface SystemSession {
  id: string;
  mode: "vote" | "admin" | "consensus";
  startTime: number;
  flags: AVFlag[];
}

export interface Candidate {
  id: string;
  name: string;
  party: "APC" | "PDP" | "LP" | "NNPP" | string;
  state: string;
}

export interface OfficeBallot {
  office: string;
  positions: number;
  candidates: Candidate[];
}

export interface AdminStats {
  totalRegistered: string;
  votesCast: string;
  turnout: string;
  flaggedSessions: string;
  validVotes: string;
  rejectedVotes: string;
}

export interface PartyResult {
  name: string;
  votes: number;
  color: string;
}

export interface StateResult {
  state: string;
  apc: number;
  pdp: number;
  lp: number;
}
