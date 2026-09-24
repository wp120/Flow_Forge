export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`http://localhost:3001${input}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message ?? "Request failed.");
  }

  return data as T;
}
