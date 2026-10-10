import crypto from "node:crypto";
import { query } from "../../database/connection.js";
import { AppError } from "../../middlewares/errorHandler.js";

export class EquipmentService {
  static listEquipment(filters: { q?: string; status?: string; category?: string }) {
    let sql = `
      SELECT pe.id, pe.name, pe.code, pe.category, pe.serial_number, pe.location, pe.condition, pe.accessories, pe.status,
             l.responsible_name as current_responsible, l.due_date as current_due_date, l.id as current_loan_id
      FROM portable_equipment pe
      LEFT JOIN loans l ON l.equipment_id = pe.id AND l.status IN ('em_campo', 'atrasado', 'devolucao_hoje')
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.q) {
      const search = `%${filters.q.trim().toLowerCase()}%`;
      sql += ` AND (LOWER(pe.name) LIKE ? OR LOWER(pe.code) LIKE ? OR LOWER(pe.serial_number) LIKE ?)`;
      params.push(search, search, search);
    }

    if (filters.status && filters.status !== "all") {
      sql += ` AND pe.status = ?`;
      params.push(filters.status);
    }

    if (filters.category && filters.category !== "all") {
      sql += ` AND pe.category = ?`;
      params.push(filters.category);
    }

    sql += ` ORDER BY pe.name ASC`;

    const records = query.all(sql, ...params);
    return records.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      category: r.category || "",
      serialNumber: r.serial_number || "",
      location: r.location || "",
      condition: r.condition || "",
      accessories: r.accessories || "",
      status: r.status,
      responsible: r.current_responsible || "",
      dueDate: r.current_due_date || "",
      currentLoanId: r.current_loan_id || null,
    }));
  }

  static getEquipmentById(id: string) {
    const r = query.get<any>(
      `
      SELECT pe.id, pe.name, pe.code, pe.category, pe.serial_number, pe.location, pe.condition, pe.accessories, pe.status,
             l.responsible_name as current_responsible, l.due_date as current_due_date, l.id as current_loan_id
      FROM portable_equipment pe
      LEFT JOIN loans l ON l.equipment_id = pe.id AND l.status IN ('em_campo', 'atrasado', 'devolucao_hoje')
      WHERE pe.id = ?
    `,
      id
    );

    if (!r) {
      throw new AppError("Equipamento portátil não encontrado.", 404, "EQUIPMENT_NOT_FOUND");
    }

    return {
      id: r.id,
      name: r.name,
      code: r.code,
      category: r.category || "",
      serialNumber: r.serial_number || "",
      location: r.location || "",
      condition: r.condition || "",
      accessories: r.accessories || "",
      status: r.status,
      responsible: r.current_responsible || "",
      dueDate: r.current_due_date || "",
      currentLoanId: r.current_loan_id || null,
    };
  }

  static createEquipment(data: {
    name: string;
    code: string;
    category?: string;
    serialNumber?: string;
    location?: string;
    condition?: string;
    accessories?: string;
  }) {
    const name = data.name.trim();
    const code = data.code.trim();

    if (!name || !code) {
      throw new AppError("Nome e código/TAG do equipamento portátil são obrigatórios.", 400);
    }

    // Regra: Verifica se o código colide com uma máquina fixa
    const fixedMachineConflict = query.get("SELECT id FROM machines WHERE UPPER(tag) = ?", code.toUpperCase());
    if (fixedMachineConflict) {
      throw new AppError(
        "Este código já pertence a uma máquina fixa do laboratório. Máquinas fixas não são portáteis e não podem ser cadastradas para empréstimo.",
        400,
        "FIXED_MACHINE_RESTRICTION"
      );
    }

    const existingCode = query.get("SELECT id FROM portable_equipment WHERE UPPER(code) = ?", code.toUpperCase());
    if (existingCode) {
      throw new AppError("Já existe um equipamento portátil cadastrado com este código.", 409, "CODE_EXISTS");
    }

    const id = `eq-${crypto.randomUUID()}`;

    query.run(
      `INSERT INTO portable_equipment (id, name, code, category, serial_number, location, condition, accessories, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'disponivel')`,
      id,
      name,
      code,
      data.category || "Equipamento Portátil",
      data.serialNumber || "",
      data.location || "",
      data.condition || "Bom",
      data.accessories || ""
    );

    return this.getEquipmentById(id);
  }
}

