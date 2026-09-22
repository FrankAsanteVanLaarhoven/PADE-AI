export class ApiError extends Error {}

export async function api<T>(path: string, env: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-pade-env": env,
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    let message = `${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      message = response.statusText || message;
    }
    throw new ApiError(message);
  }
  return (await response.json()) as T;
}

export function post<T>(path: string, env: string, body: unknown): Promise<T> {
  return api<T>(path, env, { method: "POST", body: JSON.stringify(body) });
}
