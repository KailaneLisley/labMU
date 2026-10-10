import crypto from "node:crypto";
import { query } from "../../database/connection.js";
import { AppError } from "../../middlewares/errorHandler.js";

export class SuppliesService {
  static listSupplies(filters: { q?: string; status?: string; type?: string }) {
    let sql = `SELECT id, name, type, color, balance, minimum_balance, status, created_at, updated_at
               FROM supplies WHERE 1=1`;
    const params: any[] = [];

    if (filters.q) {
      const search = `%${filters.q.trim().toLowerCase()}%`;
      sql += ` AND (LOWER(name) LIKE ? OR LOWER(color) LIKE ? OR LOWER(type) LIKE ?)`;
      params.push(search, search, search);
    }

    if (filters.status && filters.status !== "all") {
      sql += ` AND status = ?`;
      params.push(filters.status);
    }

    if (filters.type && filters.type !== "all") {
      sql += ` AND type = ?`;
      params.push(filters.type);
    }

    sql += ` ORDER BY name ASC, color ASC`;

    return query.all(sql, ...params);
  }

  static getSupplyById(id: string) {
    const item = query.get<any>(
      `SELECT id, name, type, color, balance, minimum_balance, status, created_at, updated_at
       FROM supplies WHERE id = ?`,
      id
    );

    if (!item) {
      throw new AppError("Insumo não encontrado.", 404, "SUPPLY_NOT_FOUND");
    }

    return item;
  }

  static createSupply(data: {
    name: string;
    type: string;
    color: string;
    balance?: number;
    minimumBalance?: number;
  }) {
    if (!data.name || !data.type || !data.color) {
      throw new AppError("Nome, tipo e cor do insumo são obrigatórios.", 400);
    }

    const id = `sup-${crypto.randomUUID()}`;
    const initialBalance = Number(data.balance) || 0;
    const minBalance = Number(data.minimumBalance) || 1.0;

    let status = "regular";
    if (initialBalance <= minBalance * 0.5) status = "critico";
    else if (initialBalance <= minBalance) status = "abaixo";

    return query.transaction(() => {
      query.run(
        `INSERT INTO supplies (id, name, type, color, balance, minimum_balance, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        id,
        data.name.trim(),
        data.type.trim(),
        data.color.trim(),
        initialBalance,
        minBalance,
        status
      );

      if (initialBalance > 0) {
        query.run(
          `INSERT INTO stock_movements (id, supply_id, type, quantity, lot, observations)
           VALUES (?, ?, 'entrada', ?, 'CARGA-INICIAL', 'Saldo inicial de cadastro')`,
          crypto.randomUUID(),
          id,
          initialBalance
        );
      }

      return this.getSupplyById(id);
    });
  }

  static registerEntry(data: {
    supplyId?: string;
    name?: string;
    type?: string;
    color?: string;
    quantity: number;
    lot?: string;
    observations?: string;
    userId?: string;
  }) {
    const qty = Number(data.quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new AppError("A quantidade de entrada deve ser um valor positivo em kg.", 400);
    }

    return query.transaction(() => {
      let supplyId = data.supplyId;

      // Se supplyId não foi informado, busca ou cria insumo com o nome/tipo/cor fornecidos
      if (!supplyId) {
        if (!data.name) throw new AppError("Selecione um insumo ou informe o nome.", 400);
        const existing = query.get<any>(
          "SELECT id FROM supplies WHERE LOWER(name) = ? AND LOWER(color) = ?",
          data.name.trim().toLowerCase(),
          (data.color || "").trim().toLowerCase()
        );
        if (existing) {
          supplyId = existing.id;
        } else {
          const created = this.createSupply({
            name: data.name,
            type: data.type || "Termoplástico",
            color: data.color || "Padrão",
            balance: 0,
          });
          supplyId = created.id;
        }
      }

      const supply = this.getSupplyById(supplyId!);
      const newBalance = Number((supply.balance + qty).toFixed(3));

      let newStatus = "regular";
      if (newBalance <= supply.minimum_balance * 0.5) newStatus = "critico";
      else if (newBalance <= supply.minimum_balance) newStatus = "abaixo";

      query.run(
        `UPDATE supplies SET balance = ?, status = ?, updated_at = datetime('now') WHERE id = ?`,
        newBalance,
        newStatus,
        supplyId
      );

      const movementId = crypto.randomUUID();
      query.run(
        `INSERT INTO stock_movements (id, supply_id, type, quantity, lot, observations, created_by)
         VALUES (?, ?, 'entrada', ?, ?, ?, ?)`,
        movementId,
        supplyId,
        qty,
        data.lot || "LOTE-RECEBIMENTO",
        data.observations || "Entrada de insumo registrada",
        data.userId || null
      );

      return {
        supply: this.getSupplyById(supplyId!),
        movementId,
      };
    });
  }

  static listMovements(filters: { supplyId?: string; from?: string; to?: string }) {
    let sql = `
      SELECT sm.id, sm.supply_id, sm.type, sm.quantity, sm.unit, sm.lot, sm.observations, sm.reference_id, sm.created_at,
             s.name as supply_name, s.color as supply_color, s.type as supply_type,
             u.name as operator_name
      FROM stock_movements sm
      JOIN supplies s ON s.id = sm.supply_id
      LEFT JOIN users u ON u.id = sm.created_by
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.supplyId) {
      sql += ` AND sm.supply_id = ?`;
      params.push(filters.supplyId);
    }

    if (filters.from) {
      sql += ` AND sm.created_at >= ?`;
      params.push(filters.from);
    }

    if (filters.to) {
      sql += ` AND sm.created_at <= ?`;
      params.push(filters.to);
    }

    sql += ` ORDER BY sm.created_at DESC`;

    return query.all(sql, ...params);
  }
}

