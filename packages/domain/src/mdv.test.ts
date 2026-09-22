import { describe, expect, it } from "vitest";
import { MDV_WEIGHTS, marginalDemonstrationValue } from "./mdv.js";

const vector = {
  informationGain: 0.8,
  coverageGain: 0.5,
  failureGap: 0.9,
  safetyGain: 0.4,
  redundancy: 0.2,
};

describe("marginalDemonstrationValue", () => {
  it("matches the weighted sum", () => {
    const expected =
      MDV_WEIGHTS.information * 0.8 +
      MDV_WEIGHTS.coverage * 0.5 +
      MDV_WEIGHTS.failureGap * 0.9 +
      MDV_WEIGHTS.safety * 0.4 -
      MDV_WEIGHTS.redundancy * 0.2;
    expect(marginalDemonstrationValue(vector)).toBeCloseTo(expected, 10);
  });

  it("ranks a failure-gap demonstration above a redundant one", () => {
    const valuable = marginalDemonstrationValue({
      informationGain: 0.7,
      coverageGain: 0.6,
      failureGap: 0.95,
      safetyGain: 0.5,
      redundancy: 0.05,
    });
    const redundant = marginalDemonstrationValue({
      informationGain: 0.7,
      coverageGain: 0.6,
      failureGap: 0.1,
      safetyGain: 0.5,
      redundancy: 0.9,
    });
    expect(valuable).toBeGreaterThan(redundant);
  });

  it("rejects a feature outside the unit interval", () => {
    expect(() => marginalDemonstrationValue({ ...vector, redundancy: 2 })).toThrow();
  });
});
