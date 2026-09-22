import type { AdmissionInput } from "@pade/domain";

export const OBSERVED_AT = "2026-09-22T09:00:00.000Z";
export const CORPUS_SOURCE = "fixture:pade-v0.1";
export const SESSION_SOURCE = "local-session";
export const ENV_LAB = "lab-uk";
export const ENV_FIELD = "field-sim";

export const CEAR_FIELDS: { field: string; rule: string }[] = [
  { field: "task", rule: "required" },
  { field: "subtask", rule: "required" },
  { field: "object", rule: "required" },
  { field: "object affordance", rule: "required" },
  { field: "contact state", rule: "required" },
  { field: "desired object motion", rule: "required" },
  { field: "end-effector SE(3)", rule: "required" },
  { field: "relative trajectory", rule: "required" },
  { field: "grasp state", rule: "required" },
  { field: "force / contact intent", rule: "required before production qualification" },
  { field: "temporal phase", rule: "required" },
  { field: "safety envelope", rule: "required before production qualification" },
  { field: "uncertainty", rule: "required" },
];

export interface DemoSeed extends AdmissionInput {
  id: string;
  task: string;
  subtask: string;
  operator: string;
  site: string;
  capturedAt: string;
  durationS: number;
  sensors: string[];
  captureRig: string;
  targetEmbodiment: string;
  review: "confirmed" | "pending";
  novelty: number;
  coverageContribution: number;
  aleatoric: number;
  embodimentFits: Record<string, number>;
  hash: string;
}

const q = (
  sensor: number,
  temporal: number,
  geometric: number,
  semantic: number,
  action: number,
  coverage: number,
  transfer: number,
  safety: number,
): AdmissionInput["quality"] => ({ sensor, temporal, geometric, semantic, action, coverage, transfer, safety });

