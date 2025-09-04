// --- ENV
const DEFAULT_BASE = import.meta.env.MODE === "development" ? "/api" : "";
const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE;
const BASE = RAW_BASE.replace(/\/$/, "");

const USE_COOKIES   = String(import.meta.env.VITE_USE_COOKIES ?? "true")   === "true";
const CSRF_REQUIRED = String(import.meta.env.VITE_CSRF_REQUIRED ?? "false") === "true";
const CSRF_ENDPOINT = import.meta.env.VITE_CSRF_ENDPOINT ?? "/api/csrf";

const XSRF_COOKIE = import.meta.env.VITE_XSRF_COOKIE_NAME  ?? "XSRF-TOKEN-v2";
const XSRF_HEADER = import.meta.env.VITE_XSRF_HEADER_NAME  ?? "X-CSRF-TOKEN";

// helpers
function readCookie(name) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}
function buildUrl(path, params = {}) {
  const qs = Object.entries(params).filter(([,v]) => v!=null && v!=="");
  const query = qs.length ? `?${new URLSearchParams(qs)}` : "";
  let p = path.startsWith("/") ? path : `/${path}`;
  if ((BASE.endsWith("/api") || BASE === "/api") && p.startsWith("/api")) p = p.replace(/^\/api/,"");
  return `${BASE}${p}${query}`;
}

// --- CSRF
let __csrfToken = null;
let __csrfLoading = null;

function needCsrf() {
  return USE_COOKIES && (CSRF_REQUIRED || !!readCookie(XSRF_COOKIE));
}

async function ensureCsrf() {
  if (!needCsrf() || __csrfToken) return;
  if (!__csrfLoading) {
    // na produkci existuje /api/csrf
    __csrfLoading = fetch(buildUrl(CSRF_ENDPOINT), {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" }
    })
    .then(async r => {
      if (!r.ok) throw new Error(`CSRF GET failed: ${r.status}`);
      const data = await r.json().catch(() => ({}));
      __csrfToken = data?.csrf || readCookie(XSRF_COOKIE);
      if (!__csrfToken) throw new Error("CSRF token missing");
    })
    .finally(() => { __csrfLoading = null; });
  }
  await __csrfLoading;
}

// core fetch
async function fetchData(path, { params, token, ...init } = {}) {
  const url = buildUrl(path, params);
  const headers = new Headers(init.headers ?? {});
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;

  if (init.body != null && !isFormData && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  if (token && !USE_COOKIES) headers.set("Authorization", `Bearer ${token}`);
  if (USE_COOKIES) init.credentials = "include";

  const method = (init.method ?? "GET").toUpperCase();
  const isMutating = ["POST","PUT","PATCH","DELETE"].includes(method);

  if (USE_COOKIES && isMutating) {
    if (CSRF_REQUIRED && !__csrfToken) await ensureCsrf();
    const headerToken = __csrfToken || readCookie(XSRF_COOKIE);
    if (headerToken) headers.set(XSRF_HEADER, headerToken);
  }

  let res = await fetch(url, { ...init, headers });

  // auto-retry na 400/403 (obnov CSRF)
  if (!res.ok && (res.status === 400 || res.status === 403) && USE_COOKIES && isMutating) {
    __csrfToken = null;
    try { await ensureCsrf(); } catch {}
    const headerToken = __csrfToken || readCookie(XSRF_COOKIE);
    if (headerToken) {
      headers.set(XSRF_HEADER, headerToken);
      res = await fetch(url, { ...init, headers });
    }
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${body ? ` – ${body}` : ""}`);
  }

  if (res.status === 204 || method === "DELETE") return;
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

export const apiGet    = (p, params = {}, t = null) => fetchData(p, { method: "GET", params, t });
export const apiPost   = (p, data, t = null) => fetchData(p, { method: "POST", body: data instanceof FormData ? data : JSON.stringify(data), t });
export const apiPut    = (p, data, t = null) => fetchData(p, { method: "PUT",  body: data instanceof FormData ? data : JSON.stringify(data), t });
export const apiDelete = (p, t = null) => fetchData(p, { method: "DELETE", t });