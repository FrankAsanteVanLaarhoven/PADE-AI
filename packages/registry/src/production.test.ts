import { describe, expect, it } from "vitest";
import { admitSample } from "./collected.js";
import { MemoryLedger } from "./ledger.js";
import { FeedStore } from "./feeds.js";
import { MemoryRegistry } from "./store.js";

describe("durable operator state", () => {
  it("reloads a collected demonstration and a signed review", async () => {
    const ledger = new MemoryLedger();
    const first = new MemoryRegistry();
    first.signWith((event) => `sig:${event.actor}:${event.action}`);
    const feeds = new FeedStore();
    const feed = feeds.add({ name: "arm", what: "grasp", use: "train", modelClass: "policy", endpoint: null });
    const sample = feeds.pushSample(feed.id, { pose: 1 }, "2026-09-22T12:00:00.000Z");
    const row = admitSample({ ...sample, what: feed.what, use: feed.use, modelClass: feed.modelClass });
    first.addCollected(row);
    await ledger.save({ runtime: first.exportRuntime(), feeds: feeds.list(), collected: first.collectedRecords() });

    const loaded = await ledger.load();
    const second = new MemoryRegistry();
    second.signWith((event) => `sig:${event.actor}:${event.action}`);
    second.restoreRuntime(loaded!.runtime);
    second.replaceCollected(loaded!.collected);
    const again = new FeedStore();
    again.restore(loaded!.feeds);
    const listed = second.demonstrations("lab-uk");
    const found = listed.rows.find((item) => item.id === row.id);
    expect(found?.cells.policy).toBe("not run");
    expect(found?.cells.review).toBe("incomplete");
    expect(again.list()[0]?.source).toBe("feed:fd-1");

    const full = admitSample({
      id: "smp-9",
      source: "feed:fd-9",
      observedAt: "2026-09-22T12:00:00.000Z",
      body: {
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
      },
      what: "grasp",
      use: "train",
      modelClass: "policy",
    });
    second.addCollected(full);
    const reviewed = second.reviewDemonstration("lab-uk", full.id, "admit", "ada");
    expect(reviewed.activity.at(-1)?.signature).toBe("sig:ada:Operator admit confirms policy admitted. Dataset membership was not changed.");
    expect(reviewed.activity.at(-1)?.actor).toBe("ada");
    const train = second.datasetFactory("lab-uk");
    expect(JSON.stringify(train)).not.toContain(full.id);
  });
});