export const demos: DemoSeed[] = [
  {
    id: "DAR-008928",
    task: "Transparent container grasp",
    subtask: "Left-hand lateral approach, low illumination",
    operator: "op-14",
    site: "lab-uk / bench-2",
    capturedAt: "2026-09-12T14:22:11Z",
    durationS: 18.4,
    sensors: ["ego-rgb", "wrist-rgb", "glove", "imu"],
    captureRig: "emb-umi",
    targetEmbodiment: "emb-g1",
    review: "confirmed",
    novelty: 0.83,
    coverageContribution: 0.44,
    aleatoric: 0.11,
    embodimentFits: { "emb-g1": 0.71, "emb-fr3": 0.64, "emb-ur5e": 0.58 },
    hash: "sha256:fixture:008928",
    quality: q(0.94, 0.91, 0.88, 0.86, 0.9, 0.62, 0.71, 0.8),
    provenance: "verified",
    consent: "pass",
    licence: "pass",
    calibration: "pass",
    clockSync: "pass",
    observability: "pass",
    contamination: "none",
    taskRelevance: 0.93,
    embodimentFit: 0.71,
    epistemic: 0.22,
    safetyRelevance: "high",
  },
  {
    id: "DAR-008931",
    task: "Open medicine drawer",
    subtask: "Partial occlusion, premature-release boundary",
    operator: "op-14",
    site: "lab-uk / bench-2",
    capturedAt: "2026-09-12T15:03:40Z",
    durationS: 22.1,
    sensors: ["exo-rgb", "wrist-rgb", "glove"],
    captureRig: "emb-umi",
    targetEmbodiment: "emb-g1",
    review: "confirmed",
    novelty: 0.77,
    coverageContribution: 0.51,
    aleatoric: 0.16,
    embodimentFits: { "emb-g1": 0.74, "emb-fr3": 0.69, "emb-ur5e": 0.61 },
    hash: "sha256:fixture:008931",
    quality: q(0.9, 0.87, 0.84, 0.8, 0.86, 0.55, 0.7, 0.78),
    provenance: "verified",
    consent: "pass",
    licence: "pass",
    calibration: "pass",
    clockSync: "pass",
    observability: "pass",
    contamination: "none",
    taskRelevance: 0.9,
    embodimentFit: 0.74,
    epistemic: 0.28,
    safetyRelevance: "high",
  },
  {
    id: "DAR-009102",
    task: "Fold a cloth flat",
    subtask: "Two-hand, full visibility, bench lighting",
    operator: "op-02",
    site: "lab-uk / bench-1",
    capturedAt: "2026-09-13T09:12:00Z",
    durationS: 31.0,
    sensors: ["ego-rgb", "exo-rgb", "imu"],
    captureRig: "emb-umi",
    targetEmbodiment: "emb-fr3",
    review: "confirmed",
    novelty: 0.22,
    coverageContribution: 0.18,
    aleatoric: 0.08,
    embodimentFits: { "emb-g1": 0.81, "emb-fr3": 0.88, "emb-ur5e": 0.8 },
    hash: "sha256:fixture:009102",
    quality: q(0.96, 0.95, 0.93, 0.9, 0.94, 0.4, 0.86, 0.92),
    provenance: "verified",
    consent: "pass",
    licence: "pass",
    calibration: "pass",
    clockSync: "pass",
    observability: "pass",
    contamination: "none",
    taskRelevance: 0.84,
    embodimentFit: 0.88,
    epistemic: 0.09,
    safetyRelevance: "low",
  },
  {
    id: "DAR-009440",
    task: "Pour into a cup",
    subtask: "Second take after an edited clip was spliced in",
    operator: "op-07",
    site: "lab-uk / bench-1",
    capturedAt: "2026-09-13T11:41:18Z",
    durationS: 14.2,
    sensors: ["ego-rgb"],
    captureRig: "emb-umi",
    targetEmbodiment: "emb-fr3",
    review: "confirmed",
    novelty: 0.4,
    coverageContribution: 0.1,
    aleatoric: 0.2,
    embodimentFits: { "emb-g1": 0.5, "emb-fr3": 0.66, "emb-ur5e": 0.6 },
    hash: "sha256:fixture:009440",
    quality: q(0.8, 0.7, 0.75, 0.6, 0.7, 0.3, 0.5, 0.7),
    provenance: "verified",
    consent: "pass",
    licence: "pass",
    calibration: "pass",
    clockSync: "pass",
    observability: "pass",
    contamination: "detected",
    taskRelevance: 0.8,
    embodimentFit: 0.66,
    epistemic: 0.2,
    safetyRelevance: "standard",
  },
  {
    id: "DAR-009441",
    task: "Hand an object to a person",
    subtask: "Consent withdrawn after capture",
    operator: "op-07",
    site: "lab-uk / bench-1",
    capturedAt: "2026-09-13T11:58:02Z",
    durationS: 9.5,
    sensors: ["ego-rgb", "exo-rgb"],
    captureRig: "emb-umi",
    targetEmbodiment: "emb-g1",
    review: "confirmed",
    novelty: 0.66,
    coverageContribution: 0.3,
    aleatoric: 0.12,
    embodimentFits: { "emb-g1": 0.7, "emb-fr3": 0.6, "emb-ur5e": 0.5 },
    hash: "sha256:fixture:009441",
    quality: q(0.9, 0.9, 0.85, 0.8, 0.88, 0.4, 0.6, 0.7),
    provenance: "verified",
    consent: "fail",
    licence: "pass",
    calibration: "pass",
    clockSync: "pass",
    observability: "pass",
    contamination: "none",
    taskRelevance: 0.75,
    embodimentFit: 0.7,
    epistemic: 0.15,
    safetyRelevance: "high",
  },
  {
    id: "DAR-010002",
    task: "Pick a mug by the handle",
    subtask: "Wrist camera clock drifted 180 ms",
    operator: "op-02",
    site: "lab-uk / bench-2",
    capturedAt: "2026-09-14T08:16:44Z",
    durationS: 12.0,
    sensors: ["wrist-rgb", "glove", "imu"],
    captureRig: "emb-umi",
    targetEmbodiment: "emb-ur5e",
    review: "confirmed",
    novelty: 0.35,
    coverageContribution: 0.2,
    aleatoric: 0.1,
    embodimentFits: { "emb-g1": 0.6, "emb-fr3": 0.72, "emb-ur5e": 0.77 },
    hash: "sha256:fixture:010002",
    quality: q(0.85, 0.4, 0.8, 0.7, 0.82, 0.3, 0.6, 0.8),
    provenance: "verified",
    consent: "pass",
    licence: "pass",
    calibration: "pass",
    clockSync: "fail",
    observability: "pass",
    contamination: "none",
    taskRelevance: 0.88,
    embodimentFit: 0.77,
    epistemic: 0.18,
    safetyRelevance: "standard",
  },
  {
    id: "DAR-010188",
    task: "Open a latched cupboard",
    subtask: "Saturated ego exposure, action hard to see",
    operator: "op-19",
    site: "lab-uk / bench-3",
    capturedAt: "2026-09-14T16:02:27Z",
    durationS: 16.6,
    sensors: ["ego-rgb"],
    captureRig: "emb-umi",
    targetEmbodiment: "emb-fr3",
    review: "confirmed",
    novelty: 0.58,
    coverageContribution: 0.33,
    aleatoric: 0.3,
    embodimentFits: { "emb-g1": 0.55, "emb-fr3": 0.62, "emb-ur5e": 0.5 },
    hash: "sha256:fixture:010188",
    quality: q(0.31, 0.72, 0.6, 0.4, 0.28, 0.35, 0.4, 0.5),
    provenance: "verified",
    consent: "pass",
    licence: "pass",
    calibration: "pass",
    clockSync: "pass",
    observability: "fail",
    contamination: "none",
    taskRelevance: 0.7,
    embodimentFit: 0.62,
    epistemic: 0.44,
    safetyRelevance: "standard",
  },
  {
    id: "DAR-011200",
    task: "Corridor approach to a bench",
    subtask: "Mobile base, no manipulation contact",
    operator: "op-03",
    site: "lab-uk / hall-a",
    capturedAt: "2026-09-16T10:24:51Z",
    durationS: 40.2,
    sensors: ["head-rgb", "imu", "wheel-odom"],
    captureRig: "emb-umi",
    targetEmbodiment: "emb-mm",
    review: "confirmed",
    novelty: 0.48,
    coverageContribution: 0.37,
    aleatoric: 0.14,
    embodimentFits: { "emb-g1": 0.42, "emb-fr3": 0.2, "emb-ur5e": 0.15 },
    hash: "sha256:fixture:011200",
    quality: q(0.89, 0.86, 0.8, 0.77, 0.83, 0.46, 0.35, 0.87),
    provenance: "verified",
    consent: "pass",
    licence: "pass",
    calibration: "pass",
    clockSync: "pass",
    observability: "pass",
    contamination: "none",
    taskRelevance: 0.42,
    embodimentFit: 0.42,
    epistemic: 0.19,
    safetyRelevance: "standard",
  },
  {
    id: "DAR-012010",
    task: "Stack two boxes",
    subtask: "Provenance file has no signer",
    operator: "op-11",
    site: "lab-uk / bench-3",
    capturedAt: "2026-09-17T13:13:13Z",
    durationS: 19.9,
    sensors: ["exo-rgb", "wrist-rgb"],
    captureRig: "emb-umi",
    targetEmbodiment: "emb-fr3",
    review: "confirmed",
    novelty: 0.5,
    coverageContribution: 0.22,
    aleatoric: 0.1,
    embodimentFits: { "emb-g1": 0.66, "emb-fr3": 0.8, "emb-ur5e": 0.74 },
    hash: "sha256:fixture:012010",
    quality: q(0.91, 0.9, 0.88, 0.84, 0.9, 0.3, 0.75, 0.86),
    provenance: "missing",
    consent: "pass",
    licence: "pass",
    calibration: "pass",
    clockSync: "pass",
    observability: "pass",
    contamination: "none",
    taskRelevance: 0.86,
    embodimentFit: 0.8,
    epistemic: 0.1,
    safetyRelevance: "standard",
  },
  {
    id: "DAR-013333",
    task: "Place a tool, person in the workspace",
    subtask: "Human stands at the bench edge during the place",
    operator: "op-14",
    site: "lab-uk / bench-2",
    capturedAt: "2026-09-18T09:45:00Z",
    durationS: 15.3,
    sensors: ["ego-rgb", "exo-rgb", "glove"],
    captureRig: "emb-umi",
    targetEmbodiment: "emb-g1",
    review: "confirmed",
    novelty: 0.71,
    coverageContribution: 0.6,
    aleatoric: 0.18,
    embodimentFits: { "emb-g1": 0.83, "emb-fr3": 0.79, "emb-ur5e": 0.7 },
    hash: "sha256:fixture:013333",
    quality: q(0.93, 0.9, 0.86, 0.88, 0.91, 0.58, 0.8, 0.9),
    provenance: "verified",
    consent: "pass",
    licence: "pass",
    calibration: "pass",
    clockSync: "pass",
    observability: "pass",
    contamination: "none",
    taskRelevance: 0.91,
    embodimentFit: 0.83,
    epistemic: 0.16,
    safetyRelevance: "high",
  },
  {
    id: "DAR-014402",
    task: "Regrasp a transparent lid",
    subtask: "Clock offset flagged by the capture rig, not yet reviewed",
    operator: "op-19",
    site: "lab-uk / bench-2",
    capturedAt: "2026-09-21T17:11:09Z",
    durationS: 11.8,
    sensors: ["wrist-rgb", "glove"],
    captureRig: "emb-umi",
    targetEmbodiment: "emb-g1",
    review: "pending",
    novelty: 0.8,
    coverageContribution: 0.49,
    aleatoric: 0.17,
    embodimentFits: { "emb-g1": 0.68, "emb-fr3": 0.63, "emb-ur5e": 0.55 },
    hash: "sha256:fixture:014402",
    quality: q(0.88, 0.5, 0.82, 0.79, 0.84, 0.5, 0.66, 0.76),
    provenance: "verified",
    consent: "pass",
    licence: "pass",
    calibration: "pass",
    clockSync: "fail",
    observability: "pass",
    contamination: "none",
    taskRelevance: 0.89,
    embodimentFit: 0.68,
    epistemic: 0.24,
    safetyRelevance: "high",
  },
  {
    id: "DAR-014418",
    task: "Draw a tray from a rack",
    subtask: "Right-hand, partial occlusion, awaiting confirmation",
    operator: "op-02",
    site: "lab-uk / bench-1",
    capturedAt: "2026-09-21T18:02:33Z",
    durationS: 13.7,
    sensors: ["ego-rgb", "wrist-rgb", "glove", "imu"],
    captureRig: "emb-umi",
    targetEmbodiment: "emb-fr3",
    review: "pending",
    novelty: 0.74,
    coverageContribution: 0.57,
    aleatoric: 0.12,
    embodimentFits: { "emb-g1": 0.76, "emb-fr3": 0.84, "emb-ur5e": 0.73 },
    hash: "sha256:fixture:014418",
    quality: q(0.95, 0.92, 0.9, 0.87, 0.93, 0.61, 0.82, 0.91),
    provenance: "verified",
    consent: "pass",
    licence: "pass",
    calibration: "pass",
    clockSync: "pass",
    observability: "pass",
    contamination: "none",
    taskRelevance: 0.92,
    embodimentFit: 0.84,
    epistemic: 0.14,
    safetyRelevance: "standard",
  },
];

