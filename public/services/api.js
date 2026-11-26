/** Small fetch wrapper: JSON in/out, timeout, and a consistent error shape. */
async function request(path, { method = "GET", body, timeout = 10000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(path, {
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
  /** Create a lead from the contact form. */
  createLead: lead => request("/api/leads", { method: "POST", body: lead }),
};
