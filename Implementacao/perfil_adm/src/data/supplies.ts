export interface Supply {
  id: string;
  name: string;
  type: string;
  color: string;
  balance: number;
  status: "regular" | "abaixo" | "critico";
}

export interface SupplyEntry {
  id: string;
  name: string;
  quantity: number;
  date: string;
  units: string;
  lot: string;
  observations: string;
}

export const SUPPLIES_STORAGE_KEY = "labmu:supplies";

export const initialSupplies: Supply[] = [
  { id: "1", name: "PLA 1.75mm", type: "Termoplástico", color: "Marfim", balance: 8.5, status: "regular" },
  { id: "2", name: "PLA 1.75mm", type: "Termoplástico", color: "Cinza Arquitetura", balance: 0.8, status: "abaixo" },
  { id: "3", name: "PETG 1.75mm", type: "Termoplástico", color: "Translúcido", balance: 5.2, status: "regular" },
  { id: "4", name: "Resina Standard 405nm", type: "Fotopolímero SLA", color: "Cinza", balance: 9.4, status: "regular" },
  { id: "5", name: "Resina Bio Clara", type: "Fotopolímero SLA", color: "Incolor", balance: 4.5, status: "regular" },
];
