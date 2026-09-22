# ADR 0003 — Admission policy and marginal demonstration value

## Status

Accepted. Policy `admission-0.1.0`. MDV `mdv-0.1.0`.

## Decision

A demonstration is not a row that appears in a dataset because it was captured. `evaluateAdmission` returns a state and three gates:

- Reject when provenance is not verified, consent or licence fails, or contamination is detected. All gates deny.
- Quarantine when clock sync or calibration fails, observability fails, or sensor or action quality is below 0.50. All gates deny.
- Otherwise the record is admitted. Train allows at task relevance ≥ 0.50. Validation allows when geometric and temporal quality are both ≥ 0.70. Production allows only if train allows, embodiment fit ≥ 0.80, epistemic uncertainty ≤ 0.30, and a high safety-relevance record also has safety quality ≥ 0.85. Otherwise production is conditional, or deny when train is deny.

The quality vector is not collapsed to one score. VerdictPlane stores the reasons.

Marginal demonstration value is

`0.30 IG + 0.20 CG + 0.25 FG + 0.20 SG − 0.15 R`

computed from authored fixture features. It is not the output of a trained value model. v0.1 dataset membership is uniform across admitted, confirmed demonstrations. MDV does not yet reweight that corpus.

An operator may override a pending recommendation. The override is kept next to the policy result, including when they diverge.

## Consequences

Changing a threshold changes the policy version. Screens read the decision; they do not reimplement the inequalities.
