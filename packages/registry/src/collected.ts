import { admissionInputSchema, assertOrigin, evaluateAdmission, type AdmissionDecision, type AdmissionInput, type Origin } from "@pade/domain";

const LIVE: Origin = "live";

export interface CollectedDemonstration {
  id: string;
  source: string;
  origin: Origin;
  what: string;
  use: string;
  modelClass: string;
  task: string;
  review: "pending" | "confirmed" | "incomplete";
  operator?: "admit" | "quarantine" | "reject";
  actor?: string;
  at?: string;
  policy: AdmissionDecision | null;
  missing: string[];
  sampleId: string;
  capturedAt: string;
  input: AdmissionInput | null;
}

export function admitSample(sample: {
  id: string;
  source: string;
  observedAt: string;
  body: unknown;
  what: string;
  use: string;
  modelClass: string;
}): CollectedDemonstration {
  assertOrigin(LIVE, sample.source);
  const parsed = admissionInputSchema.safeParse(sample.body);
  const base = {
    id: `DAR-${sample.id}`,
    source: sample.source,
    origin: LIVE,
    what: sample.what,
    use: sample.use,
    modelClass: sample.modelClass,
    task: sample.what,
    sampleId: sample.id,
    capturedAt: sample.observedAt,
  };
  if (!parsed.success) {
    return {
      ...base,
      review: "incomplete",
      policy: null,
      missing: parsed.error.issues.map((issue) => issue.path.join(".") || "body"),
      input: null,
    };
  }
  return {
    ...base,
    review: "pending",
    policy: evaluateAdmission(parsed.data),
    missing: [],
    input: parsed.data,
  };
}
