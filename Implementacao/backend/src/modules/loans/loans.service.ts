import crypto from "node:crypto";
import { query } from "../../database/connection.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { isValidDateInput } from "../../utils/dates.js";
import { ACTIVE_LOAN_SQL, effectiveLoanStatusSql } from "./loanStatus.js";

export class LoansService {
  static listLoans(filters: { status?: string; equipmentId?: string; from?: string; to?: string }) {
    const status = effectiveLoanStatusSql("l");
    let sql = `
      SELECT l.id, l.equipment_id, l.responsible_name, l.responsible_id, l.checkout_date, l.due_date, l.return_date, ${status} AS status, l.notes, l.created_at,
             pe.name as equipment_name, pe.code as equipment_code, pe.category as equipment_category,
             u.name as operator_name
      FROM loans l
      JOIN portable_equipment pe ON pe.id = l.equipment_id
      LEFT JOIN users u ON u.id = l.operator_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.status && filters.status !== "all") {
      sql += ` AND ${status} = ?`;
      params.push(filters.status);
    }

    if (filters.equipmentId) {
      sql += ` AND l.equipment_id = ?`;
      params.push(filters.equipmentId);
    }

    if (filters.from) {
      sql += ` AND l.checkout_date >= ?`;
      params.push(filters.from);
    }

    if (filters.to) {
      sql += ` AND l.checkout_date <= ?`;
      params.push(filters.to);
    }

    sql += ` ORDER BY l.checkout_date DESC`;

    return query.all(sql, ...params);
  }

  static getLoanById(id: string) {
    const l = query.get<any>(
      `
      SELECT l.id, l.equipment_id, l.responsible_name, l.responsible_id, l.checkout_date, l.due_date, l.return_date, ${effectiveLoanStatusSql("l")} AS status, l.notes, l.created_at,
             pe.name as equipment_name, pe.code as equipment_code, pe.category as equipment_category,
             u.name as operator_name
      FROM loans l
      JOIN portable_equipment pe ON pe.id = l.equipment_id
      LEFT JOIN users u ON u.id = l.operator_id
      WHERE l.id = ?
    `,
      id
    );

    if (!l) {
      throw new AppError("Empréstimo não encontrado.", 404, "LOAN_NOT_FOUND");
    }

    return l;
  }

  static checkoutLoan(data: {
    equipmentId: string;
    responsibleName: string;
    responsibleId?: string;
    dueDate: string;
    notes?: string;
    operatorId?: string;
  }) {
    if (!data.equipmentId || !data.responsibleName || !data.dueDate) {
      throw new AppError("Equipamento, responsável e data prevista de devolução são obrigatórios.", 400);
    }

    if (!isValidDateInput(data.dueDate)) {
      throw new AppError("Data prevista de devolução inválida. Use o formato AAAA-MM-DD ou ISO 8601.", 400, "INVALID_DUE_DATE");
    }

    return query.transaction(() => {
      // 1. Verifica se é equipamento portátil
      const equipment = query.get<any>("SELECT id, name, status FROM portable_equipment WHERE id = ?", data.equipmentId);
      if (!equipment) {
        throw new AppError("Equipamento portátil não encontrado.", 404, "EQUIPMENT_NOT_FOUND");
      }

      if (equipment.status === "manutencao" || equipment.status === "inativo") {
        throw new AppError(
          "Este equipamento está em manutenção ou inativo e não pode ser emprestado.",
          409,
          "EQUIPMENT_UNAVAILABLE"
        );
      }

      // 2. Verifica se já está emprestado
      const activeLoan = query.get<any>(
        `SELECT id FROM loans l WHERE l.equipment_id = ? AND ${ACTIVE_LOAN_SQL("l")}`,
        data.equipmentId
      );
      if (activeLoan) {
        throw new AppError(
          "Este equipamento já possui um empréstimo ativo em andamento e não pode ser retirado novamente.",
          409,
          "EQUIPMENT_ALREADY_LOANED"
        );
      }

      const id = `loan-${crypto.randomUUID()}`;

      // O status gravado indica apenas que o empréstimo está em aberto.
      // O status exibido ('atrasado', 'devolucao_hoje') é calculado na consulta.
      const status = "em_campo";

      query.run(
        `INSERT INTO loans (id, equipment_id, responsible_name, responsible_id, due_date, status, notes, operator_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        data.equipmentId,
        data.responsibleName.trim(),
        data.responsibleId || null,
        data.dueDate,
        status,
        data.notes || "",
        data.operatorId || null
      );

      // Atualiza status do equipamento portátil
      query.run(
        `UPDATE portable_equipment SET status = 'em_campo', updated_at = datetime('now') WHERE id = ?`,
        data.equipmentId
      );

      return this.getLoanById(id);
    });
  }

  static returnLoan(id: string, operatorId?: string) {
    const loan = this.getLoanById(id);

    if (loan.status === "devolvido") {
      throw new AppError("Este empréstimo já foi encerrado e devolvido anteriormente.", 400);
    }

    return query.transaction(() => {
      query.run(
        `UPDATE loans
         SET status = 'devolvido', return_date = datetime('now'), operator_id = COALESCE(?, operator_id), updated_at = datetime('now')
         WHERE id = ?`,
        operatorId || null,
        id
      );

      query.run(
        `UPDATE portable_equipment SET status = 'disponivel', updated_at = datetime('now') WHERE id = ?`,
        loan.equipment_id
      );

      return this.getLoanById(id);
    });
  }
}

