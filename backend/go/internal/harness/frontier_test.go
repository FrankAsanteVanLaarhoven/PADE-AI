package harness

import "testing"

func TestFrontierStaysOffUnlessRequested(t *testing.T) {
	route := Select("admit this demonstration", []string{"registry.read", "policy.evaluate"})
	got := ApplyFrontier(route, FrontierChoice{Requested: false, Model: "selected", Ready: true})
	if got.ModelSource != "untrained-harness" {
		t.Fatalf("source %s", got.ModelSource)
	}
}

func TestFrontierDoesNotRunWithoutTools(t *testing.T) {
	route := Select("admit this demonstration", nil)
	got := ApplyFrontier(route, FrontierChoice{Requested: true, Model: "selected", Ready: true})
	if !got.Blocked || got.ModelSource == "openrouter" {
		t.Fatalf("blocked %v source %s", got.Blocked, got.ModelSource)
	}
}

func TestFrontierReportsWhenUnconfigured(t *testing.T) {
	route := Select("admit this demonstration", []string{"registry.read", "policy.evaluate"})
	got := ApplyFrontier(route, FrontierChoice{Requested: true, Ready: false})
	if got.ModelSource != "openrouter-unconfigured" {
		t.Fatalf("source %s", got.ModelSource)
	}
}

func TestResolveModelPrefersTheSpecialistSetting(t *testing.T) {
	lookup := func(key string) string {
		switch key {
		case "OPENROUTER_MODEL_ADMISSION":
			return "specialist/admission"
		case "OPENROUTER_MODEL":
			return "fallback"
		default:
			return ""
		}
	}
	if got := ResolveModel("admission", "", lookup); got != "specialist/admission" {
		t.Fatal(got)
	}
	if got := ResolveModel("admission", "caller", lookup); got != "caller" {
		t.Fatal(got)
	}
	if got := ResolveModel("safety", "", lookup); got != "fallback" {
		t.Fatal(got)
	}
}
