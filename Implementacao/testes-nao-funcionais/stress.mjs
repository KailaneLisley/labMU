// Stress: sobe a concorrência em degraus até erro > 5% ou p95 > 3s. Depois mede recuperação.
import { execFileSync } from "node:child_process";
import { BASE } from "./common.mjs";
const steps = [10, 25, 50, 100, 200, 400, 800];
let breaking = null;
for (const vus of steps) {
  const out = execFileSync("node", ["load.mjs", String(vus), "15"], { encoding: "utf8", env: process.env, timeout: 120000 });
  const line = out.split("\n").find((l) => l.startsWith("VUs="));
  const rps = line.match(/RPS=([\d.]+)/)[1];
  const errPct = Number(line.match(/\(([\d.]+)%\)/)[1]);
  const p95 = Number(line.match(/p95=(\d+)/)[1]);
  const p99 = Number(line.match(/p99=(\d+)/)[1]);
  console.log(`VUs=${vus}\tRPS=${rps}\tp95=${p95}ms\tp99=${p99}ms\terro=${errPct}%`);
  if (errPct > 5 || p95 > 3000) { breaking = vus; break; }
}
console.log(`PONTO_DE_QUEBRA=${breaking ?? "não atingido"}`);
// Recuperação: após a carga, mede /api/health por 15 s
const samples = [];
for (let i = 0; i < 15; i++) {
  const t0 = performance.now();
  try { const r = await fetch(BASE + "/api/health"); await r.text(); samples.push(`${(performance.now() - t0).toFixed(0)}ms(${r.status})`); }
  catch { samples.push("falhou"); }
  await new Promise((r) => setTimeout(r, 1000));
}
console.log("RECUPERACAO(health a cada 1s):", samples.join(" "));
