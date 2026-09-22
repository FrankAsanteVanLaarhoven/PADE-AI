package harness

import "strings"

type FrontierChoice struct {
	Requested bool
	Model     string
	Ready     bool
}

func ApplyFrontier(route Route, choice FrontierChoice) Route {
	if !choice.Requested || route.Blocked {
		return route
	}
	if !choice.Ready || strings.TrimSpace(choice.Model) == "" {
		route.ModelSource = "openrouter-unconfigured"
		route.Reason = "A frontier model was requested. OpenRouter is not configured for this specialist."
		return route
	}
	route.Model = choice.Model
	route.ModelSource = "openrouter"
	if !route.Specialist.Trained {
		route.Reason = "Frontier model selected. The specialist harness is not trained."
	}
	return route
}

func ResolveModel(specialistID, explicit string, lookup func(string) string) string {
	if strings.TrimSpace(explicit) != "" {
		return strings.TrimSpace(explicit)
	}
	if lookup == nil {
		return ""
	}
	if value := strings.TrimSpace(lookup("OPENROUTER_MODEL_" + strings.ToUpper(specialistID))); value != "" {
		return value
	}
	return strings.TrimSpace(lookup("OPENROUTER_MODEL"))
}
