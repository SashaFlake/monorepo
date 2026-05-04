// ── Shared HTTP helper ────────────────────────────────────────────────────────
// Single fetch-wrapper for the application.
// All domain-specific API clients import from here.

export const BASE: string = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000'

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${path}`)
  return res.json() as Promise<T>
}

export const endpoint = (path: string): string => `/api/v1${path}`
