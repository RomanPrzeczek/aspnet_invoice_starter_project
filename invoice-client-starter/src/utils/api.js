// --- ENV triggers (see .env.development / .env.production) ---
const DEFAULT_BASE = import.meta.env.MODE === "development" ? "/api" : "";
const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE;
const BASE = RAW_BASE.replace(/\/$/, "");

const USE_COOKIES   = String(import.meta.env.VITE_USE_COOKIES ?? "true")  === "true";
const CSRF_REQUIRED = String(import.meta.env.VITE_CSRF_REQUIRED ?? "false") === "true";

// ---- helpers ----
function hasCookie(name) {
  return typeof document !== "undefined" && document.cookie.includes(name + "=");
}
function buildUrl(path, params = {}) {
  const qs = Object.entries(params).filter(([,v]) => v!=null && v!=="");
  const query = qs.length ? `?${new URLSearchParams(qs)}` : "";
  let p = path.startsWith("/") ? path : `/${path}`;
  if ((BASE.endsWith("/api") || BASE === "/api") && p.startsWith("/api")) p = p.replace(/^\/api/,"");
  return `${BASE}${p}${query}`;
}

// --- CSRF (request token držíme v paměti) ---
let __csrfToken = null;
let __csrfLoading = null;

// runtime detekce: pokud jedeme cookies a (flag je true NEBO už existuje csurf cookie),
// tak CSRF považuj za vyžadovaný
function needCsrf() {
  return USE_COOKIES && (CSRF_REQUIRED || hasCookie("XSRF-TOKEN"));
}

async function ensureCsrf() {
  if (!needCsrf()) return;
  if (__csrfToken) return;

  if (!__csrfLoading) {
    __csrfLoading = fetch(buildUrl("/api/csrf"), {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" }
    })
    .then(async r => {
      if (!r.ok) throw new Error(`CSRF GET failed: ${r.status}`);
      // očekáváme { csrf: "..." }, fallback z cookie
      const data = await r.json().catch(() => ({}));
      __csrfToken = data?.csrf || (document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1] ?? null);
      if (!__csrfToken) throw new Error("CSRF token missing");
    })
    .finally(() => { __csrfLoading = null; });
  }
  await __csrfLoading;
}

// --- Core fetch ---
async function fetchData(path, { params, token, ...init } = {}) {
  const url = buildUrl(path, params);
  const headers = new Headers(init.headers ?? {});

  // JSON defaults (nepřepisuj Content-Type u FormData)
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body != null && !isFormData && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  // JWT jen když nejedeme cookie flow
  if (token && !USE_COOKIES) headers.set("Authorization", `Bearer ${token}`);

  // cookies pro FE
  if (USE_COOKIES) init.credentials = "include";

  // CSRF pro mutace
  const method = (init.method ?? "GET").toUpperCase();
  const isMutating = ["POST","PUT","PATCH","DELETE"].includes(method);
  if (needCsrf() && isMutating) {
    await ensureCsrf();
    if (__csrfToken) headers.set("X-CSRF-TOKEN", __csrfToken);
  }

  let res = await fetch(url, { ...init, headers });

  // auto-retry při 400/403 (token expiroval)
  if (!res.ok && (res.status === 400 || res.status === 403) && needCsrf() && isMutating) {
    __csrfToken = null;
    await ensureCsrf();
    if (__csrfToken) {
      headers.set("X-CSRF-TOKEN", __csrfToken);
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

// --- shortcuts ---
export const apiGet    = (p, params = {}, t = null) => fetchData(p, { method: "GET", params, t });
export const apiPost   = (p, data, t = null) => fetchData(p, { method: "POST", body: data instanceof FormData ? data : JSON.stringify(data), t });
export const apiPut    = (p, data, t = null) => fetchData(p, { method: "PUT",  body: data instanceof FormData ? data : JSON.stringify(data), t });
export const apiDelete = (p, t = null) => fetchData(p, { method: "DELETE", t });