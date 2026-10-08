export type LoanStatus = "em_campo" | "atrasado" | "devolucao_hoje" | "disponivel" | "devolvido";

export interface Equipment {
  id: string;
  name: string;
  code: string;
  responsible: string;
  dueDate: string;
  status: LoanStatus;
}

export const LOANS_STORAGE_KEY = "labmu:loan-equipment";

export const initialEquipment: Equipment[] = [
  { id: "1", name: "Scanner 3D EinScan 5E", code: "#3841", responsible: "Beatriz Alencar", dueDate: "Ontem, 18:00", status: "atrasado" },
  { id: "2", name: "Paquímetro Digital Mitutoyo 150mm", code: "#M4", responsible: "Prof. Carlos Mendes", dueDate: "Hoje, 17:30", status: "devolucao_hoje" },
  { id: "3", name: "Câmera Térmica Flir C5", code: "#1892", responsible: "Lucas Vasconcolos", dueDate: "28/10/2024 (12:00)", status: "em_campo" },
  { id: "4", name: "Kit Lentes Macro Canon 100mm", code: "#OPT-02", responsible: "Mariana Duarte", dueDate: "Hoje, 16:00", status: "em_campo" },
];
