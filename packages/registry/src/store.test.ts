import { describe, expect, it } from "vitest";
import { demos } from "./corpus.js";
import { MemoryRegistry, RegistryError } from "./store.js";

describe("MemoryRegistry", () => {
  it("labels the lab corpus as fixture and adapters as unavailable", () => {
    const registry = new MemoryRegistry();
    for (const demo of demos) {
      const object = registry.object("lab-uk", "demonstration", demo.id);
      expect(object.origin).toBe("fixture");
      expect(object.source).toBe("fixture:pade-v0.1");
    }
    expect(registry.object("lab-uk", "adapter", "adp-isaac").origin).toBe("unavailable");
    expect(registry.object("lab-uk", "adapter", "adp-fleetsafe").source).toBe("adapter:fleetsafe-runtime");
    const simulation = registry.simulation("lab-uk");
    expect(simulation.plans.every((plan) => plan.origin === "fixture" && plan.status === "not run")).toBe(true);
    expect(simulation.adapters.every((adapter) => adapter.origin === "unavailable")).toBe(true);
    expect(registry.experiments("lab-uk").cell).toBe("not run");
  });

  it("keeps admission decisions and dataset membership honest", () => {
    const registry = new MemoryRegistry();
    const rows = registry.demonstrations("lab-uk").rows;
    expect(rows.find((row) => row.id === "DAR-009440")?.cells.policy).toBe("rejected");
    expect(rows.find((row) => row.id === "DAR-009102")?.cells.production).toBe("allow");
    expect(rows.find((row) => row.id === "DAR-014402")?.cells.review).toBe("pending");
    expect(rows.find((row) => row.id === "DAR-014402")?.cells.policy).toBe("quarantine");
    const train = registry.datasetFactory("lab-uk").sets.find((set) => set.id === "ds-core-train")!;
    expect(train.members.map((member) => member.id)).toEqual(["DAR-008928", "DAR-008931", "DAR-009102"]);
    expect(registry.evidence("lab-uk").present).toBe(5);
    expect(registry.evidence("lab-uk").total).toBe(9);
    expect(registry.overview("lab-uk").health.find((item) => item.label === "Evidence")?.value).toBe("5/9");
  });

  it("ranks acquisition by the domain MDV function", () => {
    const registry = new MemoryRegistry();
    expect(registry.acquisitionList("lab-uk").rows.map((row) => row.id)).toEqual([
      "ACQ-030",
      "ACQ-031",
      "ACQ-032",
      "ACQ-033",
    ]);
    expect(Number(registry.acquisitionList("lab-uk").rows.at(-1)?.cells.mdv)).toBeLessThan(0.05);
  });

  it("does not copy lab-uk into field-sim", () => {
    const registry = new MemoryRegistry();
    const list = registry.demonstrations("field-sim");
    expect(list.origin).toBe("unavailable");
    expect(list.rows).toEqual([]);
    expect(registry.overview("field-sim").banner).toMatch(/not copied/);
    expect(() => registry.object("field-sim", "demonstration", "DAR-008928")).toThrow(RegistryError);
    expect(() => registry.meta("orbit")).toThrow(/Unknown environment/);
  });

  it("records operator overrides without editing membership or starting a robot", () => {
    const registry = new MemoryRegistry();
    const before = registry.datasetFactory("lab-uk").sets.map((set) => set.members.map((member) => member.id));
    const demo = registry.reviewDemonstration("lab-uk", "DAR-014402", "admit", "local-operator");
    expect(demo.activity.some((event) => event.session && event.action.includes("diverges"))).toBe(true);
    expect(demo.summary.find((item) => item.label === "Review")?.value).toMatch(/override/);
    const after = registry.datasetFactory("lab-uk").sets.map((set) => set.members.map((member) => member.id));
    expect(after).toEqual(before);
    expect(() => registry.reviewDemonstration("lab-uk", "DAR-014402", "reject", "local-operator")).toThrow(/already confirmed/);

    const verdict = registry.decideVerdict("lab-uk", "VD-1044", "deny", "local-operator");
    expect(verdict.activity.some((event) => event.action.includes("No deployment was started"))).toBe(true);
    expect(registry.deployments("lab-uk").rows.find((row) => row.id === "dep-shadow-g1")?.cells.runtime).toBe("unavailable");
  });

  it("describes CEAR coverage without pretending an unqualified robot has an adapter", () => {
    const registry = new MemoryRegistry();
    const cell = (id: string, field: string) => {
      const table = registry.object("lab-uk", "embodiment", id).overview.find((panel) => panel.title === "Canonical embodied action");
      return table?.rows?.find((row) => row.cells[0] === field)?.cells[2];
    };
    expect(cell("emb-umi", "task")).toBe("source");
    expect(cell("emb-g1", "task")).toBe("in adapter");
    expect(cell("emb-g1", "force / contact intent")).toBe("missing");
    expect(cell("emb-ur5e", "grasp state")).toBe("no adapter");
  });
});
