export type LoanStatus = "em_campo" | "atrasado" | "devolucao_hoje" | "disponivel" | "devolvido";

export interface Equipment {
  id: string;
  name: string;
  code: string;
  responsible: string;
  dueDate: string;
  status: LoanStatus;
  currentLoanId?: string | null;
}

export const LOANS_STORAGE_KEY = "labmu:loan-equipment";

