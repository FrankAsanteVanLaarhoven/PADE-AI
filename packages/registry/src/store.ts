import {
  evaluateAdmission,
  marginalDemonstrationValue,
  MDV_VERSION,
  MDV_WEIGHTS,
  POLICY_VERSION,
  QUALITY_KEYS,
  unavailable,
  type AdmissionDecision,
  type AdmissionState,
  type Gate,
  type Origin,
} from "@pade/domain";
import {
  adapters,
  acquisitions,
  ARMS,
  artifacts,
  auditSeed,
  CEAR_FIELDS,
  CONDITIONS,
  CORPUS_SOURCE,
  counterfactuals,
  datasets,
  demos,
  deployments,
  edges,
  embodiments,
  ENV_FIELD,
  ENV_LAB,
  evidenceItems,
  failures,
  incidents,
  OBSERVED_AT,
  safetyEvents,
  SESSION_SOURCE,
  verdicts,
  type AcquisitionSeed,
  type DemoSeed,
} from "./corpus.js";
import type { Field, LinkRef, ListRow, ListView, Overview, Panel, Tone, Workspace } from "./views.js";

export class RegistryError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const FIXTURE_NOTE =
  "Fixture. Authored corpus fixture:pade-v0.1. Not a live robot and not a measurement from attached hardware.";
const SESSION_NOTE = "Session. Local operator action on the fixture corpus. Not fleet telemetry.";

type ReviewAction = "admit" | "quarantine" | "reject";
type VerdictAction = "allow" | "conditional" | "deny";
type AcquisitionAction = "scheduled" | "dismissed";

interface DemoRuntime {
  review: "pending" | "confirmed";
  operator?: ReviewAction;
  actor?: string;
  at?: string;
}
interface VerdictRuntime {
  state: "pending" | "confirmed";
  operator?: VerdictAction;
  actor?: string;
  at?: string;
}
interface AcquisitionRuntime {
  state: "open" | "scheduled" | "dismissed";
  actor?: string;
  at?: string;
}
interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  action: string;
  subjectKind: string;
  subjectId: string;
  session: boolean;
}

const REVIEW_STATE: Record<ReviewAction, AdmissionState> = {
  admit: "admitted",
  quarantine: "quarantine",
  reject: "rejected",
};

const ADAPTER_SOURCE: Record<string, string> = {
  "adp-isaac": "adapter:isaac-sim",
  "adp-ros2": "adapter:ros2",
  "adp-fleetsafe": "adapter:fleetsafe-runtime",
  "adp-sentinel": "adapter:sentinel-stream",
  "adp-train": "adapter:training",
};

function toneForAdmission(state: AdmissionState): Tone {
  if (state === "admitted") return "ok";
  if (state === "quarantine") return "warn";
  return "bad";
}

function toneForGate(gate: Gate): Tone {
  if (gate === "allow") return "ok";
  if (gate === "conditional") return "warn";
  return "bad";
}

function signalTone(value: string): Tone | undefined {
  if (value === "fail" || value === "detected" || value === "missing" || value === "unverified") return "bad";
  if (value === "pass" || value === "verified" || value === "none") return "ok";
  return undefined;
}

function toneForQual(q: string): Tone {
  if (q === "partial" || q === "capture only") return "warn";
  if (q === "unqualified") return "bad";
  return "muted";
}

function n2(value: number): string {
  return value.toFixed(2);
}
function n3(value: number): string {
  return value.toFixed(3);
}

function field(label: string, value: string, extra?: Partial<Field>): Field {
  return { label, value, ...extra };
}

function panel(title: string, fields: Field[], note?: string): Panel {
  return { title, fields, note };
}

export class MemoryRegistry {
  private readonly demoState = new Map<string, DemoRuntime>();
  private readonly verdictState = new Map<string, VerdictRuntime>();
  private readonly acquisitionState = new Map<string, AcquisitionRuntime>();
  private readonly audit: AuditEvent[];
  private auditSeq = 0;

  constructor() {
    for (const demo of demos) {
      evaluateAdmission(demo);
      this.demoState.set(demo.id, { review: demo.review });
    }
    for (const verdict of verdicts) {
      this.verdictState.set(verdict.id, { state: verdict.state });
    }
    for (const acquisition of acquisitions) {
      marginalDemonstrationValue(acquisition);
      this.acquisitionState.set(acquisition.id, { state: acquisition.state });
    }
    this.assertDatasetInvariants();
    this.audit = auditSeed.map((event) => ({ ...event, session: false }));
  }

  meta(env: string) {
    this.assertEnv(env);
    return {
      service: "pade-api",
      mode: "fixture-registry",
      persistence: "Process memory. Operator actions reset when the API process restarts.",
      session: "Unsigned local operator. No authentication.",
      environment: env,
      environments: [
        { id: ENV_LAB, label: "lab-uk", detail: "fixture corpus" },
        { id: ENV_FIELD, label: "field-sim", detail: "no data plane" },
      ],
      release: env === ENV_LAB ? "pade-0.1.0-fixture" : null,
      policyVersion: POLICY_VERSION,
      mdvVersion: MDV_VERSION,
      weights: MDV_WEIGHTS,
      observedAt: OBSERVED_AT,
      source: env === ENV_LAB ? CORPUS_SOURCE : "adapter:environment",
    };
  }

  overview(env: string): Overview {
    this.assertEnv(env);
    const adaptersView = adapters.map((adapter) => ({
      id: adapter.id,
      name: adapter.name,
      contract: adapter.contract,
      reason: adapter.reason,
    }));
    if (env === ENV_FIELD) {
      const empty = this.emptyList("Deployments", "field-sim has no deployment records.");
      return {
        environment: env,
        release: null,
        banner: "field-sim has no data plane. Operational records are not copied from lab-uk. Adapters below are unavailable here as well.",
        health: [
          { label: "Corpus", value: "unavailable", href: "/registry", tone: "muted" },
          { label: "Admission", value: "unavailable", href: "/demonstrations", tone: "muted" },
          { label: "Verdicts", value: "unavailable", href: "/verdictplane", tone: "muted" },
          { label: "Isaac", value: "unavailable", href: "/simulation", tone: "muted" },
          { label: "ROS 2", value: "unavailable", href: "/simulation", tone: "muted" },
          { label: "FleetSafe", value: "unavailable", href: "/fleetsafe", tone: "muted" },
          { label: "Sentinel", value: "unavailable", href: "/sentinel", tone: "muted" },
        ],
        deployments: empty,
        queue: [],
        verdicts: [],
        failures: [],
        safety: [],
        adapters: adaptersView,
        evidence: { present: 0, total: 0, blocked: ["no release in this environment"] },
      };
    }

    const queue = demos
      .filter((demo) => this.demoState.get(demo.id)?.review === "pending")
      .map((demo) => {
        const policy = evaluateAdmission(demo);
        return { id: demo.id, task: demo.task, policy: policy.admission, tone: toneForAdmission(policy.admission) };
      });
    const openVerdicts = verdicts
      .filter((verdict) => this.verdictState.get(verdict.id)?.state === "pending")
      .map((verdict) => ({
        id: verdict.id,
        gate: verdict.gate,
        recommendation: verdict.recommendation,
        subject: `${verdict.subjectKind} ${verdict.subjectId}`,
        tone: toneForGate(verdict.recommendation),
      }));
    const evidence = this.evidenceSummary();
    return {
      environment: env,
      release: "pade-0.1.0-fixture",
      banner: "lab-uk is the fixture corpus. Counts are records, not live fleet measurements. No robot, simulator, or telemetry stream is attached.",
      health: [
        { label: "Pending admission", value: String(queue.length), href: "/demonstrations", tone: queue.length ? "warn" : "ok" },
        { label: "Open verdicts", value: String(openVerdicts.length), href: "/verdictplane", tone: openVerdicts.length ? "warn" : "ok" },
        { label: "Safety cases", value: `${safetyEvents.length} fixture`, href: "/fleetsafe" },
        { label: "Isaac", value: "unavailable", href: "/simulation", tone: "muted" },
        { label: "ROS 2", value: "unavailable", href: "/simulation", tone: "muted" },
        { label: "FleetSafe", value: "unavailable", href: "/fleetsafe", tone: "muted" },
        { label: "Sentinel", value: "unavailable", href: "/sentinel", tone: "muted" },
        { label: "Evidence", value: `${evidence.present}/${evidence.total}`, href: "/evidence", tone: "warn" },
      ],
      deployments: this.deployments(env),
      queue,
      verdicts: openVerdicts,
      failures: failures.map((failure) => ({ id: failure.id, task: failure.task, mode: failure.mode })),
      safety: safetyEvents.map((event) => ({ id: event.id, summary: event.summary, at: event.at })),
      adapters: adaptersView,
      evidence,
    };
  }

