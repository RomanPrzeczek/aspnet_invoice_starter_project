// --- ENV triggers (see .env.development / .env.production) ---
const DEFAULT_BASE = import.meta.env.MODE === 'development' ? '/api' : '';
const BASE = (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE).replace(/\/$/, '');
const USE_COOKIES = String(import.meta.env.VITE_USE_COOKIES ?? "true") === "true";
const CSRF_REQUIRED = String(import.meta.env.VITE_CSRF_REQUIRED ?? "false") === "true";

// 🔎 jednorázový debug výpis (jen v dev/preview-local)
if (typeof window !== 'undefined'
  && !window.__API_ENV_LOGGED
  && ['development','preview-local'].includes(import.meta.env.MODE)) {
  console.log('[api.js] MODE:', import.meta.env.MODE, 'BASE:', BASE, {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    USE_COOKIES, CSRF_REQUIRED
  });
  window.__API_ENV_LOGGED = true;
}

// --- Helpers ---
function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((r) => r.startsWith(name + "="))
    ?.split("=")[1];
}

function buildUrl(path, params = {}) {
  const qs = Object.entries(params).filter(([,v]) => v!=null && v!=='');
  const query = qs.length ? `?${new URLSearchParams(qs)}` : '';
  let p = path.startsWith('/') ? path : `/${path}`;
  // když BASE končí /api a path začíná /api, druhé /api odřízni
  if ((BASE.endsWith('/api') || BASE === '/api') && p.startsWith('/api')) {
    p = p.replace(/^\/api/, '');
  }
  return `${BASE}${p}${query}`;
}

async function fetchData(path, { params, token, ...init } = {}) {
  const url = buildUrl(path, params);
  const headers = new Headers(init.headers ?? {});

  // JWT header sent only if cookie OFF
  if (token && !USE_COOKIES) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // JSON defaults
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  // Cookies (for FE) only if ON, otherwise JWT token
  if (USE_COOKIES) {
    init.credentials = "include";
  }

  const res = await fetch(url, { ...init, headers });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${body ? ` – ${body}` : ""}`);
  }

  // 204 / DELETE no body
  if (res.status === 204 || (init.method ?? "").toUpperCase() === "DELETE") return;

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

// --- public shortcuts ---
export const apiGet = (path, params = {}, token = null) =>
  fetchData(path, { method: "GET", params, token });

export const apiPost = (path, data, token = null) =>
  fetchData(path, { method: "POST", body: JSON.stringify(data), token });

export const apiPut = (path, data, token = null) =>
  fetchData(path, { method: "PUT", body: JSON.stringify(data), token });

export const apiDelete = (path, token = null) =>
  fetchData(path, { method: "DELETE", token });