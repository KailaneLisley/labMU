import { query } from "../../database/connection.js";

export class ReportsService {
  // 1. Relatório de Produção Geral e Detalhado
  static getProductionReport(filters: { from?: string; to?: string; technicianId?: string }) {
    let sql = `
      SELECT p.id, p.type, p.description, p.client_name, p.supply_consumed, p.duration_minutes, p.created_at,
             m.name as machine_name, m.tag as machine_tag,
             u.name as technician_name,
             s.name as supply_name, s.color as supply_color
      FROM productions p
      JOIN machines m ON m.id = p.machine_id
      JOIN users u ON u.id = p.technician_id
      LEFT JOIN supplies s ON s.id = p.supply_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.from) {
      sql += ` AND p.created_at >= ?`;
      params.push(filters.from);
    }
    if (filters.to) {
      sql += ` AND p.created_at <= ?`;
      params.push(filters.to);
    }
    if (filters.technicianId) {
      sql += ` AND p.technician_id = ?`;
      params.push(filters.technicianId);
    }

    sql += ` ORDER BY p.created_at DESC`;

    const records = query.all(sql, ...params);
    const totalJobs = records.length;
    const totalMinutes = records.reduce((acc, cur) => acc + (cur.duration_minutes || 0), 0);
    const totalMaterialKg = records.reduce((acc, cur) => acc + (cur.supply_consumed || 0), 0);
    const avgDurationMinutes = totalJobs > 0 ? Math.round(totalMinutes / totalJobs) : 0;

    return {
      metrics: {
        totalJobs,
        totalHours: Number((totalMinutes / 60).toFixed(1)),
        avgDurationMinutes,
        totalMaterialKg: Number(totalMaterialKg.toFixed(2)),
      },
      records,
    };
  }

  // 2. Relatório de Produção Mensal por Técnico
  static getProductionByTechnician(filters: { from?: string; to?: string }) {
    let sql = `
      SELECT u.id as technician_id, u.name as technician_name,
             COUNT(p.id) as total_jobs,
             SUM(p.duration_minutes) as total_minutes,
             SUM(p.supply_consumed) as total_material_kg,
             SUM(CASE WHEN p.type = 'impressao_3d' THEN 1 ELSE 0 END) as print_count,
             SUM(CASE WHEN p.type = 'escaneamento' THEN 1 ELSE 0 END) as scan_count
      FROM productions p
      JOIN users u ON u.id = p.technician_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.from) {
      sql += ` AND p.created_at >= ?`;
      params.push(filters.from);
    }
    if (filters.to) {
      sql += ` AND p.created_at <= ?`;
      params.push(filters.to);
    }

    sql += ` GROUP BY u.id, u.name ORDER BY total_jobs DESC`;

    const rows = query.all(sql, ...params);
    return rows.map((r) => ({
      technicianId: r.technician_id,
      technicianName: r.technician_name,
      totalJobs: r.total_jobs,
      totalHours: Number(((r.total_minutes || 0) / 60).toFixed(1)),
      totalMaterialKg: Number((r.total_material_kg || 0).toFixed(2)),
      printCount: r.print_count,
      scanCount: r.scan_count,
    }));
  }

  // 3. Relatório de Consumo Mensal de Estoque
  static getStockConsumption(filters: { from?: string; to?: string }) {
    let sql = `
      SELECT s.id as supply_id, s.name as supply_name, s.color as supply_color, s.type as supply_type, s.balance as current_balance,
             COALESCE(SUM(CASE WHEN sm.type = 'entrada' THEN sm.quantity ELSE 0 END), 0) as total_received_kg,
             COALESCE(SUM(CASE WHEN sm.type = 'saida_producao' THEN ABS(sm.quantity) ELSE 0 END), 0) as total_consumed_kg
      FROM supplies s
      LEFT JOIN stock_movements sm ON sm.supply_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.from) {
      sql += ` AND (sm.created_at >= ? OR sm.created_at IS NULL)`;
      params.push(filters.from);
    }
    if (filters.to) {
      sql += ` AND (sm.created_at <= ? OR sm.created_at IS NULL)`;
      params.push(filters.to);
    }

    sql += ` GROUP BY s.id, s.name, s.color, s.type, s.balance ORDER BY total_consumed_kg DESC`;

    const rows = query.all(sql, ...params);
    return rows.map((r) => ({
      supplyId: r.supply_id,
      supplyName: `${r.supply_name} (${r.supply_color})`,
      type: r.supply_type,
      currentBalance: r.current_balance,
      totalReceivedKg: Number(r.total_received_kg.toFixed(2)),
      totalConsumedKg: Number(r.total_consumed_kg.toFixed(2)),
    }));
  }

  // 4. Relatório Mensal de Empréstimos
  static getLoansReport(filters: { from?: string; to?: string }) {
    let sql = `
      SELECT l.id, l.equipment_id, l.responsible_name, l.checkout_date, l.due_date, l.return_date, l.status,
             pe.name as equipment_name, pe.code as equipment_code, pe.category as equipment_category
      FROM loans l
      JOIN portable_equipment pe ON pe.id = l.equipment_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.from) {
      sql += ` AND l.checkout_date >= ?`;
      params.push(filters.from);
    }
    if (filters.to) {
      sql += ` AND l.checkout_date <= ?`;
      params.push(filters.to);
    }

    sql += ` ORDER BY l.checkout_date DESC`;

    const records = query.all(sql, ...params);
    const totalLoans = records.length;
    const activeLoans = records.filter((r) => r.status === "em_campo" || r.status === "devolucao_hoje").length;
    const overdueLoans = records.filter((r) => r.status === "atrasado").length;
    const returnedLoans = records.filter((r) => r.status === "devolvido").length;

    return {
      metrics: {
        totalLoans,
        activeLoans,
        overdueLoans,
        returnedLoans,
      },
      records,
    };
  }

  // 5. Relatório de Manutenções
  static getMaintenancesReport(filters: { from?: string; to?: string }) {
    let sql = `
      SELECT m.id, m.type, m.status, m.date, m.description, m.parts, m.cost,
             mach.name as machine_name, mach.tag as machine_tag,
             u.name as technician_name
      FROM maintenances m
      JOIN machines mach ON mach.id = m.machine_id
      LEFT JOIN users u ON u.id = m.technician_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.from) {
      sql += ` AND m.date >= ?`;
      params.push(filters.from);
    }
    if (filters.to) {
      sql += ` AND m.date <= ?`;
      params.push(filters.to);
    }

    sql += ` ORDER BY m.date DESC`;

    const records = query.all(sql, ...params);
    const totalMaintenances = records.length;
    const preventiveCount = records.filter((r) => r.type === "preventiva").length;
    const correctiveCount = records.filter((r) => r.type === "corretiva").length;
    const totalCost = records.reduce((acc, cur) => acc + (cur.cost || 0), 0);

    return {
      metrics: {
        totalMaintenances,
        preventiveCount,
        correctiveCount,
        totalCost: Number(totalCost.toFixed(2)),
      },
      records,
    };
  }
}

