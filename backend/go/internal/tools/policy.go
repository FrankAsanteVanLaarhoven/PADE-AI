package tools

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
)

type Policy struct {
	Bin string
}

func (p Policy) Evaluate(ctx context.Context, record []byte) ([]byte, error) {
	if p.Bin == "" {
		return nil, fmt.Errorf("policy kernel is not configured")
	}
	cmd := exec.CommandContext(ctx, p.Bin)
	cmd.Stdin = bytes.NewReader(record)
	out, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("policy kernel: %w", err)
	}
	if len(out) == 0 {
		return nil, fmt.Errorf("policy kernel returned no decision")
	}
	return out, nil
}
