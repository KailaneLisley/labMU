import { call, adminToken } from "./common.mjs";
const tok = await adminToken();
const machines = [];
for (let i = 0; i < 6; i++) {
  const r = await call("POST", "/api/machines", { token: tok, body: { name: `Impressora ${i}`, tag: `LT-${i}`, type: i === 5 ? "scanner" : "printer_3d_fdm" } });
  machines.push(r.json.machine.id);
}
const supplies = [];
for (let i = 0; i < 4; i++) {
  const r = await call("POST", "/api/supplies", { token: tok, body: { name: `PLA ${i}`, type: "PLA", color: `Cor ${i}`, balance: 100000 } });
  supplies.push(r.json.supply.id);
}
for (let i = 0; i < 20; i++) await call("POST", "/api/equipment", { token: tok, body: { name: `Equip ${i}`, code: `EQ-${i}` } });
console.log(JSON.stringify({ machines, supplies }));
