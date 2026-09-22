package tools

import (
	"context"
	"os"
	"strings"
	"testing"
)

func TestPolicyBinaryDecidesAContract(t *testing.T) {
	bin := os.Getenv("PADE_KERNEL_BIN")
	if bin == "" {
		t.Skip("PADE_KERNEL_BIN is not set")
	}
	out, err := (Policy{Bin: bin}).Evaluate(context.Background(), []byte(`{
		"quality": {"sensor": 0.92, "temporal": 0.9, "geometric": 0.88, "semantic": 0.86, "action": 0.9, "coverage": 0.7, "transfer": 0.84, "safety": 0.9},
		"provenance": "verified",
		"consent": "pass",
		"licence": "pass",
		"calibration": "pass",
		"clockSync": "pass",
		"observability": "pass",
		"contamination": "none",
		"taskRelevance": 0.93,
		"embodimentFit": 0.86,
		"epistemic": 0.12,
		"safetyRelevance": "standard"
	}`))
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(out), `"admission":"admitted"`) || !strings.Contains(string(out), `"policyVersion":"admission-0.1.0"`) {
		t.Fatalf("%s", out)
	}
}
