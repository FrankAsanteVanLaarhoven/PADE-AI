import type { CollectedDemonstration } from "./collected.js";
import type { FeedRecord } from "./feeds.js";

export interface RuntimeDelta {
  demonstrations: { id: string; review: "pending" | "confirmed"; operator?: "admit" | "quarantine" | "reject"; actor?: string; at?: string }[];
  verdicts: { id: string; state: "pending" | "confirmed"; operator?: "allow" | "conditional" | "deny"; actor?: string; at?: string }[];
  acquisitions: { id: string; state: "open" | "scheduled" | "dismissed"; actor?: string; at?: string }[];
  audit: { id: string; at: string; actor: string; action: string; subjectKind: string; subjectId: string; session: boolean; signature?: string }[];
  auditSeq: number;
}

export interface LedgerSnapshot {
  runtime: RuntimeDelta;
  feeds: FeedRecord[];
  collected: CollectedDemonstration[];
}

export interface Ledger {
  load(): Promise<LedgerSnapshot | null>;
  save(snapshot: LedgerSnapshot): Promise<void>;
}

export class MemoryLedger implements Ledger {
  private snapshot: LedgerSnapshot | null = null;

  async load(): Promise<LedgerSnapshot | null> {
    return this.snapshot ? structuredClone(this.snapshot) : null;
  }

  async save(snapshot: LedgerSnapshot): Promise<void> {
    this.snapshot = structuredClone(snapshot);
  }
}