  registry(env: string): ListView {
    const base = this.listShell(env, "Data registry", "Artifacts the release would have to point at. Absent means the file does not exist; it is not an empty model.");
    if (!base) return this.unavailableList("Data registry", "field-sim has no registry.", "registry.v1");
    const rows: ListRow[] = [
      ...artifacts.map((artifact) =>
        this.row("artifact", artifact.id, {
          id: artifact.id,
          kind: artifact.artifactKind,
          name: artifact.name,
          status: artifact.status,
        }, artifact.status === "absent" ? { status: "bad" } : artifact.status === "partial" ? { status: "warn" } : { status: "ok" }, [
          field("Status", artifact.status),
          field("Note", artifact.note),
          field("Origin", "fixture"),
        ]),
      ),
      ...datasets.map((dataset) =>
        this.row("dataset", dataset.id, {
          id: dataset.id,
          kind: "dataset",
          name: dataset.name,
          status: `${dataset.memberIds.length} members`,
        }, {}, [
          field("Purpose", dataset.purpose),
          field("Members", dataset.memberIds.join(", "), { mono: true }),
        ]),
      ),
    ];
    return { ...base, columns: cols(["id", "ID", true], ["kind", "Kind"], ["name", "Name"], ["status", "Status"]), rows };
  }

  demonstrations(env: string): ListView {
    const base = this.listShell(
      env,
      "Demonstrations",
      "Each row is a demonstration admissibility record. The policy column is admission-0.1.0. Pending rows are waiting for an operator; confirming does not edit dataset membership.",
    );
    if (!base) return this.unavailableList("Demonstrations", "field-sim has no demonstrations.", "demonstration.v1");
    const rows = demos.map((demo) => {
      const view = this.demoFacts(demo);
      return this.row(
        "demonstration",
        demo.id,
        {
          id: demo.id,
          task: demo.task,
          review: view.reviewLabel,
          policy: view.policy.admission,
          train: view.policy.train,
          validation: view.policy.validation,
          production: view.effectiveProduction,
          novelty: n2(demo.novelty),
          fit: n2(demo.embodimentFit),
          safety: demo.safetyRelevance,
        },
        {
          review: view.pending ? "warn" : view.diverged ? "warn" : "muted",
          policy: toneForAdmission(view.policy.admission),
          train: toneForGate(view.policy.train),
          validation: toneForGate(view.policy.validation),
          production: toneForGate(view.effectiveProductionGate),
          safety: demo.safetyRelevance === "high" ? "warn" : "muted",
        },
        [
          field("Review", view.reviewLabel, { tone: view.pending ? "warn" : undefined }),
          field("Policy admission", view.policy.admission, { tone: toneForAdmission(view.policy.admission) }),
          field("Train / validation / production", `${view.policy.train} / ${view.policy.validation} / ${view.effectiveProduction}`),
          field("Why", view.policy.reasons.join(" · ") || "No production conditions fired."),
          field("Target", demo.targetEmbodiment, { mono: true }),
        ],
      );
    });
    return {
      ...base,
      columns: cols(
        ["id", "Record", true],
        ["task", "Task"],
        ["review", "Review"],
        ["policy", "Policy"],
        ["train", "Train"],
        ["validation", "Validation"],
        ["production", "Production"],
        ["novelty", "Novelty", false, "right"],
        ["fit", "Fit", false, "right"],
        ["safety", "Safety"],
      ),
      rows,
    };
  }

  embodimentList(env: string): ListView {
    const base = this.listShell(
      env,
      "Embodiments",
      "Human motion is not mapped joint-to-joint. CEAR is the canonical layer. An unqualified embodiment has no adapter; the gap is the record.",
    );
    if (!base) return this.unavailableList("Embodiments", "field-sim has no embodiment cards.", "embodiment.v1");
    const rows = embodiments.map((embodiment) =>
      this.row(
        "embodiment",
        embodiment.id,
        {
          id: embodiment.id,
          name: embodiment.name,
          className: embodiment.className,
          qualification: embodiment.qualification,
          adapter: embodiment.adapter,
          missing: embodiment.missing.length ? embodiment.missing.join("; ") : "—",
        },
        { qualification: toneForQual(embodiment.qualification) },
        [
          field("Qualification", embodiment.qualification, { tone: toneForQual(embodiment.qualification) }),
          field("Adapter", embodiment.adapter, { mono: true }),
          field("Missing", embodiment.missing.join("; ") || "None for this card."),
          field("Note", embodiment.note),
        ],
      ),
    );
    return {
      ...base,
      columns: cols(
        ["id", "ID", true],
        ["name", "Name"],
        ["className", "Class"],
        ["qualification", "Qualification"],
        ["adapter", "Adapter", true],
        ["missing", "Missing for production"],
      ),
      rows,
    };
  }

  datasetFactory(env: string) {
    this.assertEnv(env);
    if (env === ENV_FIELD) {
      return {
        title: "Dataset factory",
        lede: "field-sim has no datasets.",
        origin: "unavailable" as const,
        unavailable: unavailable("adapter:training", "field-sim has no datasets.", "dataset.v1", OBSERVED_AT),
        sets: [],
      };
    }
    return {
      title: "Dataset factory",
      lede: "Membership is an explicit list. v0.1 weights admitted train members uniformly. MDV ranks acquisition requests; it does not reweight these sets. Training backend is unavailable, so a dataset is not a model.",
      origin: "fixture" as const,
      source: CORPUS_SOURCE,
      weighting: "uniform across admitted train members",
      sets: datasets.map((dataset) => ({
        id: dataset.id,
        name: dataset.name,
        purpose: dataset.purpose,
        members: dataset.memberIds.map((id) => {
          const demo = this.demoById(id);
          const policy = evaluateAdmission(demo);
          const runtime = this.demoState.get(id)!;
          return {
            id,
            task: demo.task,
            policy: policy.admission,
            train: policy.train,
            review: runtime.review,
            weight: dataset.id === "ds-core-train" ? n3(1 / dataset.memberIds.length) : "—",
          };
        }),
      })),
    };
  }

