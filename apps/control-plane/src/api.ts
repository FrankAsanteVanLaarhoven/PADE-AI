export class ApiError extends Error {}

export async function api<T>(path: string, env: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-pade-env": env,
      ...operatorHeader(),
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

function operatorHeader(): Record<string, string> {
  try {
    const token = sessionStorage.getItem("pade-operator");
    return token ? { authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export function post<T>(path: string, env: string, body: unknown): Promise<T> {
  return api<T>(path, env, { method: "POST", body: JSON.stringify(body) });
}
