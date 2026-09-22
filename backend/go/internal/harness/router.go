package harness

import "strings"

type Modality string

const (
	ModalityText   Modality = "text"
	ModalityVideo  Modality = "video"
	ModalitySensor Modality = "sensor"
	ModalityState  Modality = "state"
	ModalityScene  Modality = "scene"
)

type Specialist struct {
	ID         string
	Task       string
	Modalities []Modality
	Tools      []string
	Harness    string
	Trained    bool
}

type Route struct {
	Specialist   Specialist
	MissingTools []string
	Model        string
	ModelSource  string
	Blocked      bool
	Reason       string
}

var Specialists = []Specialist{
	{ID: "admission", Task: "demonstration admissibility", Modalities: []Modality{ModalityText, ModalityVideo, ModalitySensor}, Tools: []string{"registry.read", "policy.evaluate"}, Harness: "pade-admission", Trained: false},
	{ID: "embodiment", Task: "canonical embodied action", Modalities: []Modality{ModalityVideo, ModalityState, ModalityText}, Tools: []string{"cear.read", "embodiment.qualify"}, Harness: "pade-embodiment", Trained: false},
	{ID: "acquisition", Task: "what to collect next", Modalities: []Modality{ModalityText, ModalityState}, Tools: []string{"atlas.read", "mdv.rank"}, Harness: "pade-acquisition", Trained: false},
	{ID: "safety", Task: "intervention review", Modalities: []Modality{ModalityState, ModalitySensor}, Tools: []string{"safety.read"}, Harness: "pade-safety", Trained: false},
	{ID: "verdict", Task: "deployment authorization", Modalities: []Modality{ModalityText}, Tools: []string{"verdict.propose"}, Harness: "pade-verdict", Trained: false},
	{ID: "simulation", Task: "counterfactual plan", Modalities: []Modality{ModalityScene, ModalityText}, Tools: []string{"isaac.submit"}, Harness: "pade-simulation", Trained: false},
}

func Select(task string, connected []string) Route {
	spec := match(task)
	missing := missingTools(spec.Tools, connected)
	route := Route{Specialist: spec, MissingTools: missing, Model: "harness:" + spec.Harness, ModelSource: "harness"}
	if !spec.Trained {
		route.ModelSource = "untrained-harness"
		route.Reason = "The specialist harness is specified and is not trained. No frontier model is called unless OpenRouter is configured and the caller asks for it."
	}
	if len(missing) > 0 {
		route.Blocked = true
		route.Reason = "Required tools are not connected: " + strings.Join(missing, ", ")
	}
	return route
}

func match(task string) Specialist {
	q := strings.ToLower(task)
	switch {
	case strings.Contains(q, "embody") || strings.Contains(q, "cear"):
		return Specialists[1]
	case strings.Contains(q, "collect") || strings.Contains(q, "mdv") || strings.Contains(q, "acquir"):
		return Specialists[2]
	case strings.Contains(q, "safe") || strings.Contains(q, "interven"):
		return Specialists[3]
	case strings.Contains(q, "verdict") || strings.Contains(q, "deploy"):
		return Specialists[4]
	case strings.Contains(q, "sim") || strings.Contains(q, "counter"):
		return Specialists[5]
	default:
		return Specialists[0]
	}
}

func missingTools(required, connected []string) []string {
	have := map[string]bool{}
	for _, tool := range connected {
		have[tool] = true
	}
	var missing []string
	for _, tool := range required {
		if !have[tool] {
			missing = append(missing, tool)
		}
	}
	return missing
}