  experiments(env: string) {
    this.assertEnv(env);
    const backend = unavailable("adapter:training", "No execution backend is attached. Cells are protocol status, not measured outcomes.", "training.v1", OBSERVED_AT);
    if (env === ENV_FIELD) {
      return { title: "Experiments", lede: "field-sim has no experiment protocol attached.", origin: "unavailable" as const, unavailable: backend, arms: [], conditions: [] as string[], cell: "unavailable" };
    }
    return {
      title: "Experiments",
      lede: "Ablation protocol A–G against the shift conditions. Every cell is not run. Nothing in this matrix is a success rate.",
      origin: "fixture" as const,
      source: CORPUS_SOURCE,
      unavailable: backend,
      cell: "not run",
      reason: "No execution backend is attached.",
      arms: ARMS.map((arm) => ({ ...arm })),
      conditions: [...CONDITIONS],
    };
  }

  simulation(env: string) {
    this.assertEnv(env);
    return {
      title: "Simulation",
      lede: "Counterfactual plans are fixture specifications. They have not been executed, so they are not labeled simulated. Isaac Sim and ROS 2 are unavailable.",
      origin: "fixture" as const,
      adapters: adapters.filter((adapter) => adapter.id === "adp-isaac" || adapter.id === "adp-ros2").map((adapter) => ({
        ...adapter,
        origin: "unavailable" as const,
        source: ADAPTER_SOURCE[adapter.id],
      })),
      plans: env === ENV_FIELD ? [] : counterfactuals.map((plan) => ({
        ...plan,
        status: "not run",
        origin: "fixture" as const,
      })),
      empty: env === ENV_FIELD ? "field-sim has no counterfactual plans." : null,
    };
  }

  fleetsafe(env: string) {
    this.assertEnv(env);
    const runtime = unavailable("adapter:fleetsafe-runtime", "The shield contract is specified. No runtime is executing it.", "fleetsafe.runtime.v1", OBSERVED_AT);
    return {
      title: "FleetSafe",
      lede: "An intervention is evidence only when a runtime logs it. The rows below are authored fixture cases so the record shape can be inspected. They are not robot logs.",
      runtime,
      tuple: ["a_proposed", "a_safe", "x", "h(x)", "TTC", "U"],
      events: env === ENV_FIELD ? this.unavailableList("Interventions", "field-sim has no intervention corpus.", "fleetsafe.runtime.v1") : this.safetyList(),
    };
  }

  verdictList(env: string): ListView {
    const base = this.listShell(env, "VerdictPlane", "Decisions are allow, conditional, or deny, with the policy reason kept beside any operator override. Deciding does not start a robot.");
    if (!base) return this.unavailableList("VerdictPlane", "field-sim has no verdicts.", "verdict.v1");
    const rows = verdicts.map((verdict) => {
      const runtime = this.verdictState.get(verdict.id)!;
      const shown = this.shownVerdict(verdict.id);
      const diverged = Boolean(runtime.operator && runtime.operator !== verdict.recommendation);
      return this.row(
        "verdict",
        verdict.id,
        {
          id: verdict.id,
          gate: verdict.gate,
          subject: `${verdict.subjectKind} ${verdict.subjectId}`,
          recommendation: verdict.recommendation,
          state: runtime.state,
          decision: shown,
        },
        {
          recommendation: toneForGate(verdict.recommendation),
          state: runtime.state === "pending" ? "warn" : "ok",
          decision: diverged ? "warn" : runtime.state === "pending" ? "muted" : toneForGate(runtime.operator ?? verdict.recommendation),
        },
        [
          field("Gate", verdict.gate),
          field("Policy", verdict.policy, { mono: true }),
          field("Recommendation", verdict.recommendation, { tone: toneForGate(verdict.recommendation) }),
          field("State", runtime.state),
          field("Decision", shown, { tone: diverged ? "warn" : undefined }),
          field("Reasons", verdict.reasons.join(" ")),
        ],
      );
    });
    return {
      ...base,
      columns: cols(
        ["id", "Verdict", true],
        ["gate", "Gate"],
        ["subject", "Subject", true],
        ["recommendation", "Policy"],
        ["state", "State"],
        ["decision", "Decision"],
      ),
      rows,
    };
  }

  sentinel(env: string) {
    this.assertEnv(env);
    const stream = unavailable("adapter:sentinel-stream", "No collector is streaming.", "sentinel.telemetry.v1", OBSERVED_AT);
    return {
      title: "Sentinel",
      lede: "Live telemetry is unavailable. There is no drift series, no shadow comparison, and no incident rate. Fixture incidents are separate and labeled.",
      stream,
      incidents: env === ENV_FIELD
        ? this.unavailableList("Incidents", "field-sim has no incidents.", "sentinel.telemetry.v1")
        : this.incidentList(),
    };
  }

  failureList(env: string): ListView {
    const base = this.listShell(env, "Failure atlas", "Authored fixture cases. A failure names the deficiency and the nearest demonstrations. It is not an episode flag and not a field rate.");
    if (!base) return this.unavailableList("Failure atlas", "field-sim has no failure atlas.", "failure.v1");
    const rows = failures.map((failure) =>
      this.row("failure", failure.id, {
        id: failure.id,
        task: failure.task,
        mode: failure.mode,
        context: failure.context,
        deficiency: failure.deficiency,
      }, {}, [
        field("Mode", failure.mode),
        field("Context", failure.context),
        field("Deficiency", failure.deficiency),
        field("Nearest", failure.nearest.join(", "), { mono: true }),
        field("Simulation", failure.simNeed),
      ]),
    );
    return {
      ...base,
      columns: cols(["id", "Case", true], ["task", "Task"], ["mode", "Failure"], ["context", "Context"], ["deficiency", "Likely deficiency"]),
      rows,
    };
  }

  acquisitionList(env: string): ListView {
    const base = this.listShell(
      env,
      "Active acquisition",
      `MDV ${MDV_VERSION} = ${MDV_WEIGHTS.information} IG + ${MDV_WEIGHTS.coverage} CG + ${MDV_WEIGHTS.failureGap} FG + ${MDV_WEIGHTS.safety} SG − ${MDV_WEIGHTS.redundancy} R. Features are authored on the fixture. This is not a trained value model.`,
    );
    if (!base) return this.unavailableList("Active acquisition", "field-sim has no acquisition requests.", "acquisition.v1");
    const ranked = [...acquisitions].sort((a, b) => this.mdv(b) - this.mdv(a));
    const rows = ranked.map((acquisition) => {
      const runtime = this.acquisitionState.get(acquisition.id)!;
      const score = this.mdv(acquisition);
      const tones: Record<string, Tone> = {
        state: runtime.state === "open" ? "warn" : runtime.state === "scheduled" ? "ok" : "muted",
      };
      if (score < 0.3) tones.mdv = "muted";
      return this.row(
        "acquisition",
        acquisition.id,
        {
          id: acquisition.id,
          task: acquisition.task,
          count: acquisition.count,
          mdv: n3(score),
          state: runtime.state,
          failure: acquisition.failureId,
        },
        tones,
        [
          field("MDV", n3(score), { mono: true }),
          field("State", runtime.state),
          field("Count", acquisition.count),
          field("Specification", acquisition.spec),
          field("Features", `IG ${n2(acquisition.informationGain)} · CG ${n2(acquisition.coverageGain)} · FG ${n2(acquisition.failureGap)} · SG ${n2(acquisition.safetyGain)} · R ${n2(acquisition.redundancy)}`),
        ],
      );
    });
    return {
      ...base,
      columns: cols(
        ["id", "Request", true],
        ["task", "Task"],
        ["count", "Count"],
        ["mdv", "MDV", true, "right"],
        ["state", "State"],
        ["failure", "Failure", true],
      ),
      rows,
    };
  }

