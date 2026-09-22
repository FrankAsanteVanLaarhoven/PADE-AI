package tools

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
)

type Registry struct {
	Base  string
	Token string
	HTTP  *http.Client
}

func (r Registry) ReadAdmission(ctx context.Context, id string) ([]byte, error) {
	if r.Base == "" || id == "" {
		return nil, fmt.Errorf("registry id is required")
	}
	endpoint := strings.TrimRight(r.Base, "/") + "/api/v1/demonstrations/" + id + "/admission"
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	if r.Token != "" {
		req.Header.Set("authorization", "Bearer "+r.Token)
	}
	client := r.HTTP
	if client == nil {
		client = http.DefaultClient
	}
	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	body, err := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if err != nil {
		return nil, err
	}
	if res.StatusCode >= 300 {
		return nil, fmt.Errorf("registry status %d", res.StatusCode)
	}
	return body, nil
}
