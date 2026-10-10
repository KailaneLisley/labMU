import crypto from "node:crypto";
import { query } from "../../database/connection.js";
import { AppError } from "../../middlewares/errorHandler.js";

export class ProductionService {
  static listProductions(filters: {
    machineId?: string;
    technicianId?: string;
    type?: string;
    from?: string;
    to?: string;
  }) {
    let sql = `
      SELECT p.id, p.type, p.description, p.machine_id, p.technician_id, p.client_id, p.client_name,
             p.supply_id, p.supply_consumed, p.duration_minutes, p.status, p.observations, p.created_at,
             m.name as machine_name, m.tag as machine_tag, m.type as machine_type,
             u.name as technician_name,
             s.name as supply_name, s.color as supply_color
      FROM productions p
      JOIN machines m ON m.id = p.machine_id
      JOIN users u ON u.id = p.technician_id
      LEFT JOIN supplies s ON s.id = p.supply_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.machineId) {
      sql += ` AND p.machine_id = ?`;
      params.push(filters.machineId);
    }

    if (filters.technicianId) {
      sql += ` AND p.technician_id = ?`;
      params.push(filters.technicianId);
    }

    if (filters.type && filters.type !== "all") {
      sql += ` AND p.type = ?`;
      params.push(filters.type);
    }

    if (filters.from) {
      sql += ` AND p.created_at >= ?`;
      params.push(filters.from);
    }

    if (filters.to) {
      sql += ` AND p.created_at <= ?`;
      params.push(filters.to);
    }

    sql += ` ORDER BY p.created_at DESC`;

    return query.all(sql, ...params);
  }

  static getProductionById(id: string) {
    const p = query.get<any>(
      `
      SELECT p.id, p.type, p.description, p.machine_id, p.technician_id, p.client_id, p.client_name,
             p.supply_id, p.supply_consumed, p.duration_minutes, p.status, p.observations, p.created_at,
             m.name as machine_name, m.tag as machine_tag, m.type as machine_type,
             u.name as technician_name,
             s.name as supply_name, s.color as supply_color
      FROM productions p
      JOIN machines m ON m.id = p.machine_id
      JOIN users u ON u.id = p.technician_id
      LEFT JOIN supplies s ON s.id = p.supply_id
      WHERE p.id = ?
    `,
      id
    );

    if (!p) {
      throw new AppError("Registro de produção não encontrado.", 404, "PRODUCTION_NOT_FOUND");
    }

    return p;
  }

  static createProduction(data: {
    type: "impressao_3d" | "escaneamento";
    description: string;
    machineId: string;
    technicianId: string;
    clientId?: string;
    clientName?: string;
    supplyId?: string;
    supplyConsumed?: number;
    durationMinutes?: number;
    status?: "em_andamento" | "concluida" | "cancelada";
    observations?: string;
  }) {
    if (!data.type || !data.description || !data.machineId || !data.technicianId) {
      throw new AppError("Tipo, descrição, máquina e técnico responsável são obrigatórios.", 400);
    }

    const machine = query.get<any>("SELECT id, name, type, status FROM machines WHERE id = ?", data.machineId);
    if (!machine) {
      throw new AppError("Máquina selecionada não encontrada.", 404, "MACHINE_NOT_FOUND");
    }

    const technician = query.get<any>("SELECT id, name, role FROM users WHERE id = ?", data.technicianId);
    if (!technician) {
      throw new AppError("Técnico responsável não encontrado.", 404, "USER_NOT_FOUND");
    }

    const consumed = Number(data.supplyConsumed) || 0;

    // Regra de validação: Scanner permite consumo zero
    if (data.type === "escaneamento" && consumed > 0) {
      // permitido caso use papel/adesivo, mas normal é 0
    }

    return query.transaction(() => {
      // Se houver consumo de suprimento e status for 'concluida', debita do estoque
      if (consumed > 0 && data.supplyId) {
        const supply = query.get<any>("SELECT id, name, balance, minimum_balance FROM supplies WHERE id = ?", data.supplyId);
        if (!supply) {
          throw new AppError("Insumo selecionado não encontrado.", 404, "SUPPLY_NOT_FOUND");
        }

        if (supply.balance < consumed) {
          throw new AppError(
            `Saldo insuficiente do insumo ${supply.name}. Saldo disponível: ${supply.balance} kg; Solicitado: ${consumed} kg.`,
            400,
            "INSUFFICIENT_STOCK"
          );
        }

        const newBalance = Number((supply.balance - consumed).toFixed(3));
        let newStatus = "regular";
        if (newBalance <= supply.minimum_balance * 0.5) newStatus = "critico";
        else if (newBalance <= supply.minimum_balance) newStatus = "abaixo";

        query.run(
          `UPDATE supplies SET balance = ?, status = ?, updated_at = datetime('now') WHERE id = ?`,
          newBalance,
          newStatus,
          data.supplyId
        );

        // Movimento de saída rastreável no estoque
        query.run(
          `INSERT INTO stock_movements (id, supply_id, type, quantity, observations, reference_id, created_by)
           VALUES (?, ?, 'saida_producao', ?, ?, ?, ?)`,
          crypto.randomUUID(),
          data.supplyId,
          -consumed,
          `Consumo na produção: ${data.description}`,
          data.machineId,
          data.technicianId
        );
      }

      const id = `prod-${crypto.randomUUID()}`;

      query.run(
        `INSERT INTO productions (id, type, description, machine_id, technician_id, client_id, client_name, supply_id, supply_consumed, duration_minutes, status, observations)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        data.type,
        data.description.trim(),
        data.machineId,
        data.technicianId,
        data.clientId || null,
        data.clientName || "",
        data.supplyId || null,
        consumed,
        data.durationMinutes || 0,
        data.status || "concluida",
        data.observations || ""
      );

      return this.getProductionById(id);
    });
  }
}