  deployments(env: string): ListView {
    const base = this.listShell(env, "Deployments", "Modes are the requested posture of a fixture release. FleetSafe is not armed. Nothing in this table is deployed on hardware.");
    if (!base) return this.unavailableList("Deployments", "field-sim has no deployments.", "deployment.v1");
    const rows = deployments.map((deployment) => {
      const embodiment = embodiments.find((item) => item.id === deployment.embodimentId)!;
      const verdict = this.verdictState.get(deployment.verdictId)!;
      return this.row(
        "deployment",
        deployment.id,
        {
          id: deployment.id,
          embodiment: embodiment.name,
          mode: deployment.mode,
          verdict: `${deployment.verdictId} ${verdict.state}`,
          runtime: "unavailable",
          origin: "fixture",
        },
        { mode: deployment.mode === "stopped" ? "bad" : "warn", runtime: "muted", verdict: verdict.state === "pending" ? "warn" : "ok" },
        [
          field("Mode", deployment.mode),
          field("Embodiment", embodiment.name),
          field("Dataset", deployment.datasetId, { mono: true }),
          field("Verdict", `${deployment.verdictId} · ${verdict.state}`, { mono: true }),
          field("FleetSafe runtime", "unavailable", { tone: "muted" }),
          field("Note", deployment.note),
        ],
      );
    });
    return {
      ...base,
      columns: cols(
        ["id", "Deployment", true],
        ["embodiment", "Embodiment"],
        ["mode", "Requested mode"],
        ["verdict", "Verdict"],
        ["runtime", "FleetSafe"],
        ["origin", "Origin"],
      ),
      rows,
    };
  }

  evidence(env: string) {
    this.assertEnv(env);
    if (env === ENV_FIELD) {
      return {
        title: "Evidence",
        lede: "field-sim has no release manifest.",
        origin: "unavailable" as const,
        unavailable: unavailable("adapter:environment", "field-sim has no release manifest.", "evidence.v1", OBSERVED_AT),
        items: [],
        present: 0,
        total: 0,
      };
    }
    const summary = this.evidenceSummary();
    return {
      title: "Evidence",
      id: "ev-pade-0.1.0",
      lede: "Release pade-0.1.0-fixture. Present means the control plane has the artifact. Blocked means an adapter would have to produce it. Nothing here was measured on hardware.",
      origin: "fixture" as const,
      source: CORPUS_SOURCE,
      present: summary.present,
      total: summary.total,
      items: evidenceItems.map((item) => ({ ...item })),
    };
  }

  search(env: string, query: string) {
    this.assertEnv(env);
    if (env === ENV_FIELD) {
      return { results: [], note: "field-sim has no corpus to search." };
    }
    const q = query.trim().toLowerCase();
    if (!q) return { results: [], note: null as string | null };
    const results: { kind: string; id: string; title: string; subtitle: string; origin: Origin }[] = [];
    const push = (kind: string, id: string, title: string, subtitle: string, origin: Origin = "fixture") => {
      const hay = `${kind} ${id} ${title} ${subtitle}`.toLowerCase();
      if (hay.includes(q)) results.push({ kind, id, title, subtitle, origin });
    };
    for (const demo of demos) push("demonstration", demo.id, demo.id, demo.task);
    for (const embodiment of embodiments) push("embodiment", embodiment.id, embodiment.name, embodiment.className);
    for (const dataset of datasets) push("dataset", dataset.id, dataset.name, dataset.purpose);
    for (const arm of ARMS) push("experiment", arm.id, `${arm.code} ${arm.name}`, arm.question);
    for (const plan of counterfactuals) push("counterfactual", plan.id, plan.perturbation, plan.failureId);
    for (const event of safetyEvents) push("safety-event", event.id, event.id, event.summary);
    for (const verdict of verdicts) push("verdict", verdict.id, verdict.gate, verdict.subjectId);
    for (const incident of incidents) push("incident", incident.id, incident.id, incident.summary);
    for (const failure of failures) push("failure", failure.id, failure.task, failure.mode);
    for (const acquisition of acquisitions) push("acquisition", acquisition.id, acquisition.task, acquisition.spec);
    for (const deployment of deployments) push("deployment", deployment.id, deployment.id, deployment.mode);
    for (const artifact of artifacts) push("artifact", artifact.id, artifact.name, artifact.artifactKind);
    push("evidence", "ev-pade-0.1.0", "Release manifest", "pade-0.1.0-fixture");
    for (const adapter of adapters) push("adapter", adapter.id, adapter.name, adapter.contract, "unavailable");
    return { results: results.slice(0, 20), note: null as string | null };
  }

  object(env: string, kind: string, id: string): Workspace {
    this.assertEnv(env);
    if (env === ENV_FIELD) {
      throw new RegistryError(404, "field-sim has no objects. The lab-uk corpus is not in this environment.");
    }
    const workspace = this.buildObject(kind, id);
    if (!workspace) throw new RegistryError(404, `No ${kind} ${id} in lab-uk.`);
    return workspace;
  }

  reviewDemonstration(env: string, id: string, action: ReviewAction, actor: string) {
    this.assertLab(env);
    this.assertActor(actor);
    const demo = demos.find((item) => item.id === id);
    const runtime = this.demoState.get(id);
    if (!demo || !runtime) throw new RegistryError(404, `No demonstration ${id}.`);
    if (runtime.review !== "pending") throw new RegistryError(409, `${id} is already confirmed.`);
    const policy = evaluateAdmission(demo);
    runtime.review = "confirmed";
    runtime.operator = action;
    runtime.actor = actor;
    runtime.at = new Date().toISOString();
    const diverged = REVIEW_STATE[action] !== policy.admission;
    const text = diverged
      ? `Operator ${action} diverges from policy ${policy.admission}. Dataset membership was not changed.`
      : `Operator ${action} confirms policy ${policy.admission}. Dataset membership was not changed.`;
    this.pushAudit(actor, text, "demonstration", id);
    return this.object(env, "demonstration", id);
  }

  decideVerdict(env: string, id: string, action: VerdictAction, actor: string) {
    this.assertLab(env);
    this.assertActor(actor);
    const verdict = verdicts.find((item) => item.id === id);
    const runtime = this.verdictState.get(id);
    if (!verdict || !runtime) throw new RegistryError(404, `No verdict ${id}.`);
    if (runtime.state !== "pending") throw new RegistryError(409, `${id} is already confirmed.`);
    runtime.state = "confirmed";
    runtime.operator = action;
    runtime.actor = actor;
    runtime.at = new Date().toISOString();
    const diverged = action !== verdict.recommendation;
    const text = diverged
      ? `Operator decided ${action}. Policy recommended ${verdict.recommendation}. No deployment was started.`
      : `Operator decided ${action}, matching the policy recommendation. No deployment was started.`;
    this.pushAudit(actor, text, "verdict", id);
    return this.object(env, "verdict", id);
  }

