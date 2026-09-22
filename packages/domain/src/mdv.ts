import { z } from "zod";

/** Weights for policy version mdv-0.1.0. They sum the positive terms to 0.95, with redundancy subtracted. */
export const MDV_WEIGHTS = {
  information: 0.3,
  coverage: 0.2,
  failureGap: 0.25,
  safety: 0.2,
  redundancy: 0.15,
} as const;

export const MDV_VERSION = "mdv-0.1.0";

export const mdvInputSchema = z.object({
  informationGain: z.number().min(0).max(1),
  coverageGain: z.number().min(0).max(1),
  failureGap: z.number().min(0).max(1),
  safetyGain: z.number().min(0).max(1),
  redundancy: z.number().min(0).max(1),
});
export type MdvInput = z.infer<typeof mdvInputSchema>;

/** Marginal demonstration value. Higher means the next demonstration is more worth capturing. */
export function marginalDemonstrationValue(raw: MdvInput, weights = MDV_WEIGHTS): number {
  const v = mdvInputSchema.parse(raw);
  return (
    weights.information * v.informationGain +
    weights.coverage * v.coverageGain +
    weights.failureGap * v.failureGap +
    weights.safety * v.safetyGain -
    weights.redundancy * v.redundancy
  );
}
