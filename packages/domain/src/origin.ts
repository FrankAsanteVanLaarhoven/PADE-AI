import { z } from "zod";

/** Where a record came from. These four labels are closed. */
export const originSchema = z.enum(["live", "fixture", "simulated", "unavailable"]);
export type Origin = z.infer<typeof originSchema>;

/**
 * Live sources are attached robot or runtime systems.
 * Fixture, sim, and unavailable records must not use these ids.
 */
const LIVE_SOURCE = /^(isaac|ros2|fleetsafe-runtime|sentinel-stream|robot):/;

export function assertOrigin(origin: Origin, source: string): void {
  const liveId = LIVE_SOURCE.test(source);
  if (origin === "live" && !liveId) {
    throw new Error(`live origin requires a robot or runtime source, got "${source}"`);
  }
  if (origin !== "live" && liveId) {
    throw new Error(`${origin} record cannot use live source "${source}"`);
  }
  if (source.startsWith("fixture:") && origin !== "fixture") {
    throw new Error(`fixture source "${source}" labeled ${origin}`);
  }
  if (source.startsWith("sim:") && origin !== "simulated") {
    throw new Error(`sim source "${source}" labeled ${origin}`);
  }
  if (origin === "unavailable" && !source.startsWith("adapter:")) {
    throw new Error(`unavailable record must name an adapter, got "${source}"`);
  }
}

export const unavailableSchema = z.object({
  origin: z.literal("unavailable"),
  source: z.string(),
  observedAt: z.string(),
  reason: z.string(),
  contract: z.string(),
});
export type Unavailable = z.infer<typeof unavailableSchema>;

export function unavailable(source: string, reason: string, contract: string, observedAt: string): Unavailable {
  assertOrigin("unavailable", source);
  return unavailableSchema.parse({ origin: "unavailable", source, observedAt, reason, contract });
}
