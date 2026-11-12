// Gerador de carga: VUs em loop fechado com mix de endpoints. Uso: node load.mjs <vus> <segundos>
import { call, adminToken, BASE, requireWrite } from "./common.mjs";

// A carga cria produções de teste: exige WRITE=1
requireWrite("load.mjs");
import fs from "node:fs";
const [vus, seconds] = [Number(process.argv[2] ?? 10), Number(process.argv[3] ?? 20)];
const setup = JSON.parse(fs.readFileSync(new URL("./setup.json", import.meta.url)));
const tok = await adminToken();
const today = new Date().toISOString().slice(0, 10);

const scenarios = [
  { name: "GET /machines", w: 25, run: () => call("GET", "/api/machines", { token: tok }) },
  { name: "GET /supplies", w: 20, run: () => call("GET", "/api/supplies", { token: tok }) },
  { name: "GET /equipment", w: 15, run: () => call("GET", "/api/equipment", { token: tok }) },
  { name: "GET /dashboard/summary", w: 10, run: () => call("GET", "/api/dashboard/summary", { token: tok }) },
  { name: "GET /reports/production", w: 5, run: () => call("GET", `/api/reports/production?from=${today}`, { token: tok }) },
  { name: "GET /users (paginado)", w: 5, run: () => call("GET", "/api/users?limit=20", { token: tok }) },
  { name: "POST /productions", w: 10, run: () => call("POST", "/api/productions", { token: tok, body: { type: "impressao_3d", description: "carga", machineId: setup.machines[0], supplyId: setup.supplies[0], supplyConsumed: 0.01, durationMinutes: 5 } }) },
  { name: "POST /auth/login", w: Number(process.env.LOGIN_W ?? 5), run: () => call("POST", "/api/auth/login", { body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } }) },
];
const total = scenarios.reduce((a, s) => a + s.w, 0);
const pick = () => { let r = Math.random() * total; for (const s of scenarios) { if ((r -= s.w) < 0) return s; } return scenarios[0]; };

const stats = new Map();
const record = (name, status, ms, netErr) => {
  if (!stats.has(name)) stats.set(name, { lat: [], ok: 0, c4xx: 0, c5xx: 0, net: 0 });
  const s = stats.get(name);
  if (netErr) s.net++;
  else { s.lat.push(ms); if (status >= 500) s.c5xx++; else if (status >= 400) s.c4xx++; else s.ok++; }
};
const end = Date.now() + seconds * 1000;
const t0 = Date.now();
async function vu() {
  while (Date.now() < end) {
    const s = pick();
    try { const r = await s.run(); record(s.name, r.status, r.ms, false); }
    catch { record(s.name, 0, 0, true); }
  }
}
await Promise.all(Array.from({ length: vus }, vu));
const elapsed = (Date.now() - t0) / 1000;
const pct = (arr, p) => { if (!arr.length) return NaN; const a = [...arr].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * a.length))]; };
let all = [], total_n = 0, err = 0;
const rows = [];
for (const [name, s] of stats) {
  const n = s.ok + s.c4xx + s.c5xx + s.net; total_n += n; err += s.c5xx + s.net; all = all.concat(s.lat);
  rows.push({ endpoint: name, n, p50: pct(s.lat, 0.5)?.toFixed(0), p95: pct(s.lat, 0.95)?.toFixed(0), p99: pct(s.lat, 0.99)?.toFixed(0), "4xx": s.c4xx, "5xx": s.c5xx, rede: s.net });
}
console.log(`\nVUs=${vus} dur=${elapsed.toFixed(1)}s  req=${total_n}  RPS=${(total_n / elapsed).toFixed(1)}  erros(5xx+rede)=${err} (${((100 * err) / Math.max(total_n, 1)).toFixed(2)}%)  p50=${pct(all, .5)?.toFixed(0)}ms p95=${pct(all, .95)?.toFixed(0)}ms p99=${pct(all, .99)?.toFixed(0)}ms`);
console.table(rows);
