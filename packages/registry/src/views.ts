import type { Origin } from "@pade/domain";

export type Tone = "ok" | "warn" | "bad" | "muted";

export interface Field {
  label: string;
  value: string;
  mono?: boolean;
  tone?: Tone;
}

export interface Panel {
  title: string;
  note?: string;
  fields?: Field[];
  columns?: string[];
  rows?: { cells: string[]; tones?: (Tone | undefined)[] }[];
}

export interface LinkRef {
  kind: string;
  id: string;
  relation: string;
  direction: "out" | "in";
}

export interface ActionSpec {
  id: string;
  label: string;
  group: "review" | "verdict" | "acquisition";
}

export interface Workspace {
  kind: string;
  id: string;
  title: string;
  subtitle: string;
  origin: Origin;
  source: string;
  originNote: string;
  summary: Field[];
  overview: Panel[];
  evidence: Panel[];
  lineage: LinkRef[];
  runs: { kind: string; id: string; status: string }[];
  safety: { kind: string; id: string; summary: string }[];
  decisions: { id: string; gate: string; decision: string; state: string; tone?: Tone }[];
  activity: { at: string; actor: string; action: string; session: boolean }[];
  actions: ActionSpec[];
}

export interface ListRow {
  kind: string;
  id: string;
  cells: Record<string, string>;
  tones?: Record<string, Tone>;
  inspector: Field[];
}

export interface ListView {
  title: string;
  lede: string;
  source: string;
  origin: Origin;
  unavailable?: { reason: string; contract: string };
  columns: { key: string; label: string; mono?: boolean; align?: "right" }[];
  rows: ListRow[];
}

export interface Overview {
  environment: string;
  release: string | null;
  banner: string;
  health: { label: string; value: string; href: string; tone?: Tone }[];
  deployments: ListView;
  queue: { id: string; task: string; policy: string; tone?: Tone }[];
  verdicts: { id: string; gate: string; recommendation: string; subject: string; tone?: Tone }[];
  failures: { id: string; task: string; mode: string }[];
  safety: { id: string; summary: string; at: string }[];
  adapters: { id: string; name: string; contract: string; reason: string }[];
  evidence: { present: number; total: number; blocked: string[] };
}
