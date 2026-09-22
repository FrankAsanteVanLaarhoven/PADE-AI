package openrouter

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCompleteRefusesWithoutAKey(t *testing.T) {
	_, err := Client{}.Complete(context.Background(), Request{Model: "test", Prompt: "admit"})
	if err == nil || !strings.Contains(err.Error(), "not configured") {
		t.Fatal(err)
	}
}

func TestCompletePostsTheSelectedModel(t *testing.T) {
	var gotModel string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("authorization") != "Bearer test-key" {
			t.Fatal(r.Header.Get("authorization"))
		}
		var body struct {
			Model string `json:"model"`
		}
		if err := jsonNew(r, &body); err != nil {
			t.Fatal(err)
		}
		gotModel = body.Model
		w.Header().Set("content-type", "application/json")
		_, _ = w.Write([]byte(`{"model":"echo","choices":[{"message":{"content":"blocked"}}]}`))
	}))
	defer server.Close()
	res, err := (Client{Key: "test-key", URL: server.URL, HTTP: server.Client()}).Complete(context.Background(), Request{
		Model:  "specialist/admission",
		System: "Use only the supplied record.",
		Prompt: "Is this demonstration admissible?",
	})
	if err != nil {
		t.Fatal(err)
	}
	if gotModel != "specialist/admission" || res.Text != "blocked" {
		t.Fatalf("%s %s", gotModel, res.Text)
	}
}

func jsonNew(r *http.Request, dest any) error {
	defer r.Body.Close()
	return newDecoder(r.Body).Decode(dest)
}