export interface EmbodimentSeed {
  id: string;
  name: string;
  className: string;
  qualification: string;
  adapter: string;
  missing: string[];
  note: string;
}

export const embodiments: EmbodimentSeed[] = [
  {
    id: "emb-umi",
    name: "UMI capture rig",
    className: "Human capture",
    qualification: "capture only",
    adapter: "CEAR source",
    missing: [],
    note: "Capture device. Not a target robot. Relative trajectory is the portability field, not a joint map.",
  },
  {
    id: "emb-g1",
    name: "Unitree G1",
    className: "Humanoid",
    qualification: "partial",
    adapter: "cear-g1-0.3",
    missing: ["force / contact intent", "safety envelope binding"],
    note: "Adapter covers SE(3), grasp state, and relative trajectory. Production qualification is open.",
  },
  {
    id: "emb-fr3",
    name: "Franka Research 3",
    className: "Arm",
    qualification: "partial",
    adapter: "cear-fr3-0.2",
    missing: ["safety envelope binding"],
    note: "Adapter covers the arm. The safety envelope is not bound to this robot's constraint set.",
  },
  {
    id: "emb-ur5e",
    name: "UR5e",
    className: "Arm",
    qualification: "unqualified",
    adapter: "none",
    missing: ["CEAR adapter", "safety envelope"],
    note: "Named so the gap is visible. No adapter has been written.",
  },
  {
    id: "emb-mm",
    name: "Mobile manipulator",
    className: "Mobile manipulator",
    qualification: "unqualified",
    adapter: "none",
    missing: ["CEAR adapter", "base-frame binding"],
    note: "Base plus arm. No canonical binding from corridor demonstrations.",
  },
];

