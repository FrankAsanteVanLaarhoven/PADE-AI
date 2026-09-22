# ADR 0002 — One object workspace

## Status

Accepted. PADE v0.1.

## Decision

Demonstrations, embodiments, datasets, experiments, counterfactual plans, safety events, verdicts, incidents, failures, acquisition requests, deployments, evidence manifests, artifacts, and adapters are first-class objects. Lists are projections of those objects. Opening one always lands on the same workspace, with the same tabs:

Overview, Evidence, Lineage, Runs, Safety, Decisions, Activity.

A tab with nothing in it says why. It does not invent a related run to fill the space.

The shell is the Physical AI operations control plane: rail, command palette, environment selector, health strip. The environment `field-sim` is a real second scope with no data plane. It must not reuse the `lab-uk` fixture rows.

## Consequences

New operational nouns are added as objects and edges, not as a fresh dashboard. Lineage is an edge list, not a caption typed into a card.
