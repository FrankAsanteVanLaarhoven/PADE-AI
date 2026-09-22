.PHONY: test build test-rust test-go test-node build-rust build-go

test: test-rust test-go test-node

build: build-rust build-go

test-rust:
	cargo test --manifest-path backend/rust/pade-kernel/Cargo.toml

build-rust:
	cargo build --release --manifest-path backend/rust/pade-kernel/Cargo.toml

test-go:
	cd backend/go && go test ./...

build-go:
	cd backend/go && go build -o ../../bin/pade ./cmd/pade

test-node:
	pnpm test