  setAcquisition(env: string, id: string, action: AcquisitionAction, actor: string) {
    this.assertLab(env);
    this.assertActor(actor);
    const acquisition = acquisitions.find((item) => item.id === id);
    const runtime = this.acquisitionState.get(id);
    if (!acquisition || !runtime) throw new RegistryError(404, `No acquisition ${id}.`);
    if (runtime.state !== "open") throw new RegistryError(409, `${id} is already ${runtime.state}.`);
    runtime.state = action;
    runtime.actor = actor;
    runtime.at = new Date().toISOString();
    this.pushAudit(actor, `Operator marked ${id} ${action}. No capture job was sent.`, "acquisition", id);
    return this.object(env, "acquisition", id);
  }

  private buildObject(kind: string, id: string): Workspace | null {
    switch (kind) {
      case "demonstration":
        return this.demoWorkspace(id);
      case "embodiment":
        return this.embodimentWorkspace(id);
      case "dataset":
        return this.datasetWorkspace(id);
      case "experiment":
        return this.experimentWorkspace(id);
      case "counterfactual":
        return this.planWorkspace(id);
      case "safety-event":
        return this.safetyWorkspace(id);
      case "verdict":
        return this.verdictWorkspace(id);
      case "incident":
        return this.incidentWorkspace(id);
      case "failure":
        return this.failureWorkspace(id);
      case "acquisition":
        return this.acquisitionWorkspace(id);
      case "deployment":
        return this.deploymentWorkspace(id);
      case "evidence":
        return id === "ev-pade-0.1.0" ? this.evidenceWorkspace() : null;
      case "artifact":
        return this.artifactWorkspace(id);
      case "adapter":
        return this.adapterWorkspace(id);
      default:
        return null;
    }
  }

  private demoWorkspace(id: string): Workspace | null {
    const demo = demos.find((item) => item.id === id);
    if (!demo) return null;
    const view = this.demoFacts(demo);
    const qualityRows = QUALITY_KEYS.map((key) => ({
      cells: [key, n2(demo.quality[key])],
      tones: [undefined, demo.quality[key] < 0.5 ? ("bad" as const) : demo.quality[key] < 0.7 ? ("warn" as const) : undefined],
    }));
    const fitRows = Object.entries(demo.embodimentFits).map(([embodiment, fit]) => ({
      cells: [embodiment, n2(fit)],
    }));
    return this.finish({
      kind: "demonstration",
      id: demo.id,
      title: demo.id,
      subtitle: `${demo.task} — ${demo.subtask}`,
      origin: "fixture",
      source: CORPUS_SOURCE,
      originNote: FIXTURE_NOTE,
      summary: [
        field("Review", view.reviewLabel, { tone: view.pending ? "warn" : view.diverged ? "warn" : "ok" }),
        field("Policy", view.policy.admission, { tone: toneForAdmission(view.policy.admission) }),
        field("Train", view.policy.train, { tone: toneForGate(view.policy.train) }),
        field("Validation", view.policy.validation, { tone: toneForGate(view.policy.validation) }),
        field("Production", view.effectiveProduction, { tone: toneForGate(view.effectiveProductionGate) }),
        field("Origin", "fixture"),
      ],
      overview: [
        panel("Capture", [
          field("Operator", demo.operator, { mono: true }),
          field("Site", demo.site),
          field("Captured", demo.capturedAt, { mono: true }),
          field("Duration", `${demo.durationS.toFixed(1)} s`),
          field("Sensors", demo.sensors.join(", "), { mono: true }),
          field("Rig", demo.captureRig, { mono: true }),
          field("Target", demo.targetEmbodiment, { mono: true }),
          field("Digest", demo.hash, { mono: true }),
        ], "Digest is a fixture token. No media object is stored."),
        panel("Signals the policy actually reads", [
          field("Provenance", demo.provenance, { tone: signalTone(demo.provenance) }),
          field("Consent", demo.consent, { tone: signalTone(demo.consent) }),
          field("Licence", demo.licence, { tone: signalTone(demo.licence) }),
          field("Calibration", demo.calibration, { tone: signalTone(demo.calibration) }),
          field("Clock", demo.clockSync, { tone: signalTone(demo.clockSync) }),
          field("Observability", demo.observability, { tone: signalTone(demo.observability) }),
          field("Contamination", demo.contamination, { tone: signalTone(demo.contamination) }),
          field("Task relevance", n2(demo.taskRelevance), { mono: true }),
          field("Embodiment fit", n2(demo.embodimentFit), { mono: true }),
          field("Epistemic", n2(demo.epistemic), { mono: true }),
          field("Aleatoric", n2(demo.aleatoric), { mono: true }),
          field("Novelty", n2(demo.novelty), { mono: true }),
          field("Safety relevance", demo.safetyRelevance),
        ]),
        {
          title: "Quality vector",
          note: "Not collapsed to one score.",
          columns: ["Component", "Value"],
          rows: qualityRows,
        },
        {
          title: "Embodiment fit by target",
          columns: ["Embodiment", "Fit"],
          rows: fitRows,
        },
      ],
      evidence: [
        panel("Policy " + view.policy.policyVersion, [
          field("Admission", view.policy.admission, { tone: toneForAdmission(view.policy.admission) }),
          field("Reasons", view.policy.reasons.join(" ") || "None."),
          field("Operator", view.diverged ? `Override to ${view.operatorState}.` : view.pending ? "Not confirmed." : "No override."),
        ]),
      ],
      actions: view.pending
        ? [
            { id: "admit", label: "Admit", group: "review" },
            { id: "quarantine", label: "Quarantine", group: "review" },
            { id: "reject", label: "Reject", group: "review" },
          ]
        : [],
    });
  }

  private embodimentWorkspace(id: string): Workspace | null {
    const embodiment = embodiments.find((item) => item.id === id);
    if (!embodiment) return null;
    return this.finish({
      kind: "embodiment",
      id,
      title: embodiment.name,
      subtitle: embodiment.className,
      origin: "fixture",
      source: CORPUS_SOURCE,
      originNote: FIXTURE_NOTE,
      summary: [
        field("Qualification", embodiment.qualification, { tone: toneForQual(embodiment.qualification) }),
        field("Adapter", embodiment.adapter, { mono: true }),
        field("Origin", "fixture"),
      ],
      overview: [
        panel("Card", [
          field("Note", embodiment.note),
          field("Missing", embodiment.missing.join("; ") || "None listed."),
        ]),
        {
          title: "Canonical embodied action",
          note: "Same field list for every embodiment. The adapter column is this card's coverage, not a measured transfer result.",
          columns: ["Field", "Rule", "This card"],
          rows: CEAR_FIELDS.map((item) => ({
            cells: [item.field, item.rule, cearCell(embodiment, item.field)],
          })),
        },
      ],
      evidence: [panel("Qualification evidence", [field("Status", "No transfer experiment has been run."), field("Backend", "training.v1 unavailable", { tone: "muted" })])],
      actions: [],
    });
  }

