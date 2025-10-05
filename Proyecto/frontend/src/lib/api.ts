export const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

export async function apiGet(path: string) {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export async function apiPost<TBody extends Record<string, any>>(path: string, body: TBody, opts?: { auth?: boolean }) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts?.auth) {
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Request failed: ${res.status} ${txt}`);
  }
  return res.json();
}

export function saveTokens(tokens: { access: string; refresh: string }) {
  localStorage.setItem('auth_access', tokens.access);
  localStorage.setItem('auth_refresh', tokens.refresh);
}

export function getAccessToken() {
  return localStorage.getItem('auth_access') || '';
}

export function clearTokens() {
  localStorage.removeItem('auth_access');
  localStorage.removeItem('auth_refresh');
}

export async function apiGetAuth(path: string) {
  const headers: Record<string, string> = {}
  const token = getAccessToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_URL}${path}`, { headers })
  if (res.status === 401) {
    clearTokens()
  }
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}
