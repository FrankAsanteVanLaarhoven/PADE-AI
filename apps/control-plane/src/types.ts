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
  origin: string;
  unavailable?: { reason: string; contract: string };
  columns: { key: string; label: string; mono?: boolean; align?: "right" }[];
  rows: ListRow[];
}

export interface Workspace {
  kind: string;
  id: string;
  title: string;
  subtitle: string;
  origin: string;
  source: string;
  originNote: string;
  summary: Field[];
  overview: Panel[];
  evidence: Panel[];
  lineage: { kind: string; id: string; relation: string; direction: "out" | "in" }[];
  runs: { kind: string; id: string; status: string }[];
  safety: { kind: string; id: string; summary: string }[];
  decisions: { id: string; gate: string; decision: string; state: string; tone?: Tone }[];
  activity: { at: string; actor: string; action: string; session: boolean }[];
  actions: { id: string; label: string; group: "review" | "verdict" | "acquisition" }[];
}

export interface Meta {
  service: string;
  mode: string;
  persistence: string;
  session: string;
  auth?: string;
  environment: string;
  environments: { id: string; label: string; detail: string }[];
  release: string | null;
  policyVersion: string;
  mdvVersion: string;
  observedAt: string;
  source: string;
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
