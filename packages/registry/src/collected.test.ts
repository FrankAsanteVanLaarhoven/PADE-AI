import { describe, expect, it } from "vitest";
import { admitSample } from "./collected.js";

const full = {
  quality: { sensor: 0.92, temporal: 0.9, geometric: 0.88, semantic: 0.86, action: 0.9, coverage: 0.7, transfer: 0.84, safety: 0.9 },
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
};

describe("admitSample", () => {
  it("does not invent a policy when the sample is not an admission record", () => {
    const row = admitSample({
      id: "smp-1",
      source: "feed:fd-1",
      observedAt: "2026-09-22T12:00:00.000Z",
      body: { pose: [0.1] },
      what: "joint state",
      use: "world-model training",
      modelClass: "world-model",
    });
    expect(row.origin).toBe("live");
    expect(row.source).toBe("feed:fd-1");
    expect(row.policy).toBeNull();
    expect(row.review).toBe("incomplete");
    expect(row.missing.length).toBeGreaterThan(0);
    expect(row.modelClass).toBe("world-model");
  });

  it("runs admission-0.1.0 when the sample carries the contract", () => {
    const row = admitSample({
      id: "smp-2",
      source: "feed:fd-1",
      observedAt: "2026-09-22T12:00:00.000Z",
      body: full,
      what: "grasp",
      use: "train",
      modelClass: "policy",
    });
    expect(row.review).toBe("pending");
    expect(row.policy?.policyVersion).toBe("admission-0.1.0");
    expect(row.policy?.admission).toBe("admitted");
    expect(row.policy?.production).toBe("allow");
    expect(row.missing).toEqual([]);
  });

  it("refuses a sample whose source is not an attached feed", () => {
    expect(() =>
      admitSample({
        id: "smp-3",
        source: "fixture:pade-v0.1",
        observedAt: "2026-09-22T12:00:00.000Z",
        body: full,
        what: "grasp",
        use: "train",
        modelClass: "policy",
      }),
    ).toThrow(/live origin requires/);
  });
});
