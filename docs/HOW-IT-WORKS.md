# How PADE works

Author: Frank Asante Van Laarhoven.

PADE sits between capture and deployment. It does not train a robot policy. It decides whether a demonstration may be used, for which body and task, and which demonstration should be collected next.

```text
capture → qualify → admit → represent → train → validate → authorise → monitor → recollect
```

The words in that line are the loop. Only qualify, admit, and the record of a collection are running. Train, validate, authorise, monitor, and recollect are specified. They are not claimed as measured.

## What a record is

A demonstration is a Demonstration Admissibility Record, not a single score. The quality vector is sensor, time, geometry, meaning, action, coverage, transfer, and safety.

`admission-0.1.0` returns admitted, quarantine, or rejected, and separate gates for train, validation, and production. Provenance, consent, licence, or contamination rejects the record. A clock, calibration, observability, or low sensor or action quality quarantines it. Production stays conditional when the body fit is low, the uncertainty is high, or a high safety-relevance record is not safe enough. The reasons are kept.

`mdv-0.1.0` ranks the next capture from information, coverage, failure gap, safety, and redundancy. Scheduling that request does not dispatch a rig.

The same rules exist in the TypeScript domain package and in the Rust kernel. The kernel is the one the harness calls. Changing a threshold changes the policy version.

## Where a record came from

Every record is one of four origins. The source id has to match.

| Origin | Source | Meaning |
| --- | --- | --- |
| `fixture` | `fixture:` | The authored lab-uk corpus, or an operator action on it |
| `live` | `robot:`, `isaac:`, `ros2:`, `fleetsafe-runtime:`, `sentinel-stream:`, `feed:` | An attached robot, runtime, or collection feed that has delivered a sample |
| `simulated` | `sim:` | A simulator result that was actually produced |
| `unavailable` | `adapter:` | A named adapter that is not connected |

A feed is `adapter:feed:…` until a sample arrives, then `feed:…` and `live`. A plan that has not been executed is not labelled simulated. `field-sim` has no data plane and does not copy `lab-uk`.

## What the operator sees

The control plane is a client. It is not the policy authority.

Opening a record uses the same tabs: overview, evidence, lineage, runs, safety, decisions, activity. Lists are projections of those records. The rail collapses. The page uses the width it frees. Counts are records, not a live fleet.

`lab-uk` is twelve authored demonstrations, five embodiments, four verdicts, four acquisition requests, three failure cases, and three safety cases. Those numbers are the size of the fixture, not a measurement from hardware.

## Collection

An operator registers a feed with what the data is, what it may be used for, and a model class: world-model, policy, value, perception, dynamics, foundation, or other. An http(s) endpoint is polled, or the operator posts a reading.

If the reading is an admission record, the kernel runs and the demonstration is pending. The operator may admit, quarantine, or reject. Dataset membership does not change. If the reading is anything else, the demonstration stays incomplete and the policy is `not run`.

## Who acted

On loopback, with no token, the session is an unsigned local operator and the state dies when the API process stops.

With `DATABASE_URL`, reviews, feeds, collected demonstrations, and the audit line are stored in PostgreSQL. With `PADE_OPERATOR_TOKEN`, mutations require that bearer token. The request body cannot choose a different actor. Each new audit line is HMAC-SHA256 over the time, actor, action, and subject. The token is not stored. A bind that is not loopback refuses to start when the token is empty.

## How a task is routed

The master is a router in the Go service. It selects one specialist. The specialist declares the tools it may call and the modalities it accepts. A missing tool blocks the route. The route says `untrained-harness` until a weight file exists.

| Specialist | Operation | Tools that exist today |
| --- | --- | --- |
| `admission` | Is this demonstration admissible | `registry.read` and `policy.evaluate` run |
| `embodiment` | Canonical action and body fit | Named. Not called |
| `acquisition` | What to collect next | Named. Not called |
| `safety` | What an intervention record means | Named. Not called |
| `verdict` | Whether a deployment may proceed | Named. Does not start a robot |
| `simulation` | Which counterfactual is worth running | Named. Isaac Sim is not attached |

A frontier model is called only when the route sets `frontier`, the tools are connected, a model id is selected, and `OPENROUTER_API_KEY` is set on the server. It does not replace the kernel.

## What is not attached

Isaac Sim, ROS 2, the FleetSafe runtime, the Sentinel stream, and a training job are unavailable on purpose. The experiment matrix is a protocol. Every cell is `not run`. No success rate is published.

Training readiness is recorded in `docs/TRAINING.md`.