  private datasetWorkspace(id: string): Workspace | null {
    const dataset = datasets.find((item) => item.id === id);
    if (!dataset) return null;
    return this.finish({
      kind: "dataset",
      id,
      title: dataset.name,
      subtitle: dataset.id,
      origin: "fixture",
      source: CORPUS_SOURCE,
      originNote: FIXTURE_NOTE,
      summary: [field("Members", String(dataset.memberIds.length)), field("Weighting", dataset.id === "ds-core-train" ? "uniform" : "not a train weight"), field("Origin", "fixture")],
      overview: [
        panel("Purpose", [field("Note", dataset.purpose)]),
        {
          title: "Members",
          columns: ["Record", "Task", "Policy", "Train", "Review"],
          rows: dataset.memberIds.map((memberId) => {
            const demo = this.demoById(memberId);
            const policy = evaluateAdmission(demo);
            const runtime = this.demoState.get(memberId)!;
            return { cells: [memberId, demo.task, policy.admission, policy.train, runtime.review] };
          }),
        },
      ],
      evidence: [panel("Lineage", [field("Source", CORPUS_SOURCE, { mono: true }), field("Policy", POLICY_VERSION, { mono: true })])],
      actions: [],
    });
  }

  private experimentWorkspace(id: string): Workspace | null {
    const arm = ARMS.find((item) => item.id === id);
    if (!arm) return null;
    return this.finish({
      kind: "experiment",
      id,
      title: `${arm.code} — ${arm.name}`,
      subtitle: arm.question,
      origin: "fixture",
      source: CORPUS_SOURCE,
      originNote: FIXTURE_NOTE,
      summary: [field("Status", "not run", { tone: "muted" }), field("Dataset", arm.datasetId ?? "—", { mono: true }), field("Origin", "fixture")],
      overview: [
        panel("Protocol", [
          field("Question", arm.question),
          field("Conditions", String(CONDITIONS.length)),
          field("Result", "No execution backend. No metric is stored."),
        ]),
        { title: "Conditions", columns: ["Condition", "Status"], rows: CONDITIONS.map((condition) => ({ cells: [condition, "not run"] })) },
      ],
      evidence: [panel("Backend", [field("Contract", "training.v1", { mono: true }), field("State", "unavailable", { tone: "muted" })])],
      actions: [],
    });
  }

  private planWorkspace(id: string): Workspace | null {
    const plan = counterfactuals.find((item) => item.id === id);
    if (!plan) return null;
    return this.finish({
      kind: "counterfactual",
      id,
      title: plan.perturbation,
      subtitle: plan.id,
      origin: "fixture",
      source: CORPUS_SOURCE,
      originNote: "Fixture plan. Not a simulated result. Isaac Sim has not run it.",
      summary: [field("Status", "not run", { tone: "muted" }), field("Failure", plan.failureId, { mono: true }), field("Origin", "fixture")],
      overview: [panel("Why this plan exists", [field("Perturbation", plan.perturbation), field("Rationale", plan.why)])],
      evidence: [panel("Execution", [field("Isaac Sim", "unavailable", { tone: "muted" }), field("ROS 2", "unavailable", { tone: "muted" })])],
      actions: [],
    });
  }

  private safetyWorkspace(id: string): Workspace | null {
    const event = safetyEvents.find((item) => item.id === id);
    if (!event) return null;
    return this.finish({
      kind: "safety-event",
      id,
      title: event.id,
      subtitle: event.summary,
      origin: "fixture",
      source: CORPUS_SOURCE,
      originNote: "Fixture case. The tuple is the contract shape. No shield produced this row.",
      summary: [field("Deployment", event.deploymentId, { mono: true }), field("TTC", event.ttc), field("Origin", "fixture")],
      overview: [
        panel("Intervention tuple", [
          field("a_proposed", event.proposed, { mono: true }),
          field("a_safe", event.safeAction, { mono: true }),
          field("x", event.state),
          field("h(x)", event.constraint),
          field("TTC", event.ttc, { mono: true }),
          field("U", event.uncertainty, { mono: true }),
          field("Margin", event.margin, { mono: true }),
          field("When", event.at, { mono: true }),
        ]),
      ],
      evidence: [panel("Runtime", [field("FleetSafe", "unavailable", { tone: "muted" }), field("Contract", "fleetsafe.runtime.v1", { mono: true })])],
      actions: [],
    });
  }

  private verdictWorkspace(id: string): Workspace | null {
    const verdict = verdicts.find((item) => item.id === id);
    if (!verdict) return null;
    const runtime = this.verdictState.get(id)!;
    const diverged = Boolean(runtime.operator && runtime.operator !== verdict.recommendation);
    return this.finish({
      kind: "verdict",
      id,
      title: verdict.id,
      subtitle: verdict.gate,
      origin: "fixture",
      source: runtime.operator ? SESSION_SOURCE : CORPUS_SOURCE,
      originNote: runtime.operator ? SESSION_NOTE : FIXTURE_NOTE,
      summary: [
        field("Recommendation", verdict.recommendation, { tone: toneForGate(verdict.recommendation) }),
        field("State", runtime.state, { tone: runtime.state === "pending" ? "warn" : "ok" }),
        field("Decision", this.shownVerdict(id), { tone: diverged ? "warn" : undefined }),
      ],
      overview: [
        panel("Subject", [
          field("Kind", verdict.subjectKind),
          field("Id", verdict.subjectId, { mono: true }),
          field("Policy", verdict.policy, { mono: true }),
          field("Divergence", diverged ? "Operator differs from the policy recommendation." : "None."),
        ]),
      ],
      evidence: [panel("Reasons", verdict.reasons.map((reason, index) => field(String(index + 1), reason)))],
      actions: runtime.state === "pending"
        ? [
            { id: "allow", label: "Allow", group: "verdict" },
            { id: "conditional", label: "Conditional", group: "verdict" },
            { id: "deny", label: "Deny", group: "verdict" },
          ]
        : [],
    });
  }

  private incidentWorkspace(id: string): Workspace | null {
    const incident = incidents.find((item) => item.id === id);
    if (!incident) return null;
    return this.finish({
      kind: "incident",
      id,
      title: incident.id,
      subtitle: incident.summary,
      origin: "fixture",
      source: CORPUS_SOURCE,
      originNote: "Fixture incident. Not a Sentinel stream event.",
      summary: [field("When", incident.at, { mono: true }), field("Deployment", incident.deploymentId, { mono: true })],
      overview: [panel("Disposition", [field("Note", incident.disposition)])],
      evidence: [panel("Stream", [field("Sentinel", "unavailable", { tone: "muted" })])],
      actions: [],
    });
  }

  private failureWorkspace(id: string): Workspace | null {
    const failure = failures.find((item) => item.id === id);
    if (!failure) return null;
    return this.finish({
      kind: "failure",
      id,
      title: failure.id,
      subtitle: failure.task,
      origin: "fixture",
      source: CORPUS_SOURCE,
      originNote: "Authored fixture case. Not a counted field failure.",
      summary: [field("Mode", failure.mode), field("Context", failure.context)],
      overview: [
        panel("Case", [
          field("Uncertainty", failure.uncertainty),
          field("Safety", failure.safety),
          field("Deficiency", failure.deficiency),
          field("Nearest", failure.nearest.join(", "), { mono: true }),
          field("Recommended acquisition", failure.recommendation),
          field("Simulation", failure.simNeed),
        ]),
      ],
      evidence: [panel("What this is not", [field("Rate", "No rollout count exists for this case.")])],
      actions: [],
    });
  }