export interface DatasetSeed {
  id: string;
  name: string;
  purpose: string;
  memberIds: string[];
}

export const datasets: DatasetSeed[] = [
  {
    id: "ds-core-train",
    name: "Core train corpus",
    purpose: "Admitted demonstrations whose train gate allows. Uniform weight. MDV does not reweight this set.",
    memberIds: ["DAR-008928", "DAR-008931", "DAR-009102"],
  },
  {
    id: "ds-validation",
    name: "Validation holdout",
    purpose: "Admitted demonstrations whose validation gate allows, held out of the train list.",
    memberIds: ["DAR-013333"],
  },
  {
    id: "ds-quarantine",
    name: "Quarantine",
    purpose: "Not trainable until clock, calibration, or observability is repaired.",
    memberIds: ["DAR-010002", "DAR-010188"],
  },
];

export const ARMS: { id: string; code: string; name: string; datasetId: string | null; question: string }[] = [
  { id: "arm-a", code: "A", name: "Random human demonstrations", datasetId: null, question: "Volume without an admission gate." },
  { id: "arm-b", code: "B", name: "Task-balanced demonstrations", datasetId: null, question: "Balance across task names only." },
  { id: "arm-c", code: "C", name: "Diversity-selected demonstrations", datasetId: null, question: "Diversity without safety or provenance." },
  { id: "arm-d", code: "D", name: "Quality-filtered demonstrations", datasetId: "ds-core-train", question: "Admission gate, no failure-directed recollection." },
  { id: "arm-e", code: "E", name: "MDV-selected demonstrations", datasetId: null, question: "Acquisition ranked by marginal demonstration value." },
  { id: "arm-f", code: "F", name: "MDV plus FleetSafe interventions", datasetId: null, question: "Adds intervention pairs. Runtime is not attached." },
  { id: "arm-g", code: "G", name: "Full PADE loop", datasetId: null, question: "Admission, MDV, sim counterfactuals, shield, verdict, recollection." },
];

export const CONDITIONS = [
  "Same embodiment, same environment",
  "Same embodiment, new environment",
  "New embodiment, same environment",
  "New embodiment, new environment",
  "Sensor corruption",
  "Latency perturbation",
  "Camera perturbation",
  "Object perturbation",
  "Human proximity",
  "OOD object",
  "OOD task composition",
];

export interface FailureSeed {
  id: string;
  task: string;
  mode: string;
  context: string;
  uncertainty: string;
  safety: string;
  deficiency: string;
  nearest: string[];
  recommendation: string;
  simNeed: string;
}

