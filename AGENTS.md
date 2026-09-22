# PADE

Author: Frank Asante Van Laarhoven.

The product requirements live in `docs/REQUIREMENTS.md`. Follow them when changing this repository.

- Credit only Frank Asante Van Laarhoven. Do not add a vendor name, a model brand, or a generated-by line.
- The license is Apache-2.0. The code is open source. Fleet media, consent, credentials, and operator sessions stay private.
- Each operational model is one specialist. The master route selects that specialist and blocks when its tools are not connected.
- OpenRouter is the only frontier-model path. It runs only when a route asks for it and the server key is set. Harness weights stay marked untrained until a weight file exists.
- Deterministic policy stays in Rust. The harness service stays in Go. `make test` is the build check.
- Do not publish an unmeasured success rate, a simulated result that was not executed, or a claim that the loop has been shown to beat volume-based collection.
