import { describe, expect, it } from "vitest";
import { admitSample } from "./collected.js";
import { MemoryRegistry } from "./store.js";
import { shadowStatus } from "./shadow.js";

const contract = {
  quality: { sensor: 0.92, temporal: 0.9, geometric: 0.88, semantic: 0.86, action: 0.9, coverage: 0.7, transfer: 0.84, safety: 0.9 },
  provenance: "verified" as const,
  consent: "pass" as const,
  licence: "pass" as const,
  calibration: "pass" as const,
  clockSync: "pass" as const,
  observability: "pass" as const,
  contamination: "none" as const,
  taskRelevance: 0.93,
  embodimentFit: 0.86,
  epistemic: 0.12,
  safetyRelevance: "standard" as const,
};

function collected(id: string) {
  return admitSample({
    id,
    source: "feed:fd-4",
    observedAt: "2026-09-22T12:00:00.000Z",
    body: contract,
    what: "grasp",
    use: "train",
    modelClass: "policy",
  });
}

describe("admission shadow log", () => {
  it("stays untrained when the log is empty", () => {
    expect(shadowStatus(0).trained).toBe(false);
    expect(shadowStatus(3).weight).toBeNull();
  });

  it("records a collected divergence and ignores a confirmation", () => {
    const registry = new MemoryRegistry();
    registry.signWith((event) => `sig:${event.actor}`);
    const row = collected("smp-4");
    registry.addCollected(row);
    registry.reviewDemonstration("lab-uk", row.id, "admit", "ada");
    expect(registry.admissionShadow()).toEqual([]);

    const other = collected("smp-5");
    registry.addCollected(other);
    registry.reviewDemonstration("lab-uk", other.id, "quarantine", "ada");
    const shadow = registry.admissionShadow();
    expect(shadow).toHaveLength(1);
    expect(shadow[0]?.kernel.admission).toBe("admitted");
    expect(shadow[0]?.operator).toBe("quarantine");
    expect(shadow[0]?.source).toBe("feed:fd-4");
    expect(shadow[0]?.signature).toBe("sig:ada");
    expect(shadowStatus(shadow.length).trained).toBe(false);
  });

  it("does not treat a fixture override as a training label", () => {
    const registry = new MemoryRegistry();
    registry.reviewDemonstration("lab-uk", "DAR-014402", "quarantine", "ada");
    expect(registry.admissionShadow()).toEqual([]);
  });
});
