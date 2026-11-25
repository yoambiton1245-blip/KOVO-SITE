import { SITE } from "../config/site.config.js";

/** Small fetch wrapper: JSON in/out, timeout, and a consistent error shape. */
async function request(path, { method = "GET", body, timeout = 10000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(SITE.apiBase + path, {
      method,
      headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
      credentials: "same-origin"
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data?.error?.message || "Request failed");
      err.status = res.status;
      err.fields = data?.error?.fields || {};
      throw err;
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  /** Published gallery projects. Response is cached by the browser (Cache-Control from the server). */
  getProjects: () => request("/api/projects"),
  /** Create a lead from the contact form. */
  createLead: lead => request("/api/leads", { method: "POST", body: lead }),
  /** Save a kitchen design; returns { id } used in a shareable link. */
  saveDesign: design => request("/api/designs", { method: "POST", body: design }),
  getDesign: id => request("/api/designs/" + encodeURIComponent(id))
};
