import crypto from "node:crypto";
import { query } from "../../database/connection.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { upperBoundClause } from "../../utils/dates.js";

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
      const upper = upperBoundClause("p.created_at", filters.to);
      sql += ` AND ${upper.sql}`;
      params.push(upper.value);
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

  static createProduction(
    data: {
      type: "impressao_3d" | "escaneamento";
      description: string;
      machineId: string;
      technicianId?: string;
      clientId?: string;
      clientName?: string;
      supplyId?: string;
      supplyConsumed?: number;
      durationMinutes?: number;
      status?: "em_andamento" | "concluida" | "cancelada";
      observations?: string;
    },
    actor: { id: string; role: string }
  ) {
    if (!data.type || !data.description || !data.machineId) {
      throw new AppError("Tipo, descrição e máquina são obrigatórios.", 400);
    }

    if (data.type !== "impressao_3d" && data.type !== "escaneamento") {
      throw new AppError("Tipo de produção inválido.", 400, "INVALID_PRODUCTION_TYPE");
    }

    // Técnico comum só registra em nome próprio; apenas administrador registra em nome de outro
    const isAdmin = actor.role === "administrador";
    if (!isAdmin && data.technicianId && data.technicianId !== actor.id) {
      throw new AppError(
        "Técnicos só podem registrar produção em nome próprio.",
        403,
        "PRODUCTION_TECHNICIAN_MISMATCH"
      );
    }
    const technicianId = isAdmin ? data.technicianId || actor.id : actor.id;

    const machine = query.get<any>("SELECT id, name, type, status FROM machines WHERE id = ?", data.machineId);
    if (!machine) {
      throw new AppError("Máquina selecionada não encontrada.", 404, "MACHINE_NOT_FOUND");
    }

    if (machine.status !== "ativa") {
      throw new AppError(
        `A máquina ${machine.name} está ${machine.status} e não pode receber produção.`,
        400,
        "MACHINE_INACTIVE"
      );
    }

    const isScan = data.type === "escaneamento";
    const compatible = isScan ? machine.type === "scanner" : machine.type.startsWith("printer_3d");
    if (!compatible) {
      throw new AppError(
        `A máquina ${machine.name} não é compatível com ${isScan ? "escaneamento" : "impressão 3D"}.`,
        400,
        "MACHINE_TYPE_MISMATCH"
      );
    }

    const technician = query.get<any>("SELECT id, name, role FROM users WHERE id = ?", technicianId);
    if (!technician) {
      throw new AppError("Técnico responsável não encontrado.", 404, "USER_NOT_FOUND");
    }

    const consumed = data.supplyConsumed == null ? 0 : Number(data.supplyConsumed);
    if (!Number.isFinite(consumed) || consumed < 0) {
      throw new AppError("O consumo de insumo deve ser um número maior ou igual a zero.", 400, "INVALID_CONSUMPTION");
    }

    // Escaneamento não consome insumo: o material só é gasto na impressão
    if (isScan && consumed > 0) {
      throw new AppError("Escaneamento não consome insumo; informe consumo zero.", 400, "SCAN_NO_CONSUMPTION");
    }

    const duration = data.durationMinutes == null ? 0 : Number(data.durationMinutes);
    if (!Number.isFinite(duration) || duration < 0) {
      throw new AppError("A duração deve ser um número maior ou igual a zero.", 400, "INVALID_DURATION");
    }

    // Todo consumo precisa informar de qual insumo saiu, para que o estoque seja debitado
    if (consumed > 0 && !data.supplyId) {
      throw new AppError("Informe o insumo utilizado sempre que houver consumo.", 400, "SUPPLY_REQUIRED");
    }

    const id = `prod-${crypto.randomUUID()}`;

    return query.transaction(() => {
      // Consumo de insumo debita do estoque
      if (consumed > 0) {
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
          id,
          technicianId
        );
      }

      query.run(
        `INSERT INTO productions (id, type, description, machine_id, technician_id, client_id, client_name, supply_id, supply_consumed, duration_minutes, status, observations)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        data.type,
        data.description.trim(),
        data.machineId,
        technicianId,
        data.clientId || null,
        data.clientName || "",
        data.supplyId || null,
        consumed,
        duration,
        data.status || "concluida",
        data.observations || ""
      );

      return this.getProductionById(id);
    });
  }
}

