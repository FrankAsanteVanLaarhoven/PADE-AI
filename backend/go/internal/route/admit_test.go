package route

import (
	"context"
	"testing"

	"github.com/FrankAsanteVanLaarhoven/PADE-AI/backend/internal/harness"
)

func TestAdmissionDoesNotRunWhenTheRouteIsBlocked(t *testing.T) {
	result := Result{Route: harness.Select("admit this demonstration", nil)}
	err := result.RunAdmission(context.Background(), Admission{
		Record: []byte(`{"quality":{}}`),
		Evaluate: func(context.Context, []byte) ([]byte, error) {
			t.Fatal("policy ran without tools")
			return nil, nil
		},
	})
	if err != nil || result.ToolResult != nil {
		t.Fatal(err)
	}
}

func TestAdmissionReadsThenEvaluates(t *testing.T) {
	result := Result{Route: harness.Select("admit this demonstration", []string{"registry.read", "policy.evaluate"})}
	err := result.RunAdmission(context.Background(), Admission{
		RecordID: "DAR-smp-1",
		Read: func(context.Context, string) ([]byte, error) {
			return []byte(`{"taskRelevance":0.9}`), nil
		},
		Evaluate: func(_ context.Context, record []byte) ([]byte, error) {
			if string(record) != `{"taskRelevance":0.9}` {
				t.Fatalf("record %s", record)
			}
			return []byte(`{"admission":"admitted"}`), nil
		},
	})
	if err != nil || string(result.ToolResult) != `{"admission":"admitted"}` {
		t.Fatalf("%v %s", err, result.ToolResult)
	}
}

func TestAdmissionRefusesToInventARecord(t *testing.T) {
	result := Result{Route: harness.Select("admit this demonstration", []string{"registry.read", "policy.evaluate"})}
	if err := result.RunAdmission(context.Background(), Admission{}); err != nil {
		t.Fatal(err)
	}
	if !result.Blocked || result.ToolResult != nil {
		t.Fatalf("blocked %v", result.Blocked)
	}
}