  private acquisitionWorkspace(id: string): Workspace | null {
    const acquisition = acquisitions.find((item) => item.id === id);
    if (!acquisition) return null;
    const runtime = this.acquisitionState.get(id)!;
    const score = this.mdv(acquisition);
    return this.finish({
      kind: "acquisition",
      id,
      title: acquisition.id,
      subtitle: acquisition.task,
      origin: "fixture",
      source: runtime.actor ? SESSION_SOURCE : CORPUS_SOURCE,
      originNote: runtime.actor ? SESSION_NOTE : FIXTURE_NOTE,
      summary: [
        field("MDV", n3(score), { mono: true }),
        field("State", runtime.state, { tone: runtime.state === "open" ? "warn" : runtime.state === "scheduled" ? "ok" : "muted" }),
        field("Count", acquisition.count),
      ],
      overview: [
        panel("Request", [
          field("Failure", acquisition.failureId, { mono: true }),
          field("Specification", acquisition.spec),
          field("IG", n2(acquisition.informationGain), { mono: true }),
          field("CG", n2(acquisition.coverageGain), { mono: true }),
          field("FG", n2(acquisition.failureGap), { mono: true }),
          field("SG", n2(acquisition.safetyGain), { mono: true }),
          field("R", n2(acquisition.redundancy), { mono: true }),
          field("Formula", `${MDV_VERSION}: ${MDV_WEIGHTS.information} IG + ${MDV_WEIGHTS.coverage} CG + ${MDV_WEIGHTS.failureGap} FG + ${MDV_WEIGHTS.safety} SG − ${MDV_WEIGHTS.redundancy} R`),
        ], "Features are authored. Scheduling does not dispatch a capture rig."),
      ],
      evidence: [panel("Value model", [field("Trained model", "None."), field("Computation", "marginalDemonstrationValue in @pade/domain")])],
      actions: runtime.state === "open"
        ? [
            { id: "scheduled", label: "Mark scheduled", group: "acquisition" },
            { id: "dismissed", label: "Dismiss", group: "acquisition" },
          ]
        : [],
    });
  }

  private deploymentWorkspace(id: string): Workspace | null {
    const deployment = deployments.find((item) => item.id === id);
    if (!deployment) return null;
    const embodiment = embodiments.find((item) => item.id === deployment.embodimentId)!;
    const verdict = this.verdictState.get(deployment.verdictId)!;
    return this.finish({
      kind: "deployment",
      id,
      title: deployment.id,
      subtitle: `${embodiment.name} · ${deployment.mode}`,
      origin: "fixture",
      source: CORPUS_SOURCE,
      originNote: "Fixture release intent. No robot is connected.",
      summary: [
        field("Mode", deployment.mode),
        field("Verdict", `${deployment.verdictId} ${verdict.state}`, { mono: true }),
        field("FleetSafe", "unavailable", { tone: "muted" }),
      ],
      overview: [
        panel("Release", [
          field("Release", "pade-0.1.0-fixture", { mono: true }),
          field("Environment", ENV_LAB),
          field("Embodiment", embodiment.name),
          field("Dataset", deployment.datasetId, { mono: true }),
          field("Model", "none"),
          field("Note", deployment.note),
        ]),
      ],
      evidence: [panel("Runtime", [field("FleetSafe", "unavailable", { tone: "muted" }), field("Training", "unavailable", { tone: "muted" })])],
      actions: [],
    });
  }

  private evidenceWorkspace(): Workspace {
    const summary = this.evidenceSummary();
    return this.finish({
      kind: "evidence",
      id: "ev-pade-0.1.0",
      title: "Release manifest",
      subtitle: "pade-0.1.0-fixture",
      origin: "fixture",
      source: CORPUS_SOURCE,
      originNote: FIXTURE_NOTE,
      summary: [field("Present", `${summary.present}/${summary.total}`), field("Origin", "fixture")],
      overview: [
        {
          title: "Required artifacts",
          columns: ["Artifact", "State", "Ref", "Reason"],
          rows: evidenceItems.map((item) => ({
            cells: [item.name, item.state, item.ref, item.reason],
            tones: [undefined, item.state === "present" ? ("ok" as const) : item.state === "pending" ? ("warn" as const) : ("bad" as const)],
          })),
        },
      ],
      evidence: [panel("Traceability", [field("Rule", "Present counts. Pending, missing, and blocked do not.")])],
      actions: [],
    });
  }

  private artifactWorkspace(id: string): Workspace | null {
    const artifact = artifacts.find((item) => item.id === id);
    if (!artifact) return null;
    return this.finish({
      kind: "artifact",
      id,
      title: artifact.name,
      subtitle: artifact.artifactKind,
      origin: "fixture",
      source: CORPUS_SOURCE,
      originNote: FIXTURE_NOTE,
      summary: [field("Status", artifact.status), field("Origin", "fixture")],
      overview: [panel("Record", [field("Note", artifact.note)])],
      evidence: [panel("Storage", [field("Object store", "Not attached. This row is the registry entry only.")])],
      actions: [],
    });
  }

  private adapterWorkspace(id: string): Workspace | null {
    const adapter = adapters.find((item) => item.id === id);
    if (!adapter) return null;
    const source = ADAPTER_SOURCE[id]!;
    return this.finish({
      kind: "adapter",
      id,
      title: adapter.name,
      subtitle: adapter.contract,
      origin: "unavailable",
      source,
      originNote: "Unavailable. The adapter is not connected. No zero is standing in for a measurement.",
      summary: [field("Contract", adapter.contract, { mono: true }), field("Origin", "unavailable", { tone: "muted" })],
      overview: [panel("Why this is empty", [field("Reason", adapter.reason)])],
      evidence: [panel("Contract", [field("Id", adapter.contract, { mono: true })])],
      actions: [],
    });
  }

  private finish(partial: Omit<Workspace, "lineage" | "runs" | "safety" | "decisions" | "activity">): Workspace {
    const lineage: LinkRef[] = [];
    for (const edge of edges) {
      if (edge.fromKind === partial.kind && edge.fromId === partial.id) {
        lineage.push({ kind: edge.toKind, id: edge.toId, relation: edge.relation, direction: "out" });
      } else if (edge.toKind === partial.kind && edge.toId === partial.id) {
        lineage.push({ kind: edge.fromKind, id: edge.fromId, relation: edge.relation, direction: "in" });
      }
    }
    const runs = lineage.filter((link) => ["experiment", "counterfactual", "deployment"].includes(link.kind)).map((link) => ({
      kind: link.kind,
      id: link.id,
      status: link.kind === "deployment" ? "fixture intent" : "not run",
    }));
    const safety = lineage
      .filter((link) => ["safety-event", "incident", "failure"].includes(link.kind))
      .map((link) => ({ kind: link.kind, id: link.id, summary: link.relation }));
    const decisionLinks = lineage.filter((link) => link.kind === "verdict");
    const decisions = decisionLinks.map((link) => {
      const verdict = verdicts.find((item) => item.id === link.id);
      const runtime = verdict ? this.verdictState.get(verdict.id) : undefined;
      return {
        id: link.id,
        gate: verdict?.gate ?? link.relation,
        decision: verdict ? this.shownVerdict(verdict.id) : "—",
        state: runtime?.state ?? "unknown",
        tone: verdict ? toneForGate(verdict.recommendation) : undefined,
      };
    });
    const activity = this.audit
      .filter((event) => event.subjectId === partial.id)
      .map((event) => ({ at: event.at, actor: event.actor, action: event.action, session: event.session }));
    return { ...partial, lineage, runs, safety, decisions, activity };
  }

