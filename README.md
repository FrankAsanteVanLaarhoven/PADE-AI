# PADE

Physical AI Assurance Data Engine.

PADE decides whether a human or robot demonstration is admissible, transferable, and safe for a named embodiment, task, and deployment — and which demonstration should be collected next. It does not compete on hours of video. It competes on evidence per deployment.

**Author:** Frank Asante Van Laarhoven  
**License:** Apache-2.0  
**Status:** open source. Fleet data, credentials, and operator sessions are private by default.

## The problem

Robotics teams can now collect demonstrations at scale. The expensive failure happens later: a trajectory enters a training set because it exists, a policy looks competent on a success rate, and the deployment has no record of why that trajectory was allowed onto that robot.

Volume does not answer the question a buyer, an insurer, or a safety lead actually asks.

> What evidence shows that this datum is useful, transferable, safe, reproducible, and admissible for this robot, this task, and this site?

## What PADE is

PADE is the control plane between capture and deployment.

```text
capture → qualify → admit → represent → train → validate → authorise → monitor → recollect
```

Every demonstration carries a Demonstration Admissibility Record. The record is a vector, not a single score: sensor, time, geometry, meaning, action, coverage, transfer, and safety. A deterministic policy (`admission-0.1.0`) returns admitted, quarantine, or rejected, and separate gates for train, validation, and production.

Marginal demonstration value (`mdv-0.1.0`) ranks the next capture from information, coverage, failure gap, safety, and redundancy. Scheduling a request does not dispatch a rig.

## What is true today

| Layer | State |
| --- | --- |
| Admission, origin labels, and demonstration value | Implemented twice and tested: TypeScript domain package and the Rust kernel |
| Operator control plane | Running against a labelled fixture corpus. Live, simulated, and unavailable are distinct |
| Specialist harness | Go router. Each task has one specialist, a modality list, and the tools that specialist is allowed to call |
| Frontier models | OpenRouter client. It does not run unless `OPENROUTER_API_KEY` is set |
| Specialist models | Named and not trained. A route says `untrained-harness` rather than inventing a weight file |
| Robots, Isaac Sim, ROS 2 | Not attached. The product says unavailable |

A route with a missing tool is blocked. That is the behaviour.

## Harness

The master is a router, not a general model.

1. A request names a task.
2. The router selects one specialist.
3. The specialist declares the tools it needs.
4. If those tools are not connected, the route stops.
5. If the specialist harness is not trained, the route says so.
6. A frontier model is optional. Set `"frontier": true` on the route. The model id comes from the request, then `OPENROUTER_MODEL_<SPECIALIST>`, then `OPENROUTER_MODEL`. The call goes out only when the tools are connected and `OPENROUTER_API_KEY` is set on the server.

| Specialist | Decides | Modalities | Tools |
| --- | --- | --- | --- |
| `admission` | Whether a demonstration may enter a set | Text, video, sensors | `registry.read`, `policy.evaluate` |
| `embodiment` | Whether a canonical action fits a body | Video, state, text | `cear.read`, `embodiment.qualify` |
| `acquisition` | Which demonstration to collect next | Text, state | `atlas.read`, `mdv.rank` |
| `safety` | What an intervention record means | State, sensors | `safety.read` |
| `verdict` | Whether a deployment may proceed | Text | `verdict.propose` |
| `simulation` | Which counterfactual is worth running | Scene, text | `isaac.submit` |

`verdict` proposes. It does not start a robot. The policy kernel does not call a model.

## Backend

The security boundary is Go and Rust.

- **Rust** (`backend/rust/pade-kernel`) holds admission, origin, and demonstration value. The rules are pure functions with tests.
- **Go** (`backend/go`) is the harness service: `GET /health`, `POST /v1/route`.
- **Make** is the build entry: `make test`, `make build`.

The browser control plane remains a typed client over the registry. It is not the policy authority.

```bash
make test
make build
```

`bin/pade` listens on `127.0.0.1:8788` unless `PADE_GO_ADDR` is set. A non-loopback address refuses to start unless `PADE_OPERATOR_TOKEN` is set.

```bash
curl -s localhost:8788/health
curl -s localhost:8788/v1/route \
  -H 'content-type: application/json' \
  -d '{"task":"admit this demonstration","connected":["registry.read","policy.evaluate"]}'
```

A frontier call is a separate, explicit request. Without a server key it returns `openrouter-unconfigured` and does not invent an answer.

OpenRouter, when used:

```bash
export OPENROUTER_API_KEY=...   # server only, never in the client
```

There is no key in this repository.

## Production

The fixture control plane stays on `127.0.0.1` with no token. To keep operator actions and collection:

```bash
export DATABASE_URL=postgres://...
export PADE_OPERATOR_TOKEN=...          # required before a non-loopback bind
export PADE_OPERATOR_NAME=ada
export PADE_BIND=0.0.0.0                # refused when the token is empty
export PADE_KERNEL_BIN=backend/rust/pade-kernel/target/release/kernel
```

A collected sample becomes a demonstration. If the sample body is an admission record, `admission-0.1.0` runs. If it is not, the row stays `incomplete` and no score is invented. The audit line is signed with the operator token. Dataset membership is not changed.

`registry.read` loads that admission record. `policy.evaluate` is the Rust kernel. The route blocks when either the record or the kernel is missing.

## Control plane

```bash
pnpm install
pnpm dev
```

The interface is at `http://127.0.0.1:4173`. `lab-uk` is the fixture corpus. `field-sim` has no data plane. Counts are records, not a live fleet.

## Private by default

The license is open source. The data is not.

- Demonstration media, consent, and operator actions are not published with this code.
- Credentials stay in the environment of the process that needs them.
- A fixture is labelled fixture. An unconnected adapter is labelled unavailable. A plan that has not been executed is not labelled simulated.
- The local session is unsigned. It is not an identity system.

## Company

PADE is built for teams that already collect robot data and cannot yet defend a deployment decision. The buyer is a robotics lab, a physical-AI data company, or the safety and platform group inside a manufacturer.

The commercial object is not a dashboard. It is the record that lets a customer answer an auditor: which demonstrations trained this policy, which were refused, which body they transfer to, and which failure caused the next collection.

## License

Apache License 2.0. Copyright 2026 Frank Asante Van Laarhoven. See `LICENSE` and `NOTICE`.
