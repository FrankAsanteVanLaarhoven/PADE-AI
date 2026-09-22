package main

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"log"
	"net"
	"net/http"
	"os"
	"strings"

	"github.com/FrankAsanteVanLaarhoven/PADE-AI/backend/internal/openrouter"
	"github.com/FrankAsanteVanLaarhoven/PADE-AI/backend/internal/route"
	"github.com/FrankAsanteVanLaarhoven/PADE-AI/backend/internal/tools"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"service": "pade", "status": "ok"})
	})
	mux.HandleFunc("POST /v1/route", func(w http.ResponseWriter, r *http.Request) {
		if token := os.Getenv("PADE_OPERATOR_TOKEN"); token != "" && !bearer(r.Header.Get("authorization"), token) {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Operator token is required."})
			return
		}
		var body struct {
			Task      string          `json:"task"`
			RecordID  string          `json:"recordId"`
			Record    json.RawMessage `json:"record"`
			Connected []string        `json:"connected"`
			Frontier  bool            `json:"frontier"`
			Model     string          `json:"model"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Task == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "task is required"})
			return
		}
		key := os.Getenv("OPENROUTER_API_KEY")
		result, err := route.Decide(r.Context(), body.Task, body.Connected, body.Frontier, body.Model, key, os.Getenv, func(ctx context.Context, model, system, prompt string) (string, error) {
			res, callErr := (openrouter.Client{Key: key}).Complete(ctx, openrouter.Request{
				Model:  model,
				System: system,
				Prompt: prompt,
			})
			if callErr != nil {
				return "", callErr
			}
			return res.Text, nil
		})
		if err != nil {
			log.Printf("frontier call failed: %v", err)
			writeJSON(w, http.StatusBadGateway, map[string]string{"error": "frontier model did not respond"})
			return
		}
		api := os.Getenv("PADE_API_URL")
		if api == "" {
			api = "http://127.0.0.1:8787"
		}
		if err := result.RunAdmission(r.Context(), route.Admission{
			RecordID: body.RecordID,
			Record:   body.Record,
			Read: func(ctx context.Context, id string) ([]byte, error) {
				return (tools.Registry{Base: api, Token: os.Getenv("PADE_OPERATOR_TOKEN")}).ReadAdmission(ctx, id)
			},
			Evaluate: func(ctx context.Context, record []byte) ([]byte, error) {
				return (tools.Policy{Bin: os.Getenv("PADE_KERNEL_BIN")}).Evaluate(ctx, record)
			},
		}); err != nil {
			log.Printf("admission tools failed: %v", err)
			writeJSON(w, http.StatusBadGateway, map[string]string{"error": "admission tools did not respond"})
			return
		}
		writeJSON(w, http.StatusOK, result)
	})
	addr := "127.0.0.1:8788"
	if v := os.Getenv("PADE_GO_ADDR"); v != "" {
		addr = v
	}
	if !loopback(addr) && os.Getenv("PADE_OPERATOR_TOKEN") == "" {
		log.Fatal("PADE_GO_ADDR is not loopback and PADE_OPERATOR_TOKEN is not set")
	}
	log.Printf("pade listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}

func bearer(header, token string) bool {
	presented := strings.TrimPrefix(header, "Bearer ")
	if presented == header {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(presented), []byte(token)) == 1
}

func loopback(addr string) bool {
	host, _, err := net.SplitHostPort(addr)
	if err != nil {
		host = addr
	}
	return host == "127.0.0.1" || host == "::1" || host == "localhost"
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("content-type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
