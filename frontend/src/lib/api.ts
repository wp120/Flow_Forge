const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"
).replace(/\/+$/, "");

function apiUrl(input: string) {
  return `${API_BASE_URL}${input.startsWith("/") ? input : `/${input}`}`;
}

export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(input), {
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

export async function apiUpload<T>(input: string, body: FormData): Promise<T> {
  const response = await fetch(apiUrl(input), {
    method: "POST",
    credentials: "include",
    body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message ?? "Upload request failed.");
  return data as T;
}
