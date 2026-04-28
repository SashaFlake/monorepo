// ── Shared HTTP helper ────────────────────────────────────────────────────────
// Единственный fetch-wrapper в приложении.
// Все domain-specific API-клиенты импортируют его отсюда.

export const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${path}`)
  return res.json() as Promise<T>
}

export const endpoint = (path: string) => `/api/v1${path}`