export const failures: FailureSeed[] = [
  {
    id: "FAIL-02183",
    task: "Open medicine drawer",
    mode: "Premature release",
    context: "Partial occlusion",
    uncertainty: "0.74 epistemic, authored on this case",
    safety: "Object velocity would have exceeded the constraint",
    deficiency: "Low coverage of occluded grasp transitions",
    nearest: ["DAR-008931", "DAR-008928", "DAR-014418"],
    recommendation: "20 occlusion-varied demonstrations",
    simNeed: "1000 counterfactual episodes — not run; Isaac Sim is unavailable",
  },
  {
    id: "FAIL-02210",
    task: "Transparent container grasp",
    mode: "Missed lip contact",
    context: "Illumination below 80 lux, wrist occlusion",
    uncertainty: "0.61 epistemic, authored on this case",
    safety: "No contact violation. Grasp failed open.",
    deficiency: "Transparent objects under low light",
    nearest: ["DAR-008928", "DAR-014402"],
    recommendation: "30–50 demonstrations across hand and approach",
    simNeed: "Lighting and refractive-index sweep — not run",
  },
  {
    id: "FAIL-02240",
    task: "Place a tool, person in the workspace",
    mode: "Continued approach inside the stand-in human envelope",
    context: "Person at bench edge",
    uncertainty: "0.33 epistemic, authored on this case",
    safety: "Minimum range to the person would have fallen below the margin",
    deficiency: "Few place-actions with a person beside the bench",
    nearest: ["DAR-013333"],
    recommendation: "Proximity-varied place demonstrations",
    simNeed: "Human-proximity counterfactuals — not run",
  },
];

export interface AcquisitionSeed {
  id: string;
  failureId: string;
  task: string;
  spec: string;
  count: string;
  informationGain: number;
  coverageGain: number;
  failureGap: number;
  safetyGain: number;
  redundancy: number;
  state: "open" | "scheduled" | "dismissed";
}

export const acquisitions: AcquisitionSeed[] = [
  {
    id: "ACQ-030",
    failureId: "FAIL-02210",
    task: "Transparent container grasp",
    spec: "Illumination below 80 lux. Left and right hand. Three approach angles. Partial occlusion. Two camera configurations.",
    count: "30–50",
    informationGain: 0.82,
    coverageGain: 0.74,
    failureGap: 0.91,
    safetyGain: 0.48,
    redundancy: 0.12,
    state: "open",
  },
  {
    id: "ACQ-031",
    failureId: "FAIL-02183",
    task: "Open medicine drawer",
    spec: "Occluded grasp transitions. Premature-release boundary. Both hands. Drawer 30–90% open.",
    count: "20",
    informationGain: 0.7,
    coverageGain: 0.66,
    failureGap: 0.88,
    safetyGain: 0.72,
    redundancy: 0.18,
    state: "open",
  },
  {
    id: "ACQ-032",
    failureId: "FAIL-02240",
    task: "Place a tool, person in the workspace",
    spec: "Person at three distances from the place target. Shield-relevant, not task-only.",
    count: "24",
    informationGain: 0.55,
    coverageGain: 0.6,
    failureGap: 0.64,
    safetyGain: 0.93,
    redundancy: 0.22,
    state: "open",
  },
  {
    id: "ACQ-033",
    failureId: "FAIL-02210",
    task: "Transparent container grasp",
    spec: "Repeat of the well-lit, right-hand, frontal approach already in DAR-009102's regime.",
    count: "40",
    informationGain: 0.18,
    coverageGain: 0.12,
    failureGap: 0.15,
    safetyGain: 0.1,
    redundancy: 0.86,
    state: "open",
  },
];

export interface VerdictSeed {
  id: string;
  subjectKind: string;
  subjectId: string;
  gate: string;
  recommendation: "allow" | "conditional" | "deny";
  state: "pending" | "confirmed";
  reasons: string[];
  policy: string;
}

export const verdicts: VerdictSeed[] = [
  {
    id: "VD-1044",
    subjectKind: "deployment",
    subjectId: "dep-shadow-g1",
    gate: "Shadow deployment",
    recommendation: "conditional",
    state: "pending",
    reasons: [
      "Train corpus is admitted, but no model artifact exists.",
      "Sim-to-real report is blocked on the Isaac Sim adapter.",
      "G1 CEAR adapter is only partially qualified.",
    ],
    policy: "deploy-0.1.0",
  },
  {
    id: "VD-1045",
    subjectKind: "deployment",
    subjectId: "dep-guard-fr3",
    gate: "Guarded deployment",
    recommendation: "deny",
    state: "pending",
    reasons: [
      "No trained policy to guard.",
      "FleetSafe runtime is not attached, so a guard cannot be claimed.",
      "Sim-to-real report is absent.",
    ],
    policy: "deploy-0.1.0",
  },
  {
    id: "VD-1030",
    subjectKind: "dataset",
    subjectId: "ds-core-train",
    gate: "Train corpus",
    recommendation: "allow",
    state: "confirmed",
    reasons: ["Every member is admitted and the train gate allows. Weighting is uniform, not MDV."],
    policy: "admission-0.1.0",
  },
  {
    id: "VD-1033",
    subjectKind: "demonstration",
    subjectId: "DAR-009440",
    gate: "Promote contaminated take",
    recommendation: "deny",
    state: "confirmed",
    reasons: ["Contamination detected. Policy rejects the record."],
    policy: "admission-0.1.0",
  },
];

