# ADR 0005 — A durable operator is the production cut

## Status

Accepted.

## Decision

The fixture corpus stays in memory and stays labelled fixture. Production state is separate.

- `DATABASE_URL` stores operator actions, collection feeds, collected demonstrations, and the audit line in PostgreSQL. Without it, that state resets when the API process stops, and the control plane says so.
- `PADE_OPERATOR_TOKEN` names the operator (`PADE_OPERATOR_NAME`). Mutations require the bearer token. The request body cannot choose the actor. Each new audit line is HMAC-SHA256 over the time, actor, action, and subject. The token is not stored.
- `PADE_BIND` and `PADE_GO_ADDR` default to loopback. A non-loopback address refuses to start when the token is empty.
- A live sample is admitted only when its body matches the admission contract. Otherwise the demonstration is `incomplete`. No quality number is filled in.
- `registry.read` and `policy.evaluate` call the stored admission record and the Rust kernel. They do not start a robot.

## Consequences

A restart with `DATABASE_URL` returns the same reviews, feeds, and audit signatures. The lab-uk corpus is still the authored fixture. Isaac Sim, ROS 2, FleetSafe, Sentinel, and a trained specialist stay unavailable until a process or a weight file is attached.
