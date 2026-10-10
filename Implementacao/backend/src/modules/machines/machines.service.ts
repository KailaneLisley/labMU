import crypto from "node:crypto";
import { query } from "../../database/connection.js";
import { AppError } from "../../middlewares/errorHandler.js";

export class MachinesService {
  static listMachines(filters: { q?: string; type?: string; status?: string }) {
    let sql = `SELECT id, name, tag, type, dimensions, bench, room, status, last_maintenance, next_maintenance_date, created_at, updated_at
               FROM machines WHERE 1=1`;
    const params: any[] = [];

    if (filters.q) {
      const search = `%${filters.q.trim().toLowerCase()}%`;
      sql += ` AND (LOWER(name) LIKE ? OR LOWER(tag) LIKE ?)`;
      params.push(search, search);
    }

    if (filters.type && filters.type !== "all") {
      if (filters.type === "3d") {
        sql += ` AND type IN ('printer_3d_fdm', 'printer_3d_resin')`;
      } else {
        sql += ` AND type = ?`;
        params.push(filters.type);
      }
    }

    if (filters.status && filters.status !== "all") {
      sql += ` AND status = ?`;
      params.push(filters.status);
    }

    sql += ` ORDER BY name ASC`;

    const records = query.all(sql, ...params);
    return records.map((m) => ({
      id: m.id,
      name: m.name,
      tag: m.tag,
      type: m.type,
      dimensions: m.dimensions || "",
      location: {
        bench: m.bench || "",
        room: m.room || "",
      },
      status: m.status,
      lastMaintenance: m.last_maintenance,
      nextMaintenanceDate: m.next_maintenance_date,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));
  }

  static getMachineById(id: string) {
    const m = query.get<any>(
      `SELECT id, name, tag, type, dimensions, bench, room, status, last_maintenance, next_maintenance_date, created_at, updated_at
       FROM machines WHERE id = ?`,
      id
    );

    if (!m) {
      throw new AppError("Máquina não encontrada.", 404, "MACHINE_NOT_FOUND");
    }

    return {
      id: m.id,
      name: m.name,
      tag: m.tag,
      type: m.type,
      dimensions: m.dimensions || "",
      location: {
        bench: m.bench || "",
        room: m.room || "",
      },
      status: m.status,
      lastMaintenance: m.last_maintenance,
      nextMaintenanceDate: m.next_maintenance_date,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    };
  }

  static createMachine(data: {
    name: string;
    tag: string;
    type: "printer_3d_fdm" | "printer_3d_resin" | "scanner";
    dimensions?: string;
    location?: { bench?: string; room?: string };
    status?: "ativa" | "manutencao" | "inativa";
    lastMaintenance?: string;
    nextMaintenanceDate?: string;
  }) {
    const name = data.name.trim();
    const tag = data.tag.trim().toUpperCase();

    if (!name || !tag || !data.type) {
      throw new AppError("Nome, TAG e tipo da máquina são obrigatórios.", 400);
    }

    const existingTag = query.get("SELECT id FROM machines WHERE UPPER(tag) = ?", tag);
    if (existingTag) {
      throw new AppError("Já existe uma máquina cadastrada com esta TAG.", 409, "TAG_EXISTS");
    }

    const id = `mach-${crypto.randomUUID()}`;
    const bench = data.location?.bench || "";
    const room = data.location?.room || "";

    query.run(
      `INSERT INTO machines (id, name, tag, type, dimensions, bench, room, status, last_maintenance, next_maintenance_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      name,
      tag,
      data.type,
      data.dimensions || "",
      bench,
      room,
      data.status || "ativa",
      data.lastMaintenance || null,
      data.nextMaintenanceDate || null
    );

    return this.getMachineById(id);
  }

  static updateMachine(id: string, data: {
    name?: string;
    tag?: string;
    type?: "printer_3d_fdm" | "printer_3d_resin" | "scanner";
    dimensions?: string;
    location?: { bench?: string; room?: string };
    status?: "ativa" | "manutencao" | "inativa";
    lastMaintenance?: string;
    nextMaintenanceDate?: string;
  }) {
    const existing = this.getMachineById(id);

    if (data.tag && data.tag.toUpperCase() !== existing.tag.toUpperCase()) {
      const tagConflict = query.get("SELECT id FROM machines WHERE UPPER(tag) = ? AND id != ?", data.tag.toUpperCase(), id);
      if (tagConflict) {
        throw new AppError("Já existe outra máquina com esta TAG.", 409, "TAG_EXISTS");
      }
    }

    const name = data.name !== undefined ? data.name.trim() : existing.name;
    const tag = data.tag !== undefined ? data.tag.trim().toUpperCase() : existing.tag;
    const type = data.type !== undefined ? data.type : existing.type;
    const dimensions = data.dimensions !== undefined ? data.dimensions : existing.dimensions;
    const bench = data.location?.bench !== undefined ? data.location.bench : existing.location.bench;
    const room = data.location?.room !== undefined ? data.location.room : existing.location.room;
    const status = data.status !== undefined ? data.status : existing.status;
    const lastMaintenance = data.lastMaintenance !== undefined ? data.lastMaintenance : existing.lastMaintenance;
    const nextMaintenanceDate = data.nextMaintenanceDate !== undefined ? data.nextMaintenanceDate : existing.nextMaintenanceDate;

    query.run(
      `UPDATE machines
       SET name = ?, tag = ?, type = ?, dimensions = ?, bench = ?, room = ?, status = ?, last_maintenance = ?, next_maintenance_date = ?, updated_at = datetime('now')
       WHERE id = ?`,
      name,
      tag,
      type,
      dimensions,
      bench,
      room,
      status,
      lastMaintenance,
      nextMaintenanceDate,
      id
    );

    return this.getMachineById(id);
  }

  static deleteMachine(id: string) {
    this.getMachineById(id);

    // Verifica se há manutenções ou produções associadas
    const hasMaintenance = query.get("SELECT id FROM maintenances WHERE machine_id = ?", id);
    const hasProduction = query.get("SELECT id FROM productions WHERE machine_id = ?", id);

    if (hasMaintenance || hasProduction) {
      // Arquivamento / Inativação segura para não quebrar histórico auditável
      query.run(`UPDATE machines SET status = 'inativa', updated_at = datetime('now') WHERE id = ?`, id);
      return { message: "Máquina possui histórico e foi marcada como inativa." };
    }

    query.run("DELETE FROM machines WHERE id = ?", id);
    return { message: "Máquina removida com sucesso." };
  }
}

