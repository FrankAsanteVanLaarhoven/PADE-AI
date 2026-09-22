import { z } from "zod";

export const POLICY_VERSION = "admission-0.1.0";

export const qualitySchema = z.object({
  sensor: z.number().min(0).max(1),
  temporal: z.number().min(0).max(1),
  geometric: z.number().min(0).max(1),
  semantic: z.number().min(0).max(1),
  action: z.number().min(0).max(1),
  coverage: z.number().min(0).max(1),
  transfer: z.number().min(0).max(1),
  safety: z.number().min(0).max(1),
});
export type QualityVector = z.infer<typeof qualitySchema>;

export const QUALITY_KEYS = [
  "sensor",
  "temporal",
  "geometric",
  "semantic",
  "action",
  "coverage",
  "transfer",
  "safety",
] as const;

export const admissionInputSchema = z.object({
  quality: qualitySchema,
  provenance: z.enum(["verified", "unverified", "missing"]),
  consent: z.enum(["pass", "fail"]),
  licence: z.enum(["pass", "fail"]),
  calibration: z.enum(["pass", "fail"]),
  clockSync: z.enum(["pass", "fail"]),
  observability: z.enum(["pass", "fail"]),
  contamination: z.enum(["none", "detected"]),
  taskRelevance: z.number().min(0).max(1),
  embodimentFit: z.number().min(0).max(1),
  epistemic: z.number().min(0).max(1),
  safetyRelevance: z.enum(["low", "standard", "high"]),
});
export type AdmissionInput = z.infer<typeof admissionInputSchema>;

export const gateSchema = z.enum(["allow", "conditional", "deny"]);
export type Gate = z.infer<typeof gateSchema>;

export const admissionStateSchema = z.enum(["admitted", "quarantine", "rejected"]);
export type AdmissionState = z.infer<typeof admissionStateSchema>;

export interface AdmissionDecision {
  policyVersion: typeof POLICY_VERSION;
  admission: AdmissionState;
  train: Gate;
  validation: Gate;
  production: Gate;
  reasons: string[];
}

function closed(admission: AdmissionState, reasons: string[]): AdmissionDecision {
  return {
    policyVersion: POLICY_VERSION,
    admission,
    train: "deny",
    validation: "deny",
    production: "deny",
    reasons,
  };
}

/**
 * Deterministic admission policy. Thresholds are part of policy version
 * admission-0.1.0 and are the gates VerdictPlane executes — not a learned score.
 *
 * Reject: provenance, consent, licence, or contamination.
 * Quarantine: clock, calibration, observability, or sensor/action quality below 0.50.
 * Production stays conditional when embodiment fit is below 0.80, epistemic
 * uncertainty is above 0.30, or safety relevance is high while safety quality
 * is below 0.85. Production allow requires train allow.
 */
export function evaluateAdmission(raw: AdmissionInput): AdmissionDecision {
  const input = admissionInputSchema.parse(raw);
  const q = input.quality;

  if (input.provenance !== "verified") {
    return closed("rejected", ["provenance is not verified"]);
  }
  if (input.consent !== "pass" || input.licence !== "pass") {
    return closed("rejected", ["consent or licence failed"]);
  }
  if (input.contamination !== "none") {
    return closed("rejected", ["contamination detected"]);
  }
  if (input.clockSync !== "pass" || input.calibration !== "pass") {
    return closed("quarantine", ["clock synchronisation or calibration failed"]);
  }
  if (input.observability !== "pass" || q.sensor < 0.5 || q.action < 0.5) {
    return closed("quarantine", ["action is not observable enough to train"]);
  }

  const reasons: string[] = [];
  const train: Gate = input.taskRelevance >= 0.5 ? "allow" : "deny";
  if (train === "deny") reasons.push("task relevance below 0.50");
  const validation: Gate = q.geometric >= 0.7 && q.temporal >= 0.7 ? "allow" : "deny";
  if (validation === "deny") reasons.push("geometric or temporal quality below 0.70");

  let production: Gate = "allow";
  if (input.embodimentFit < 0.8) {
    production = "conditional";
    reasons.push("embodiment fit below 0.80");
  }
  if (q.safety < 0.85 && input.safetyRelevance === "high") {
    production = "conditional";
    reasons.push("high safety relevance with safety quality below 0.85");
  }
  if (input.epistemic > 0.3) {
    production = "conditional";
    reasons.push("epistemic uncertainty above 0.30");
  }
  if (train === "deny") production = "deny";

  return {
    policyVersion: POLICY_VERSION,
    admission: "admitted",
    train,
    validation,
    production,
    reasons,
  };
}
