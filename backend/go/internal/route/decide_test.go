package route

import (
	"context"
	"errors"
	"testing"
)

func TestDecideDoesNotCallAFrontierModelByDefault(t *testing.T) {
	called := false
	result, err := Decide(context.Background(), "admit this demonstration", []string{"registry.read", "policy.evaluate"}, false, "", "secret", nil, func(context.Context, string, string, string) (string, error) {
		called = true
		return "should not run", nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if called || result.ModelSource != "untrained-harness" || result.Completion != "" {
		t.Fatalf("called %v source %s completion %q", called, result.ModelSource, result.Completion)
	}
}

func TestDecideBlocksBeforeAnyModelCall(t *testing.T) {
	_, err := Decide(context.Background(), "deployment verdict", nil, true, "selected", "secret", nil, func(context.Context, string, string, string) (string, error) {
		t.Fatal("model was called without tools")
		return "", nil
	})
	if err != nil {
		t.Fatal(err)
	}
}

func TestDecideSelectsTheConfiguredFrontierModel(t *testing.T) {
	var gotModel string
	result, err := Decide(context.Background(), "rank what to collect next", []string{"atlas.read", "mdv.rank"}, true, "", "secret", func(key string) string {
		if key == "OPENROUTER_MODEL_ACQUISITION" {
			return "specialist/acquisition"
		}
		return ""
	}, func(_ context.Context, model, system, prompt string) (string, error) {
		gotModel = model
		if system == "" || prompt == "" {
			return "", errors.New("empty prompt")
		}
		return "ranked", nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if gotModel != "specialist/acquisition" || result.Completion != "ranked" || result.ModelSource != "openrouter" {
		t.Fatalf("model %s source %s completion %s", gotModel, result.ModelSource, result.Completion)
	}
}

func TestDecideRefusesAnUnconfiguredFrontierCall(t *testing.T) {
	result, err := Decide(context.Background(), "admit this demonstration", []string{"registry.read", "policy.evaluate"}, true, "", "", nil, func(context.Context, string, string, string) (string, error) {
		t.Fatal("model was called without a key")
		return "", nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.ModelSource != "openrouter-unconfigured" || result.Completion != "" {
		t.Fatalf("source %s", result.ModelSource)
	}
}
