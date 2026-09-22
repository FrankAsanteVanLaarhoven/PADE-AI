package harness

import "testing"

func TestSelectBlocksWhenToolsAreMissing(t *testing.T) {
	route := Select("admit this demonstration", nil)
	if route.Specialist.ID != "admission" {
		t.Fatalf("specialist %s", route.Specialist.ID)
	}
	if !route.Blocked {
		t.Fatal("expected the route to block")
	}
	if route.ModelSource != "untrained-harness" {
		t.Fatalf("source %s", route.ModelSource)
	}
}

func TestSelectRunsWhenToolsAreConnected(t *testing.T) {
	route := Select("rank what to collect next", []string{"atlas.read", "mdv.rank"})
	if route.Specialist.ID != "acquisition" {
		t.Fatalf("specialist %s", route.Specialist.ID)
	}
	if route.Blocked {
		t.Fatal("tools are connected")
	}
}

func TestVerdictDoesNotShareAdmissionTools(t *testing.T) {
	route := Select("deployment verdict", []string{"registry.read", "policy.evaluate"})
	if route.Specialist.ID != "verdict" {
		t.Fatalf("specialist %s", route.Specialist.ID)
	}
	if !route.Blocked {
		t.Fatal("verdict tools were not connected")
	}
}
