package openrouter

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const Endpoint = "https://openrouter.ai/api/v1/chat/completions"

type Client struct {
	Key  string
	HTTP *http.Client
	URL  string
}

type Request struct {
	Model    string
	System   string
	Prompt   string
	Images   []string
}

type Response struct {
	Text  string
	Model string
}

func (c Client) Complete(ctx context.Context, req Request) (Response, error) {
	if strings.TrimSpace(c.Key) == "" {
		return Response{}, errors.New("openrouter is not configured")
	}
	if req.Model == "" {
		return Response{}, errors.New("model is required")
	}
	url := c.URL
	if url == "" {
		url = Endpoint
	}
	user := map[string]any{"role": "user", "content": req.Prompt}
	if len(req.Images) > 0 {
		parts := []map[string]any{{"type": "text", "text": req.Prompt}}
		for _, image := range req.Images {
			parts = append(parts, map[string]any{"type": "image_url", "image_url": map[string]string{"url": image}})
		}
		user["content"] = parts
	}
	body := map[string]any{
		"model": req.Model,
		"messages": []map[string]any{
			{"role": "system", "content": req.System},
			user,
		},
	}
	raw, err := json.Marshal(body)
	if err != nil {
		return Response{}, err
	}
	httpClient := c.HTTP
	if httpClient == nil {
		httpClient = &http.Client{Timeout: 30 * time.Second}
	}
	call, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(raw))
	if err != nil {
		return Response{}, err
	}
	call.Header.Set("authorization", "Bearer "+c.Key)
	call.Header.Set("content-type", "application/json")
	res, err := httpClient.Do(call)
	if err != nil {
		return Response{}, err
	}
	defer res.Body.Close()
	payload, err := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if err != nil {
		return Response{}, err
	}
	if res.StatusCode >= 300 {
		return Response{}, fmt.Errorf("openrouter status %d", res.StatusCode)
	}
	var parsed struct {
		Model   string `json:"model"`
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(payload, &parsed); err != nil {
		return Response{}, err
	}
	if len(parsed.Choices) == 0 {
		return Response{}, errors.New("openrouter returned no choice")
	}
	return Response{Text: parsed.Choices[0].Message.Content, Model: parsed.Model}, nil
}
