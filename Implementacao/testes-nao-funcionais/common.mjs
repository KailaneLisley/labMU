export const BASE = process.env.BASE ?? "http://localhost:3055";
export async function call(method, path, { token, body } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const t0 = performance.now();
  const r = await fetch(BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, ms: performance.now() - t0 };
}
export async function adminToken() {
  const r = await call("POST", "/api/auth/login", { body: { email: "admin@labmu.test", password: "Inicial123" } });
  return r.json.token;
}
