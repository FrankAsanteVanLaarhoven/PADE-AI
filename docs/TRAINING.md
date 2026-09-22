# Which harnesses can be trained

Author: Frank Asante Van Laarhoven.  
Status: none of the six harnesses is trainable on the data PADE holds.

A harness is trainable only when three things exist: an input the specialist is allowed to see, a label that was not written as the answer key, and a split that the model has not already been specified against. A weight file does not exist for any specialist. Every route still reports `untrained-harness`. This document does not authorise flipping that flag.

The lab-uk corpus is twelve authored demonstrations, five embodiments, four verdicts, four acquisition requests, three failure cases, and three safety cases. Those rows were written to exercise the policy. They are not a training set.

## Admission — not yet, and not instead of the kernel

`pade-admission` is the only specialist with a closed input contract and a reproducible label. The label is `admission-0.1.0` itself. Training a model to predict that label on these twelve records would copy a function that already runs exactly. The Rust kernel remains the authority.

The label worth learning later is an operator divergence: a person admitted, quarantined, or rejected against the kernel, on a record that was collected rather than authored. That log can be stored. It is empty. A shadow model may be trained against those divergences when the log exists. It must not replace `policy.evaluate`.

## Embodiment — no

`pade-embodiment` needs video, state, and a qualification that was measured on a body. The corpus has authored fit numbers and canonical-field gaps. It has no trajectories. `cear.read` and `embodiment.qualify` are not connected. There is nothing to train.

## Acquisition — no

`pade-acquisition` ranks the next capture with `mdv-0.1.0`, which is a fixed formula on authored features. A learned ranker needs a later outcome: the capture changed coverage or closed a failure gap. No such outcome has been recorded. `atlas.read` and `mdv.rank` are not connected.

## Safety — no

`pade-safety` must not be trained on the three authored intervention tuples. They are the shape of a record, not a shield log. A weight trained on them would not be a safety model. Training starts only from attached FleetSafe pairs: proposed action, safe action, state, constraint, and time to contact. That runtime is unavailable.

## Verdict — no

`pade-verdict` may one day draft a reason beside a recommendation. It must not become the gate. The four fixture verdicts have no deployment outcome. `verdict.propose` does not start a robot, and a trained model must not gain that authority.

## Simulation — no

`pade-simulation` needs a scene and a counterfactual that was executed. The plans in the corpus have not been run. Isaac Sim is unavailable. `isaac.submit` is not connected.

## What would make the first training run legitimate

1. Collected demonstrations, stored under `DATABASE_URL`, whose admission inputs were measured rather than authored.
2. Operator decisions on those records, signed, and kept when they diverge from `admission-0.1.0`.
3. A held-out split of those divergences. The fixture corpus is not that split.
4. A weight file for `pade-admission` only, evaluated as a shadow. The route keeps `untrained-harness` until that file exists and the evaluation is reported against the held-out split.
5. The kernel still decides. The shadow model does not.

No other harness starts before its own measured label exists. OpenRouter is not a substitute for that weight file.
