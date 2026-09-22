# PADE requirements

Author: Frank Asante Van Laarhoven  
Status: current  
License: Apache-2.0, open source  
Data: private by default

## Product

PADE is the control plane that decides whether a demonstration is admissible, transferable, and safe for a named robot, task, and site, and which demonstration should be collected next.

The company claim is evidence per deployment, not hours collected. Do not publish an unmeasured success rate, a simulated result that was not executed, or a novelty claim that has not been checked against the literature.

## Harness

Each model is a specialist for one operation. Specialists are multimodal where the task requires it: text, video, sensors, state, or scene. A specialist that does not declare a modality does not receive it.

The master is a router. For each request it:

1. selects one specialist,
2. reads the tools that specialist is allowed to call,
3. blocks the route if any required tool is not connected,
4. reports the harness model as untrained until a weight file exists,
5. calls a frontier model only when the request sets `frontier`, the required tools are connected, a model id is selected (`model`, then `OPENROUTER_MODEL_<SPECIALIST>`, then `OPENROUTER_MODEL`), and `OPENROUTER_API_KEY` is set on the server. The model id is configuration. It is not a vendor name written into the product.

Specialists:

| ID | Operation | Tools |
| --- | --- | --- |
| admission | Demonstration admissibility | `registry.read`, `policy.evaluate` |
| embodiment | Canonical action and body fit | `cear.read`, `embodiment.qualify` |
| acquisition | Next demonstration to collect | `atlas.read`, `mdv.rank` |
| safety | Intervention review | `safety.read` |
| verdict | Deployment authorisation | `verdict.propose` |
| simulation | Counterfactual planning | `isaac.submit` |

`verdict.propose` does not start a robot. The policy kernel does not call a model.

Own harness models will be trained per specialist. Until a model is trained, the route must say so. OpenRouter selects frontier models beside those harnesses. It does not replace the kernel. Readiness is `docs/TRAINING.md`. No harness is trainable on the authored fixture.

## Backend

- Rust for the deterministic kernel: origin, admission `admission-0.1.0`, marginal demonstration value `mdv-0.1.0`.
- Go for the harness service and the OpenRouter client.
- Make is the entry point: `make test`, `make build`.
- Secrets are environment variables. They are not committed.
- Production state is PostgreSQL (`DATABASE_URL`). A non-loopback bind requires `PADE_OPERATOR_TOKEN`. The audit line is signed with that token. A collected sample becomes a demonstration and runs `admission-0.1.0` only when the sample contains the contract.

## Control plane

The browser is an operator surface over labelled records. Origins are live, fixture, simulated, or unavailable. `lab-uk` is fixture. `field-sim` has no data plane.

## License and publication

- License: Apache-2.0.
- Copyright: Frank Asante Van Laarhoven.
- The code is open source.
- Fleet media, consent, credentials, and operator sessions stay private.
- The repository credit is the author named above. Do not add a vendor name, a model brand, or a generated-by line to the product.

## Out of scope until measured

- A trained specialist weight file.
- A live robot, Isaac Sim process, or ROS 2 graph.
- A claim that the integrated loop has been shown to beat volume-based collection.
