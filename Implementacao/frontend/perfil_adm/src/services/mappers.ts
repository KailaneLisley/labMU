// Converte as respostas da API para os tipos usados pelas telas.
// Fica separado das páginas para que a regra de conversão exista em um lugar só.
import { Supply, SupplyEntry } from "../data/supplies";
import { Equipment } from "../data/loans";
import { api } from "./api";

export const toSupply = (s: any): Supply => ({
  id: String(s.id),
  name: s.name,
  type: s.type || "Filamento",
  color: s.color || "—",
  balance: Number(s.balance ?? 0),
  status: s.status || "regular",
});

export const toSupplyEntry = (m: any): SupplyEntry => ({
  id: String(m.id),
  date: m.created_at ? new Date(m.created_at.replace(" ", "T") + "Z").toLocaleDateString("pt-BR") : "",
  name: m.supply_name || "Insumo",
  quantity: Number(m.quantity ?? 0),
  units: m.unit || "kg",
  lot: m.lot || "",
  observations: m.observations || "",
});

const formatIsoDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR") : value;

export const toEquipment = (e: any): Equipment => ({
  id: String(e.id),
  name: e.name,
  code: e.code || "",
  responsible: e.responsible || "—",
  dueDate: e.dueDate ? formatIsoDate(e.dueDate) : e.status === "disponivel" ? "Disponível" : "—",
  status: e.status,
  currentLoanId: e.currentLoanId ?? null,
});

export async function loadEquipment(): Promise<Equipment[]> {
  const res = await api.getEquipment();
  return (res.equipment ?? []).map(toEquipment);
}

export async function loadSupplies(): Promise<Supply[]> {
  const res = await api.getSupplies();
  return (res.supplies ?? []).map(toSupply);
}

export async function loadSupplyEntries(): Promise<SupplyEntry[]> {
  const res = await api.getStockMovements();
  return (res.movements ?? []).map(toSupplyEntry);
}
