use serde::{Deserialize, Serialize};
use thiserror::Error;

pub const POLICY_VERSION: &str = "admission-0.1.0";
pub const MDV_VERSION: &str = "mdv-0.1.0";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Origin {
    Live,
    Fixture,
    Simulated,
    Unavailable,
}

#[derive(Debug, Error, PartialEq, Eq)]
pub enum OriginError {
    #[error("live origin requires a robot or runtime source, got \"{0}\"")]
    LiveSourceRequired(String),
    #[error("{origin} record cannot use live source \"{label}\"")]
    LiveSourceMislabelled { origin: String, label: String },
    #[error("fixture source \"{0}\" labeled incorrectly")]
    FixtureMismatch(String),
    #[error("sim source \"{0}\" labeled incorrectly")]
    SimMismatch(String),
    #[error("unavailable record must name an adapter, got \"{0}\"")]
    AdapterRequired(String),
}

pub fn assert_origin(origin: Origin, source: &str) -> Result<(), OriginError> {
    let live = source.starts_with("robot:")
        || source.starts_with("isaac:")
        || source.starts_with("ros2:")
        || source.starts_with("fleetsafe-runtime:")
        || source.starts_with("sentinel-stream:")
        || source.starts_with("feed:");
    if origin == Origin::Live && !live {
        return Err(OriginError::LiveSourceRequired(source.to_string()));
    }
    if origin != Origin::Live && live {
        return Err(OriginError::LiveSourceMislabelled {
            origin: format!("{origin:?}").to_lowercase(),
            label: source.to_string(),
        });
    }
    if source.starts_with("fixture:") && origin != Origin::Fixture {
        return Err(OriginError::FixtureMismatch(source.to_string()));
    }
    if source.starts_with("sim:") && origin != Origin::Simulated {
        return Err(OriginError::SimMismatch(source.to_string()));
    }
    if origin == Origin::Unavailable && !source.starts_with("adapter:") {
        return Err(OriginError::AdapterRequired(source.to_string()));
    }
    Ok(())
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Quality {
    pub sensor: f64,
    pub temporal: f64,
    pub geometric: f64,
    pub semantic: f64,
    pub action: f64,
    pub coverage: f64,
    pub transfer: f64,
    pub safety: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdmissionInput {
    pub quality: Quality,
    pub provenance: String,
    pub consent: String,
    pub licence: String,
    pub calibration: String,
    pub clock_sync: String,
    pub observability: String,
    pub contamination: String,
    pub task_relevance: f64,
    pub embodiment_fit: f64,
    pub epistemic: f64,
    pub safety_relevance: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AdmissionState {
    Admitted,
    Quarantine,
    Rejected,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Gate {
    Allow,
    Conditional,
    Deny,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdmissionDecision {
    pub policy_version: String,
    pub admission: AdmissionState,
    pub train: Gate,
    pub validation: Gate,
    pub production: Gate,
    pub reasons: Vec<String>,
}

fn closed(admission: AdmissionState, reason: &str) -> AdmissionDecision {
    AdmissionDecision {
        policy_version: POLICY_VERSION.to_string(),
        admission,
        train: Gate::Deny,
        validation: Gate::Deny,
        production: Gate::Deny,
        reasons: vec![reason.to_string()],
    }
}

pub fn evaluate_admission(input: &AdmissionInput) -> Result<AdmissionDecision, String> {
    for value in [
        input.quality.sensor,
        input.quality.temporal,
        input.quality.geometric,
        input.quality.semantic,
        input.quality.action,
        input.quality.coverage,
        input.quality.transfer,
        input.quality.safety,
        input.task_relevance,
        input.embodiment_fit,
        input.epistemic,
    ] {
        if !(0.0..=1.0).contains(&value) {
            return Err("quality component outside 0–1".to_string());
        }
    }
    if input.provenance != "verified" {
        return Ok(closed(AdmissionState::Rejected, "provenance is not verified"));
    }
    if input.consent != "pass" || input.licence != "pass" {
        return Ok(closed(AdmissionState::Rejected, "consent or licence failed"));
    }
    if input.contamination != "none" {
        return Ok(closed(AdmissionState::Rejected, "contamination detected"));
    }
    if input.clock_sync != "pass" || input.calibration != "pass" {
        return Ok(closed(
            AdmissionState::Quarantine,
            "clock synchronisation or calibration failed",
        ));
    }
    if input.observability != "pass" || input.quality.sensor < 0.5 || input.quality.action < 0.5 {
        return Ok(closed(
            AdmissionState::Quarantine,
            "action is not observable enough to train",
        ));
    }
    let mut reasons = Vec::new();
    let train = if input.task_relevance >= 0.5 {
        Gate::Allow
    } else {
        reasons.push("task relevance below 0.50".to_string());
        Gate::Deny
    };
    let validation = if input.quality.geometric >= 0.7 && input.quality.temporal >= 0.7 {
        Gate::Allow
    } else {
        reasons.push("geometric or temporal quality below 0.70".to_string());
        Gate::Deny
    };
    let mut production = Gate::Allow;
    if input.embodiment_fit < 0.8 {
        production = Gate::Conditional;
        reasons.push("embodiment fit below 0.80".to_string());
    }
    if input.quality.safety < 0.85 && input.safety_relevance == "high" {
        production = Gate::Conditional;
        reasons.push("high safety relevance with safety quality below 0.85".to_string());
    }
    if input.epistemic > 0.3 {
        production = Gate::Conditional;
        reasons.push("epistemic uncertainty above 0.30".to_string());
    }
    if train == Gate::Deny {
        production = Gate::Deny;
    }
    Ok(AdmissionDecision {
        policy_version: POLICY_VERSION.to_string(),
        admission: AdmissionState::Admitted,
        train,
        validation,
        production,
        reasons,
    })
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct MdvInput {
    pub information_gain: f64,
    pub coverage_gain: f64,
    pub failure_gap: f64,
    pub safety_gain: f64,
    pub redundancy: f64,
}

pub fn marginal_demonstration_value(input: MdvInput) -> Result<f64, String> {
    for value in [
        input.information_gain,
        input.coverage_gain,
        input.failure_gap,
        input.safety_gain,
        input.redundancy,
    ] {
        if !(0.0..=1.0).contains(&value) {
            return Err("feature outside 0–1".to_string());
        }
    }
    Ok(0.30 * input.information_gain
        + 0.20 * input.coverage_gain
        + 0.25 * input.failure_gap
        + 0.20 * input.safety_gain
        - 0.15 * input.redundancy)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn clear() -> AdmissionInput {
        AdmissionInput {
            quality: Quality {
                sensor: 0.92,
                temporal: 0.9,
                geometric: 0.88,
                semantic: 0.86,
                action: 0.9,
                coverage: 0.7,
                transfer: 0.84,
                safety: 0.9,
            },
            provenance: "verified".into(),
            consent: "pass".into(),
            licence: "pass".into(),
            calibration: "pass".into(),
            clock_sync: "pass".into(),
            observability: "pass".into(),
            contamination: "none".into(),
            task_relevance: 0.93,
            embodiment_fit: 0.86,
            epistemic: 0.12,
            safety_relevance: "standard".into(),
        }
    }

    #[test]
    fn production_allow_when_every_gate_clears() {
        let decision = evaluate_admission(&clear()).unwrap();
        assert_eq!(decision.admission, AdmissionState::Admitted);
        assert_eq!(decision.production, Gate::Allow);
        assert!(decision.reasons.is_empty());
    }

    #[test]
    fn rejects_missing_provenance_and_contamination() {
        let mut input = clear();
        input.provenance = "missing".into();
        assert_eq!(evaluate_admission(&input).unwrap().admission, AdmissionState::Rejected);
        input = clear();
        input.contamination = "detected".into();
        assert_eq!(evaluate_admission(&input).unwrap().admission, AdmissionState::Rejected);
    }

    #[test]
    fn quarantines_clock_failure() {
        let mut input = clear();
        input.clock_sync = "fail".into();
        assert_eq!(evaluate_admission(&input).unwrap().admission, AdmissionState::Quarantine);
    }

    #[test]
    fn low_embodiment_fit_is_conditional() {
        let mut input = clear();
        input.embodiment_fit = 0.71;
        input.safety_relevance = "high".into();
        input.quality.safety = 0.8;
        let decision = evaluate_admission(&input).unwrap();
        assert_eq!(decision.production, Gate::Conditional);
        assert!(decision.reasons.iter().any(|r| r.contains("embodiment fit")));
    }

    #[test]
    fn mdv_penalises_redundancy() {
        let valuable = marginal_demonstration_value(MdvInput {
            information_gain: 0.7,
            coverage_gain: 0.6,
            failure_gap: 0.95,
            safety_gain: 0.5,
            redundancy: 0.05,
        })
        .unwrap();
        let redundant = marginal_demonstration_value(MdvInput {
            information_gain: 0.7,
            coverage_gain: 0.6,
            failure_gap: 0.1,
            safety_gain: 0.5,
            redundancy: 0.9,
        })
        .unwrap();
        assert!(valuable > redundant);
    }

    #[test]
    fn fixture_cannot_be_labelled_live() {
        assert!(assert_origin(Origin::Live, "fixture:pade-v0.1").is_err());
        assert!(assert_origin(Origin::Fixture, "fixture:pade-v0.1").is_ok());
    }

    #[test]
    fn feed_source_is_live_only_when_attached() {
        assert!(assert_origin(Origin::Live, "feed:fd-arm-1").is_ok());
        assert!(assert_origin(Origin::Fixture, "feed:fd-arm-1").is_err());
    }
}