export interface DeploymentSeed {
  id: string;
  embodimentId: string;
  mode: "shadow" | "guarded" | "stopped";
  datasetId: string;
  verdictId: string;
  note: string;
}

export const deployments: DeploymentSeed[] = [
  {
    id: "dep-shadow-g1",
    embodimentId: "emb-g1",
    mode: "shadow",
    datasetId: "ds-core-train",
    verdictId: "VD-1044",
    note: "Recorded intent. No robot is connected. Shadow would log a policy that has not been trained.",
  },
  {
    id: "dep-guard-fr3",
    embodimentId: "emb-fr3",
    mode: "guarded",
    datasetId: "ds-core-train",
    verdictId: "VD-1045",
    note: "Guarded is the requested mode. The runtime that would guard it is unavailable, so this is not an armed deployment.",
  },
  {
    id: "dep-stopped-ur",
    embodimentId: "emb-ur5e",
    mode: "stopped",
    datasetId: "ds-core-train",
    verdictId: "VD-1045",
    note: "Stopped because the UR5e has no CEAR adapter.",
  },
];

export interface SafetySeed {
  id: string;
  deploymentId: string;
  at: string;
  summary: string;
  proposed: string;
  safeAction: string;
  state: string;
  ttc: string;
  uncertainty: string;
  margin: string;
  constraint: string;
}

export const safetyEvents: SafetySeed[] = [
  {
    id: "SE-441",
    deploymentId: "dep-shadow-g1",
    at: "2026-09-20T10:14:02Z",
    summary: "Proposed close continued through an occluded wrist.",
    proposed: "close gripper",
    safeAction: "hold, then reopen",
    state: "occluded drawer, 40% open",
    ttc: "0.38 s",
    uncertainty: "0.74",
    margin: "0.06",
    constraint: "object velocity",
  },
  {
    id: "SE-442",
    deploymentId: "dep-guard-fr3",
    at: "2026-09-20T10:16:41Z",
    summary: "Approach vector entered the authored human envelope.",
    proposed: "continue cartesian approach",
    safeAction: "stop and retreat 40 mm",
    state: "person at bench edge",
    ttc: "0.51 s",
    uncertainty: "0.33",
    margin: "0.04",
    constraint: "human range",
  },
  {
    id: "SE-443",
    deploymentId: "dep-shadow-g1",
    at: "2026-09-20T10:22:18Z",
    summary: "Low-light lip contact, no force estimate.",
    proposed: "increase close effort",
    safeAction: "abort close",
    state: "transparent container, 60 lux",
    ttc: "not applicable — no collision predicted",
    uncertainty: "0.61",
    margin: "unknown without force",
    constraint: "contact intent missing",
  },
];

export interface IncidentSeed {
  id: string;
  at: string;
  summary: string;
  deploymentId: string;
  disposition: string;
}

export const incidents: IncidentSeed[] = [
  {
    id: "INC-17",
    at: "2026-09-20T10:14:05Z",
    summary: "Shadow log recorded SE-441. No robot moved. This is a fixture incident, not a field report.",
    deploymentId: "dep-shadow-g1",
    disposition: "open in the atlas as FAIL-02183",
  },
  {
    id: "INC-18",
    at: "2026-09-20T10:16:44Z",
    summary: "Authored human-envelope crossing SE-442. Used to exercise the incident record, not as a measured rate.",
    deploymentId: "dep-guard-fr3",
    disposition: "linked to FAIL-02240",
  },
];

export interface CounterfactualSeed {
  id: string;
  failureId: string;
  perturbation: string;
  why: string;
}

export const counterfactuals: CounterfactualSeed[] = [
  { id: "CF-01", failureId: "FAIL-02210", perturbation: "Illumination down", why: "The failure cluster is low light on a transparent lip." },
  { id: "CF-02", failureId: "FAIL-02210", perturbation: "Latency up", why: "Wrist camera and glove clocks are a known quarantine cause." },
  { id: "CF-03", failureId: "FAIL-02183", perturbation: "Friction down", why: "Premature release may be a slip, not only an occlusion." },
  { id: "CF-04", failureId: "FAIL-02240", perturbation: "Person enters the path", why: "The safety event is a human-envelope crossing." },
  { id: "CF-05", failureId: "FAIL-02183", perturbation: "Gripper differs", why: "G1 and FR3 adapters do not share a contact model." },
];

