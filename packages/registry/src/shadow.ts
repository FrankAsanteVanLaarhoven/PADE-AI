import type { AdmissionDecision, AdmissionInput } from "@pade/domain";

export interface AdmissionShadow {
  id: string;
  demonstrationId: string;
  source: string;
  input: AdmissionInput;
  kernel: AdmissionDecision;
  operator: "admit" | "quarantine" | "reject";
  actor: string;
  at: string;
  signature?: string;
}

export function shadowStatus(examples: number) {
  return {
    harness: "pade-admission",
    trained: false,
    examples,
    weight: null,
    reason:
      examples === 0
        ? "No collected divergence has been signed. The kernel remains the authority."
        : "Divergences are stored. No weight file exists, and no held-out evaluation has been run. The kernel remains the authority.",
  };
}
