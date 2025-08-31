// --- ENV triggers (see .env.development / .env.production) ---
const DEFAULT_BASE = import.meta.env.MODE === "development" ? "/api" : "";
const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE;
const BASE = RAW_BASE.replace(/\/$/, "");

const USE_COOKIES = String(import.meta.env.VITE_USE_COOKIES ?? "true") === "true";
const CSRF_REQUIRED = String(import.meta.env.VITE_CSRF_REQUIRED ?? "false") === "true";

// 🔎 jednorázový debug výpis (jen v dev/preview-local)
if (
  typeof window !== "undefined" &&
  !window.__API_ENV_LOGGED &&
  ["development", "preview-local"].includes(import.meta.env.MODE)
) {
  console.log("[api.js] MODE:", import.meta.env.MODE, "BASE:", BASE, {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    USE_COOKIES,
    CSRF_REQUIRED,
  });
  window.__API_ENV_LOGGED = true;
}

// --- Helpers ---
function buildUrl(path, params = {}) {
  const qs = Object.entries(params).filter(([, v]) => v != null && v !== "");
  const query = qs.length ? `?${new URLSearchParams(qs)}` : "";
  let p = path.startsWith("/") ? path : `/${path}`;
  // když BASE končí /api a path začíná /api, druhé /api odřízni
  if ((BASE.endsWith("/api") || BASE === "/api") && p.startsWith("/api")) {
    p = p.replace(/^\/api/, "");
  }
  return `${BASE}${p}${query}`;
}

// --- CSRF (request token v paměti, ne z cookie) ---
let __csrfToken = null;
let __csrfLoading = null;

async function ensureCsrf() {
  if (!USE_COOKIES || !CSRF_REQUIRED) return;
  if (__csrfToken) return;

  if (!__csrfLoading) {
    __csrfLoading = fetch(buildUrl("/api/csrf"), {
      method: "GET",
      credentials: "include", // aby server mohl založit/opravit CSRF cookie, pokud ji používá
      headers: { Accept: "application/json" },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`CSRF GET failed: ${r.status}`);
        // očekáváme { csrf: "..." }
        const data = await r.json().catch(() => ({}));
        if (!data?.csrf) throw new Error("CSRF token missing in response");
        __csrfToken = data.csrf;
      })
      .finally(() => {
        __csrfLoading = null;
      });
  }
  await __csrfLoading;
}

// --- Core fetch ---
async function fetchData(path, { params, token, ...init } = {}) {
  const url = buildUrl(path, params);
  const headers = new Headers(init.headers ?? {});

  // JSON defaults (nepřepisuj Content-Type u FormData)
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body != null && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  // JWT header (používej jen pokud nejedeme cookie-flow)
  if (token && !USE_COOKIES) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Cookies (FE flow)
  if (USE_COOKIES) {
    init.credentials = "include";
  }

  // CSRF pro mutační metody
  const method = (init.method ?? "GET").toUpperCase();
  const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  if (USE_COOKIES && CSRF_REQUIRED && isMutating) {
    await ensureCsrf();
    if (__csrfToken) {
      headers.set("X-CSRF-TOKEN", __csrfToken);
    }
  }

  const res = await fetch(url, { ...init, headers });

  // Volitelný auto-retry při CSRF chybě (když token expiroval)
  if (!res.ok && (res.status === 400 || res.status === 403) && USE_COOKIES && CSRF_REQUIRED && isMutating) {
    // zkus jednou obnovit token a zopakovat
    __csrfToken = null;
    await ensureCsrf();
    if (__csrfToken) {
      headers.set("X-CSRF-TOKEN", __csrfToken);
      const retry = await fetch(url, { ...init, headers });
      if (!retry.ok) {
        const body = await retry.text().catch(() => "");
        throw new Error(`HTTP ${retry.status} ${retry.statusText}${body ? ` – ${body}` : ""}`);
      }
      if (retry.status === 204 || method === "DELETE") return;
      const ct2 = retry.headers.get("content-type") || "";
      return ct2.includes("application/json") ? retry.json() : retry.text();
    }
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${body ? ` – ${body}` : ""}`);
  }

  // 204 / DELETE no body
  if (res.status === 204 || method === "DELETE") return;

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

// --- public shortcuts ---
export const apiGet = (path, params = {}, token = null) =>
  fetchData(path, { method: "GET", params, token });

export const apiPost = (path, data, token = null) =>
  fetchData(path, {
    method: "POST",
    body: data instanceof FormData ? data : JSON.stringify(data),
    token,
  });

export const apiPut = (path, data, token = null) =>
  fetchData(path, {
    method: "PUT",
    body: data instanceof FormData ? data : JSON.stringify(data),
    token,
  });

export const apiDelete = (path, token = null) =>
  fetchData(path, { method: "DELETE", token });
