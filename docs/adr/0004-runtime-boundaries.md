# ADR 0004 — What v0.1 actually runs

## Status

Accepted.

## Decision

v0.1 is a typed control plane over an in-memory registry.

Included:

- Domain policy for admission and MDV, with tests.
- Fixture corpus for the lab-uk loop, labeled fixture.
- Explicit unavailable adapters: Isaac Sim (`isaac.sim.v1`), ROS 2 (`ros2.bridge.v1`), FleetSafe runtime (`fleetsafe.runtime.v1`), Sentinel telemetry (`sentinel.telemetry.v1`), training (`training.v1`).
- Operator actions on pending demonstrations, pending verdicts, and open acquisition requests.
- Object workspaces, command palette, and environment switch.

Not included, and not faked:

- PostgreSQL, object storage, MLflow, a trained VLA, Isaac execution, a ROS 2 graph, a live shield, or a telemetry stream.
- Authentication. The session is an unsigned local operator.
- Measured task success, safety rates, or sim-to-real gaps. The experiment matrix is a protocol whose cells are `not run`.

The registry is the port. A later process can replace `MemoryRegistry` without changing the origin rules or the workspace tabs.

## Consequences

Production gate `pnpm gate` fails the build if the UI introduces gradients, glass, or a fixture labeled live. It does not claim the missing adapters have been integrated.