export const adapters = [
  {
    id: "adp-isaac",
    name: "Isaac Sim",
    contract: "isaac.sim.v1",
    reason: "No Isaac Sim process is attached to this control plane.",
  },
  {
    id: "adp-ros2",
    name: "ROS 2 bridge",
    contract: "ros2.bridge.v1",
    reason: "No ROS 2 graph is connected.",
  },
  {
    id: "adp-fleetsafe",
    name: "FleetSafe runtime",
    contract: "fleetsafe.runtime.v1",
    reason: "The shield is specified. No runtime is executing it.",
  },
  {
    id: "adp-sentinel",
    name: "Sentinel telemetry",
    contract: "sentinel.telemetry.v1",
    reason: "No collector is streaming. Fixture incidents below are not that stream.",
  },
  {
    id: "adp-train",
    name: "Training backend",
    contract: "training.v1",
    reason: "No trainer is configured. Dataset membership is not a trained model.",
  },
] as const;

export interface EvidenceItem {
  name: string;
  state: "present" | "missing" | "blocked" | "pending";
  ref: string;
  reason: string;
}

export const evidenceItems: EvidenceItem[] = [
  { name: "Data card", state: "present", ref: "ds-core-train", reason: "Membership list and uniform-weight note." },
  { name: "Model card", state: "missing", ref: "—", reason: "Training backend unavailable. No model artifact." },
  { name: "Robot card", state: "present", ref: "emb-g1", reason: "Partial qualification, missing fields listed." },
  { name: "Environment card", state: "present", ref: "lab-uk", reason: "Fixture lab scope. Not a calibrated digital twin." },
  { name: "Safety card", state: "present", ref: "admission-0.1.0", reason: "Admission policy text and thresholds." },
  { name: "Provenance manifest", state: "present", ref: "fixture:pade-v0.1", reason: "Every corpus row names this source." },
  { name: "Sim-to-real report", state: "blocked", ref: "adp-isaac", reason: "Isaac Sim adapter unavailable. No gap was measured." },
  { name: "VerdictPlane decision", state: "pending", ref: "VD-1044", reason: "Shadow deployment has not been decided." },
  { name: "Rollback pointer", state: "missing", ref: "—", reason: "No prior release exists." },
];

export interface ArtifactSeed {
  id: string;
  artifactKind: string;
  name: string;
  status: string;
  note: string;
}

export const artifacts: ArtifactSeed[] = [
  { id: "art-data-card", artifactKind: "data card", name: "Core train data card", status: "present", note: "Points at ds-core-train." },
  { id: "art-model", artifactKind: "model", name: "Policy artifact", status: "absent", note: "Training backend unavailable." },
  { id: "art-robot-g1", artifactKind: "robot card", name: "Unitree G1", status: "partial", note: "Points at emb-g1." },
  { id: "art-env", artifactKind: "environment card", name: "lab-uk", status: "fixture", note: "Not a calibrated site model." },
  { id: "art-safety", artifactKind: "safety card", name: "Admission policy", status: "current", note: "admission-0.1.0." },
  { id: "art-provenance", artifactKind: "provenance manifest", name: "pade-v0.1 corpus", status: "present", note: "Source fixture:pade-v0.1." },
];

export interface AuditSeed {
  id: string;
  at: string;
  actor: string;
  action: string;
  subjectKind: string;
  subjectId: string;
}

export const auditSeed: AuditSeed[] = [
  { id: "AUD-001", at: "2026-09-18T12:00:00Z", actor: "corpus", action: "Loaded fixture corpus pade-v0.1.", subjectKind: "evidence", subjectId: "ev-pade-0.1.0" },
  { id: "AUD-002", at: "2026-09-18T12:00:01Z", actor: "policy", action: "Evaluated admission-0.1.0 on every demonstration.", subjectKind: "artifact", subjectId: "art-safety" },
  { id: "AUD-003", at: "2026-09-19T09:00:00Z", actor: "corpus", action: "Confirmed train-corpus verdict VD-1030.", subjectKind: "verdict", subjectId: "VD-1030" },
  { id: "AUD-004", at: "2026-09-19T09:00:02Z", actor: "corpus", action: "Denied promotion of contaminated DAR-009440.", subjectKind: "verdict", subjectId: "VD-1033" },
];

export interface Edge {
  fromKind: string;
  fromId: string;
  toKind: string;
  toId: string;
  relation: string;
}

