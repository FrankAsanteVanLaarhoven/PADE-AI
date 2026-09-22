export function listenHost(): string {
  return process.env.PADE_BIND?.trim() || "127.0.0.1";
}

export function operatorToken(): string {
  return process.env.PADE_OPERATOR_TOKEN?.trim() ?? "";
}

export function operatorName(): string {
  return process.env.PADE_OPERATOR_NAME?.trim() || "operator";
}

export function isLoopback(host: string): boolean {
  const bare = host.replace(/^\[|\]$/g, "").trim();
  return bare === "127.0.0.1" || bare === "::1" || bare === "localhost";
}

export function assertListenAllowed(host: string, token: string): void {
  if (!isLoopback(host) && !token) {
    throw new Error("PADE_BIND is not loopback and PADE_OPERATOR_TOKEN is not set. Refusing to listen.");
  }
}
