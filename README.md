# PADE

Physical AI Assurance Data Engine, v0.1. A control plane for demonstration admissibility, embodiment representation, deployment verdicts, and failure-directed recollection.

This process does not train a policy, talk to a robot, or run Isaac Sim. `lab-uk` is an authored fixture corpus. `field-sim` has no data plane. Isaac Sim, ROS 2, the FleetSafe runtime, Sentinel telemetry, and the training backend are unavailable on purpose.

## Run

```bash
pnpm install
pnpm dev
```

The API listens on `127.0.0.1:8787`. The control plane is `http://127.0.0.1:4173`.

```bash
pnpm test
pnpm gate
```

Operator actions are kept in process memory and reset when the API restarts. The session is unsigned.

Architecture decisions are in `docs/adr/`.
