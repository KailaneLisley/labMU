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