  private demoFacts(demo: DemoSeed) {
    const policy: AdmissionDecision = evaluateAdmission(demo);
    const runtime = this.demoState.get(demo.id)!;
    const pending = runtime.review === "pending";
    const operatorState = runtime.operator ? REVIEW_STATE[runtime.operator] : undefined;
    const diverged = Boolean(operatorState && operatorState !== policy.admission);
    const reviewLabel = pending ? "pending" : diverged ? `confirmed · override ${operatorState}` : "confirmed";
    const effectiveProductionGate: Gate = operatorState && operatorState !== "admitted" ? "deny" : policy.production;
    const effectiveProduction = pending ? policy.production : effectiveProductionGate;
    return { policy, runtime, pending, operatorState, diverged, reviewLabel, effectiveProduction, effectiveProductionGate };
  }

  private shownVerdict(id: string): string {
    const verdict = verdicts.find((item) => item.id === id)!;
    const runtime = this.verdictState.get(id)!;
    if (runtime.operator) return runtime.operator;
    if (runtime.state === "confirmed") return verdict.recommendation;
    return "—";
  }

  private mdv(acquisition: AcquisitionSeed): number {
    return marginalDemonstrationValue(acquisition);
  }

  private evidenceSummary() {
    const present = evidenceItems.filter((item) => item.state === "present").length;
    return {
      present,
      total: evidenceItems.length,
      blocked: evidenceItems.filter((item) => item.state !== "present").map((item) => `${item.name}: ${item.state}`),
    };
  }

  private safetyList(): ListView {
    const rows = safetyEvents.map((event) =>
      this.row("safety-event", event.id, {
        id: event.id,
        at: event.at,
        summary: event.summary,
        proposed: event.proposed,
        safeAction: event.safeAction,
        ttc: event.ttc,
        uncertainty: event.uncertainty,
      }, {}, [
        field("Proposed", event.proposed),
        field("Safe", event.safeAction),
        field("State", event.state),
        field("Constraint", event.constraint),
        field("Origin", "fixture"),
      ]),
    );
    return {
      title: "Fixture intervention cases",
      lede: "Authored cases for the tuple. Not a runtime log.",
      source: CORPUS_SOURCE,
      origin: "fixture",
      columns: cols(
        ["id", "Event", true],
        ["at", "When", true],
        ["summary", "Summary"],
        ["proposed", "Proposed"],
        ["safeAction", "Safe action"],
        ["ttc", "TTC"],
        ["uncertainty", "U", false, "right"],
      ),
      rows,
    };
  }

  private incidentList(): ListView {
    const rows = incidents.map((incident) =>
      this.row("incident", incident.id, {
        id: incident.id,
        at: incident.at,
        summary: incident.summary,
        deployment: incident.deploymentId,
      }, {}, [field("Disposition", incident.disposition), field("Origin", "fixture")]),
    );
    return {
      title: "Fixture incidents",
      lede: "Not the Sentinel stream.",
      source: CORPUS_SOURCE,
      origin: "fixture",
      columns: cols(["id", "Incident", true], ["at", "When", true], ["summary", "Summary"], ["deployment", "Deployment", true]),
      rows,
    };
  }

  private row(kind: string, id: string, cells: Record<string, string>, tones: Record<string, Tone>, inspector: Field[]): ListRow {
    return { kind, id, cells, tones, inspector };
  }

  private listShell(env: string, title: string, lede: string): Omit<ListView, "columns" | "rows"> | null {
    this.assertEnv(env);
    if (env === ENV_FIELD) return null;
    return { title, lede, source: CORPUS_SOURCE, origin: "fixture" };
  }

  private emptyList(title: string, lede: string): ListView {
    const record = unavailable("adapter:environment", lede, "environment.v1", OBSERVED_AT);
    return { title, lede, source: record.source, origin: record.origin, unavailable: { reason: lede, contract: record.contract }, columns: [], rows: [] };
  }

  private unavailableList(title: string, reason: string, contract: string): ListView {
    const record = unavailable("adapter:environment", reason, contract, OBSERVED_AT);
    return {
      title,
      lede: reason,
      source: record.source,
      origin: record.origin,
      unavailable: { reason: record.reason, contract: record.contract },
      columns: [],
      rows: [],
    };
  }

  private demoById(id: string): DemoSeed {
    const demo = demos.find((item) => item.id === id);
    if (!demo) throw new Error(`corpus demo ${id} missing`);
    return demo;
  }

  private assertDatasetInvariants() {
    const core = datasets.find((dataset) => dataset.id === "ds-core-train")!;
    const quarantine = datasets.find((dataset) => dataset.id === "ds-quarantine")!;
    const validation = datasets.find((dataset) => dataset.id === "ds-validation")!;
    for (const id of core.memberIds) {
      const demo = this.demoById(id);
      const decision = evaluateAdmission(demo);
      if (demo.review !== "confirmed" || decision.admission !== "admitted" || decision.train !== "allow") {
        throw new Error(`${id} cannot sit in the train corpus`);
      }
    }
    for (const id of quarantine.memberIds) {
      if (evaluateAdmission(this.demoById(id)).admission !== "quarantine") throw new Error(`${id} is not quarantine`);
    }
    for (const id of validation.memberIds) {
      if (core.memberIds.includes(id)) throw new Error(`${id} leaks from validation into train`);
      if (evaluateAdmission(this.demoById(id)).validation !== "allow") throw new Error(`${id} failed the validation gate`);
    }
  }

  private pushAudit(actor: string, action: string, subjectKind: string, subjectId: string) {
    this.auditSeq += 1;
    this.audit.push({
      id: `AUD-S-${this.auditSeq}`,
      at: new Date().toISOString(),
      actor,
      action,
      subjectKind,
      subjectId,
      session: true,
    });
  }

  private assertEnv(env: string) {
    if (env !== ENV_LAB && env !== ENV_FIELD) throw new RegistryError(400, `Unknown environment ${env}.`);
  }

  private assertLab(env: string) {
    this.assertEnv(env);
    if (env !== ENV_LAB) throw new RegistryError(409, "field-sim has no corpus to modify.");
  }

  private assertActor(actor: string) {
    if (!actor.trim()) throw new RegistryError(400, "Actor is required.");
  }
}

function cearCell(embodiment: { qualification: string; adapter: string; missing: string[] }, fieldName: string): string {
  if (embodiment.qualification === "capture only") return "source";
  if (embodiment.adapter === "none") return "no adapter";
  const needle = fieldName.toLowerCase();
  const missing = embodiment.missing.some((gap) => {
    const normalized = gap.toLowerCase().replace(" binding", "");
    return normalized.includes(needle) || needle.includes(normalized);
  });
  return missing ? "missing" : "in adapter";
}

function cols(
  ...items: [string, string, boolean?, "right"?][]
): ListView["columns"] {
  return items.map(([key, label, mono, align]) => ({ key, label, mono: Boolean(mono), align }));
}