export const edges: Edge[] = [
  { fromKind: "dataset", fromId: "ds-core-train", toKind: "demonstration", toId: "DAR-008928", relation: "member" },
  { fromKind: "dataset", fromId: "ds-core-train", toKind: "demonstration", toId: "DAR-008931", relation: "member" },
  { fromKind: "dataset", fromId: "ds-core-train", toKind: "demonstration", toId: "DAR-009102", relation: "member" },
  { fromKind: "dataset", fromId: "ds-validation", toKind: "demonstration", toId: "DAR-013333", relation: "member" },
  { fromKind: "dataset", fromId: "ds-quarantine", toKind: "demonstration", toId: "DAR-010002", relation: "held" },
  { fromKind: "dataset", fromId: "ds-quarantine", toKind: "demonstration", toId: "DAR-010188", relation: "held" },
  { fromKind: "demonstration", fromId: "DAR-008928", toKind: "embodiment", toId: "emb-g1", relation: "target" },
  { fromKind: "demonstration", fromId: "DAR-008928", toKind: "embodiment", toId: "emb-umi", relation: "captured on" },
  { fromKind: "experiment", fromId: "arm-d", toKind: "dataset", toId: "ds-core-train", relation: "would train on" },
  { fromKind: "deployment", fromId: "dep-shadow-g1", toKind: "embodiment", toId: "emb-g1", relation: "targets" },
  { fromKind: "deployment", fromId: "dep-shadow-g1", toKind: "dataset", toId: "ds-core-train", relation: "reads" },
  { fromKind: "deployment", fromId: "dep-shadow-g1", toKind: "verdict", toId: "VD-1044", relation: "awaits" },
  { fromKind: "deployment", fromId: "dep-guard-fr3", toKind: "embodiment", toId: "emb-fr3", relation: "targets" },
  { fromKind: "deployment", fromId: "dep-guard-fr3", toKind: "verdict", toId: "VD-1045", relation: "awaits" },
  { fromKind: "deployment", fromId: "dep-stopped-ur", toKind: "embodiment", toId: "emb-ur5e", relation: "blocked on" },
  { fromKind: "safety-event", fromId: "SE-441", toKind: "deployment", toId: "dep-shadow-g1", relation: "logged against" },
  { fromKind: "safety-event", fromId: "SE-442", toKind: "deployment", toId: "dep-guard-fr3", relation: "logged against" },
  { fromKind: "safety-event", fromId: "SE-443", toKind: "deployment", toId: "dep-shadow-g1", relation: "logged against" },
  { fromKind: "failure", fromId: "FAIL-02183", toKind: "acquisition", toId: "ACQ-031", relation: "requests" },
  { fromKind: "failure", fromId: "FAIL-02210", toKind: "acquisition", toId: "ACQ-030", relation: "requests" },
  { fromKind: "failure", fromId: "FAIL-02240", toKind: "acquisition", toId: "ACQ-032", relation: "requests" },
  { fromKind: "failure", fromId: "FAIL-02183", toKind: "counterfactual", toId: "CF-03", relation: "would simulate" },
  { fromKind: "failure", fromId: "FAIL-02210", toKind: "counterfactual", toId: "CF-01", relation: "would simulate" },
  { fromKind: "incident", fromId: "INC-17", toKind: "safety-event", toId: "SE-441", relation: "cites" },
  { fromKind: "incident", fromId: "INC-18", toKind: "safety-event", toId: "SE-442", relation: "cites" },
  { fromKind: "evidence", fromId: "ev-pade-0.1.0", toKind: "verdict", toId: "VD-1044", relation: "includes" },
  { fromKind: "evidence", fromId: "ev-pade-0.1.0", toKind: "adapter", toId: "adp-isaac", relation: "blocked on" },
  { fromKind: "verdict", fromId: "VD-1030", toKind: "dataset", toId: "ds-core-train", relation: "decides" },
  { fromKind: "verdict", fromId: "VD-1033", toKind: "demonstration", toId: "DAR-009440", relation: "decides" },
  { fromKind: "failure", fromId: "FAIL-02183", toKind: "demonstration", toId: "DAR-008931", relation: "nearest" },
  { fromKind: "failure", fromId: "FAIL-02183", toKind: "demonstration", toId: "DAR-008928", relation: "nearest" },
  { fromKind: "failure", fromId: "FAIL-02183", toKind: "demonstration", toId: "DAR-014418", relation: "nearest" },
  { fromKind: "failure", fromId: "FAIL-02210", toKind: "demonstration", toId: "DAR-008928", relation: "nearest" },
  { fromKind: "failure", fromId: "FAIL-02210", toKind: "demonstration", toId: "DAR-014402", relation: "nearest" },
  { fromKind: "failure", fromId: "FAIL-02240", toKind: "demonstration", toId: "DAR-013333", relation: "nearest" },
  { fromKind: "failure", fromId: "FAIL-02210", toKind: "counterfactual", toId: "CF-02", relation: "would simulate" },
  { fromKind: "failure", fromId: "FAIL-02240", toKind: "counterfactual", toId: "CF-04", relation: "would simulate" },
  { fromKind: "failure", fromId: "FAIL-02183", toKind: "counterfactual", toId: "CF-05", relation: "would simulate" },
  { fromKind: "acquisition", fromId: "ACQ-033", toKind: "failure", toId: "FAIL-02210", relation: "low-value alternative" },
];
