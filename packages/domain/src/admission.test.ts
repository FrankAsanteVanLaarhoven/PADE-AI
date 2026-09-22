import { describe, expect, it } from "vitest";
import { evaluateAdmission, type AdmissionInput } from "./admission.js";

const base = (): AdmissionInput => ({
  quality: {
    sensor: 0.92,
    temporal: 0.9,
    geometric: 0.88,
    semantic: 0.86,
    action: 0.9,
    coverage: 0.7,
    transfer: 0.84,
    safety: 0.9,
  },
  provenance: "verified",
  consent: "pass",
  licence: "pass",
  calibration: "pass",
  clockSync: "pass",
  observability: "pass",
  contamination: "none",
  taskRelevance: 0.93,
  embodimentFit: 0.86,
  epistemic: 0.12,
  safetyRelevance: "standard",
});

describe("evaluateAdmission", () => {
  it("allows production when every gate clears", () => {
    const d = evaluateAdmission(base());
    expect(d.admission).toBe("admitted");
    expect(d.train).toBe("allow");
    expect(d.validation).toBe("allow");
    expect(d.production).toBe("allow");
    expect(d.reasons).toEqual([]);
  });

  it("rejects unverified provenance before quality is considered", () => {
    const d = evaluateAdmission({ ...base(), provenance: "missing" });
    expect(d.admission).toBe("rejected");
    expect(d.train).toBe("deny");
    expect(d.production).toBe("deny");
  });

  it("rejects contamination and failed consent", () => {
    expect(evaluateAdmission({ ...base(), contamination: "detected" }).admission).toBe("rejected");
    expect(evaluateAdmission({ ...base(), consent: "fail" }).admission).toBe("rejected");
    expect(evaluateAdmission({ ...base(), licence: "fail" }).reasons[0]).toMatch(/consent or licence/);
  });

  it("quarantines clock, calibration, and weak observability", () => {
    expect(evaluateAdmission({ ...base(), clockSync: "fail" }).admission).toBe("quarantine");
    expect(evaluateAdmission({ ...base(), calibration: "fail" }).admission).toBe("quarantine");
    const weak = base();
    weak.quality = { ...weak.quality, sensor: 0.42 };
    expect(evaluateAdmission(weak).admission).toBe("quarantine");
    expect(evaluateAdmission({ ...base(), observability: "fail" }).train).toBe("deny");
  });

  it("keeps a useful demonstration conditional for production when embodiment fit is low", () => {
    const weakSafety = base();
    weakSafety.quality = { ...weakSafety.quality, safety: 0.8 };
    const d = evaluateAdmission({ ...weakSafety, embodimentFit: 0.71, safetyRelevance: "high" });
    expect(d.admission).toBe("admitted");
    expect(d.train).toBe("allow");
    expect(d.production).toBe("conditional");
    expect(d.reasons.some((r) => r.includes("embodiment fit"))).toBe(true);
    expect(d.reasons.some((r) => r.includes("safety quality"))).toBe(true);
  });

  it("denies train and production when the task is irrelevant", () => {
    const d = evaluateAdmission({ ...base(), taskRelevance: 0.2 });
    expect(d.admission).toBe("admitted");
    expect(d.train).toBe("deny");
    expect(d.production).toBe("deny");
  });

  it("refuses a quality component outside 0–1", () => {
    const bad = base();
    bad.quality = { ...bad.quality, sensor: 1.4 };
    expect(() => evaluateAdmission(bad)).toThrow();
  });
});
