package route

import (
	"context"
	"errors"
	"strings"

	"github.com/FrankAsanteVanLaarhoven/PADE-AI/backend/internal/harness"
)

var errNoCompleter = errors.New("openrouter completer is missing")

type Result struct {
	harness.Route
	Completion string `json:"completion,omitempty"`
}

type Completer func(ctx context.Context, model, system, prompt string) (string, error)

func Decide(ctx context.Context, task string, connected []string, frontier bool, explicitModel, key string, lookup func(string) string, complete Completer) (Result, error) {
	selected := harness.Select(task, connected)
	model := harness.ResolveModel(selected.Specialist.ID, explicitModel, lookup)
	selected = harness.ApplyFrontier(selected, harness.FrontierChoice{
		Requested: frontier,
		Model:     model,
		Ready:     strings.TrimSpace(key) != "",
	})
	result := Result{Route: selected}
	if selected.ModelSource != "openrouter" {
		return result, nil
	}
	if complete == nil {
		return result, errNoCompleter
	}
	text, err := complete(ctx, selected.Model, systemFor(selected.Specialist.ID), task)
	if err != nil {
		return result, err
	}
	result.Completion = text
	return result, nil
}

func systemFor(specialistID string) string {
	return "You are the PADE " + specialistID + " specialist. Use only the record and the tools declared for this task. Do not invent a measurement. Do not start a robot."
}
