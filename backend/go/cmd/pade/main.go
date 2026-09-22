package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/FrankAsanteVanLaarhoven/PADE-AI/backend/internal/openrouter"
	"github.com/FrankAsanteVanLaarhoven/PADE-AI/backend/internal/route"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"service": "pade", "status": "ok"})
	})
	mux.HandleFunc("POST /v1/route", func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Task      string   `json:"task"`
			Connected []string `json:"connected"`
			Frontier  bool     `json:"frontier"`
			Model     string   `json:"model"`
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
		writeJSON(w, http.StatusOK, result)
	})
	addr := ":8788"
	if v := os.Getenv("PADE_GO_ADDR"); v != "" {
		addr = v
	}
	log.Printf("pade listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("content-type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
