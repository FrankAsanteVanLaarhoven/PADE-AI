import { describe, expect, it } from "vitest";
import { assertOrigin, unavailable } from "./origin.js";

describe("assertOrigin", () => {
  it("accepts a live robot source only as live", () => {
    expect(() => assertOrigin("live", "robot:g1-lab-01")).not.toThrow();
    expect(() => assertOrigin("fixture", "robot:g1-lab-01")).toThrow(/live source/);
  });

  it("refuses to call a fixture source live", () => {
    expect(() => assertOrigin("live", "fixture:pade-v0.1")).toThrow(/live origin requires/);
    expect(() => assertOrigin("fixture", "fixture:pade-v0.1")).not.toThrow();
  });

  it("keeps sim and adapter labels closed", () => {
    expect(() => assertOrigin("simulated", "sim:counterfactual-01")).not.toThrow();
    expect(() => assertOrigin("fixture", "sim:counterfactual-01")).toThrow(/sim source/);
    expect(() => assertOrigin("unavailable", "adapter:isaac-sim")).not.toThrow();
    expect(() => assertOrigin("unavailable", "fixture:pade-v0.1")).toThrow(/fixture source/);
  });

  it("builds an unavailable adapter record", () => {
    const u = unavailable("adapter:ros2", "No ROS 2 bridge is listening.", "ros2.bridge.v1", "2026-09-22T09:00:00Z");
    expect(u.origin).toBe("unavailable");
    expect(u.contract).toBe("ros2.bridge.v1");
  });
});
