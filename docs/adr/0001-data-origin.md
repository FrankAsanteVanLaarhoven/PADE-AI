# ADR 0001 — Data origin is a closed label

## Status

Accepted. PADE v0.1.

## Decision

Every record the control plane can show carries one of four origins:

- `live` — an attached robot or runtime. Source id must start with `robot:`, `isaac:`, `ros2:`, `fleetsafe-runtime:`, or `sentinel-stream:`.
- `fixture` — the authored corpus `fixture:pade-v0.1`, or a local operator action on that corpus (`local-session`).
- `simulated` — a result produced by a simulator (`sim:`). A plan that has not been executed is not simulated.
- `unavailable` — an adapter that is not connected (`adapter:`). The record is a reason and a contract name, not a zero disguised as a measurement.

`assertOrigin` rejects any other combination. The v0.1 registry contains no `live` records and no `simulated` results. Isaac Sim, ROS 2, the FleetSafe runtime, and the Sentinel stream are unavailable on purpose.

Operator actions are stored as `fixture` / `local-session` and flagged `session: true`. They are not fleet telemetry. They live in process memory and disappear when the API restarts.

## Consequences

Screens must render the origin. Empty adapters render as unavailable, not as quiet zeros. A future Postgres registry has to keep the same label; it does not get to infer origin from which table a row sits in.
