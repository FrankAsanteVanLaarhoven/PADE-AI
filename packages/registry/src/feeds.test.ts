import { describe, expect, it } from "vitest";
import { FeedStore } from "./feeds.js";

describe("collection feeds", () => {
  it("stays unavailable until a sample arrives", () => {
    const feeds = new FeedStore();
    const feed = feeds.add({
      name: "arm",
      what: "joint state",
      use: "world-model training",
      modelClass: "world-model",
      endpoint: null,
    });
    expect(feed.origin).toBe("unavailable");
    expect(feed.source).toBe("adapter:feed:fd-1");
    expect(feed.modelClass).toBe("world-model");
  });

  it("labels an arrived sample as the attached feed", () => {
    const feeds = new FeedStore();
    const feed = feeds.add({
      name: "arm",
      what: "scene",
      use: "counterfactual",
      modelClass: "dynamics",
      endpoint: "http://127.0.0.1:9/state",
    });
    const sample = feeds.pushSample(feed.id, { pose: 1 }, "2026-09-22T12:00:00Z");
    expect(sample.origin).toBe("live");
    expect(sample.source).toBe("feed:fd-1");
    expect(sample.what).toBe("scene");
    expect(sample.use).toBe("counterfactual");
    expect(sample.modelClass).toBe("dynamics");
    expect(sample.body).toContain("pose");
    const listed = feeds.list()[0];
    expect(listed?.origin).toBe("live");
    expect(listed?.source).toBe("feed:fd-1");
  });

  it("does not relabel a live feed when a later read fails", () => {
    const feeds = new FeedStore();
    const feed = feeds.add({
      name: "arm",
      what: "image",
      use: "perception",
      modelClass: "perception",
      endpoint: "https://collector.example/frame",
    });
    feeds.pushSample(feed.id, "frame");
    const after = feeds.markUnreachable(feed.id, "timeout");
    expect(after.origin).toBe("live");
    expect(after.source).toBe("feed:fd-1");
    expect(after.lastError).toBe("timeout");
  });
});
