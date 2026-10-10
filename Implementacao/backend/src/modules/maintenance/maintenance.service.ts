import crypto from "node:crypto";
import { query } from "../../database/connection.js";
import { AppError } from "../../middlewares/errorHandler.js";

export class MaintenanceService {
  static list(filters: {
    machineId?: string;
    type?: string;
    status?: string;
    from?: string;
    to?: string;
  }) {
    let sql = `
      SELECT m.id, m.machine_id, m.technician_id, m.type, m.status, m.date, m.description, m.parts, m.cost, m.observations, m.created_at,
             mach.name as machine_name, mach.tag as machine_tag,
             u.name as technician_name
      FROM maintenances m
      JOIN machines mach ON mach.id = m.machine_id
      LEFT JOIN users u ON u.id = m.technician_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.machineId) {
      sql += ` AND m.machine_id = ?`;
      params.push(filters.machineId);
    }

    if (filters.type && filters.type !== "all") {
      sql += ` AND m.type = ?`;
      params.push(filters.type);
    }

    if (filters.status && filters.status !== "all") {
      sql += ` AND m.status = ?`;
      params.push(filters.status);
    }

    if (filters.from) {
      sql += ` AND m.date >= ?`;
      params.push(filters.from);
    }

    if (filters.to) {
      sql += ` AND m.date <= ?`;
      params.push(filters.to);
    }

    sql += ` ORDER BY m.date DESC, m.created_at DESC`;

    return query.all(sql, ...params);
  }

  static getById(id: string) {
    const item = query.get<any>(
      `
      SELECT m.id, m.machine_id, m.technician_id, m.type, m.status, m.date, m.description, m.parts, m.cost, m.observations, m.created_at,
             mach.name as machine_name, mach.tag as machine_tag,
             u.name as technician_name
      FROM maintenances m
      JOIN machines mach ON mach.id = m.machine_id
      LEFT JOIN users u ON u.id = m.technician_id
      WHERE m.id = ?
    `,
      id
    );

    if (!item) {
      throw new AppError("Registro de manutenção não encontrado.", 404, "MAINTENANCE_NOT_FOUND");
    }

    return item;
  }

  static create(data: {
    machineId: string;
    technicianId?: string;
    type: "preventiva" | "corretiva";
    status?: "agendada" | "em_andamento" | "concluida" | "cancelada";
    date: string;
    description: string;
    parts?: string;
    cost?: number;
    observations?: string;
  }) {
    if (!data.machineId || !data.type || !data.date || !data.description) {
      throw new AppError("Máquina, tipo, data e descrição são obrigatórios.", 400);
    }

    const machine = query.get<any>("SELECT id, status FROM machines WHERE id = ?", data.machineId);
    if (!machine) {
      throw new AppError("Máquina não encontrada.", 404, "MACHINE_NOT_FOUND");
    }

    const id = `maint-${crypto.randomUUID()}`;
    const status = data.status || "concluida";

    return query.transaction(() => {
      query.run(
        `INSERT INTO maintenances (id, machine_id, technician_id, type, status, date, description, parts, cost, observations)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        data.machineId,
        data.technicianId || null,
        data.type,
        status,
        data.date,
        data.description,
        data.parts || "",
        data.cost || 0,
        data.observations || ""
      );

      // Se manutenção foi concluída ou em andamento, atualiza status da máquina
      if (status === "em_andamento") {
        query.run("UPDATE machines SET status = 'manutencao' WHERE id = ?", data.machineId);
      } else if (status === "concluida") {
        // Calcula próxima manutenção preventiva (30 dias à frente conforme requisito da preventiva mensal)
        const dateObj = new Date(data.date);
        dateObj.setDate(dateObj.getDate() + 30);
        const nextDate = dateObj.toISOString().split("T")[0];

        query.run(
          `UPDATE machines
           SET status = 'ativa', last_maintenance = ?, next_maintenance_date = ?, updated_at = datetime('now')
           WHERE id = ?`,
          data.date,
          nextDate,
          data.machineId
        );
      }

      return this.getById(id);
    });
  }

  static update(id: string, data: {
    status?: "agendada" | "em_andamento" | "concluida" | "cancelada";
    description?: string;
    parts?: string;
    cost?: number;
    observations?: string;
  }) {
    const existing = this.getById(id);

    const status = data.status || existing.status;
    const description = data.description || existing.description;
    const parts = data.parts !== undefined ? data.parts : existing.parts;
    const cost = data.cost !== undefined ? data.cost : existing.cost;
    const observations = data.observations !== undefined ? data.observations : existing.observations;

    query.run(
      `UPDATE maintenances
       SET status = ?, description = ?, parts = ?, cost = ?, observations = ?, updated_at = datetime('now')
       WHERE id = ?`,
      status,
      description,
      parts,
      cost,
      observations,
      id
    );

    if (status === "concluida") {
      query.run("UPDATE machines SET status = 'ativa' WHERE id = ?", existing.machine_id);
    } else if (status === "em_andamento") {
      query.run("UPDATE machines SET status = 'manutencao' WHERE id = ?", existing.machine_id);
    }

    return this.getById(id);
  }
}

