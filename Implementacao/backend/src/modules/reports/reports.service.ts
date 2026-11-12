import { query } from "../../database/connection.js";
import { effectiveLoanStatusSql } from "../loans/loanStatus.js";
import { upperBoundClause } from "../../utils/dates.js";

// Registros detalhados devolvidos por relatório; as métricas são calculadas sobre todos os registros
const REPORT_RECORD_LIMIT = 500;

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
      WHERE p.status != 'cancelada'
    `;
    const params: any[] = [];

    if (filters.from) {
      sql += ` AND p.created_at >= ?`;
      params.push(filters.from);
    }
    if (filters.to) {
      const upper = upperBoundClause("p.created_at", filters.to);
      sql += ` AND ${upper.sql}`;
      params.push(upper.value);
    }
    if (filters.technicianId) {
      sql += ` AND p.technician_id = ?`;
      params.push(filters.technicianId);
    }

    const orderBy = ` ORDER BY p.created_at DESC`;

    // Métricas agregadas no banco (não carregam todos os registros na memória)
    const agg = query.get<any>(
      `SELECT COUNT(*) AS totalJobs,
              COALESCE(SUM(duration_minutes), 0) AS totalMinutes,
              COALESCE(SUM(supply_consumed), 0) AS totalMaterialKg
       FROM (${sql})`,
      ...params
    );
    const totalJobs = agg?.totalJobs ?? 0;
    const totalMinutes = agg?.totalMinutes ?? 0;
    const totalMaterialKg = agg?.totalMaterialKg ?? 0;
    const avgDurationMinutes = totalJobs > 0 ? Math.round(totalMinutes / totalJobs) : 0;

    // Lista detalhada limitada aos registros mais recentes
    const records = query.all(`${sql}${orderBy} LIMIT ?`, ...params, REPORT_RECORD_LIMIT);

    return {
      metrics: {
        totalJobs,
        totalHours: Number((totalMinutes / 60).toFixed(1)),
        avgDurationMinutes,
        totalMaterialKg: Number(totalMaterialKg.toFixed(2)),
      },
      records,
      recordsLimit: REPORT_RECORD_LIMIT,
      truncated: totalJobs > records.length,
    };
  }

  // 2. Relatório de Produção Mensal por Técnico
  static getProductionByTechnician(filters: { from?: string; to?: string; groupBy?: string }) {
    const isMonthly = filters.groupBy === "month";
    const selectMonth = isMonthly ? "strftime('%Y-%m', p.created_at) as month," : "";
    const groupClause = isMonthly
      ? "GROUP BY month, u.id, u.name ORDER BY month DESC, total_jobs DESC"
      : "GROUP BY u.id, u.name ORDER BY total_jobs DESC";

    let sql = `
      SELECT ${selectMonth} u.id as technician_id, u.name as technician_name,
             COUNT(p.id) as total_jobs,
             SUM(p.duration_minutes) as total_minutes,
             SUM(p.supply_consumed) as total_material_kg,
             SUM(CASE WHEN p.type = 'impressao_3d' THEN 1 ELSE 0 END) as print_count,
             SUM(CASE WHEN p.type = 'escaneamento' THEN 1 ELSE 0 END) as scan_count
      FROM productions p
      JOIN users u ON u.id = p.technician_id
      WHERE p.status != 'cancelada'
    `;
    const params: any[] = [];

    if (filters.from) {
      sql += ` AND p.created_at >= ?`;
      params.push(filters.from);
    }
    if (filters.to) {
      const upper = upperBoundClause("p.created_at", filters.to);
      sql += ` AND ${upper.sql}`;
      params.push(upper.value);
    }

    sql += ` ${groupClause}`;

    const rows = query.all(sql, ...params);
    return rows.map((r) => ({
      ...(filters.groupBy === "month" ? { month: r.month } : {}),
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
             COALESCE(SUM(CASE WHEN sm.type = 'saida_producao' THEN ABS(sm.quantity)
                               WHEN sm.type = 'estorno' THEN -ABS(sm.quantity) ELSE 0 END), 0) as total_consumed_kg
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
      const upper = upperBoundClause("sm.created_at", filters.to);
      sql += ` AND (${upper.sql} OR sm.created_at IS NULL)`;
      params.push(upper.value);
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
      SELECT l.id, l.equipment_id, l.responsible_name, l.checkout_date, l.due_date, l.return_date, ${effectiveLoanStatusSql("l")} AS status,
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
      const upper = upperBoundClause("l.checkout_date", filters.to);
      sql += ` AND ${upper.sql}`;
      params.push(upper.value);
    }

    const orderBy = ` ORDER BY l.checkout_date DESC`;

    const agg = query.get<any>(
      `SELECT COUNT(*) AS totalLoans,
              COALESCE(SUM(CASE WHEN status IN ('em_campo', 'devolucao_hoje') THEN 1 ELSE 0 END), 0) AS activeLoans,
              COALESCE(SUM(CASE WHEN status = 'atrasado' THEN 1 ELSE 0 END), 0) AS overdueLoans,
              COALESCE(SUM(CASE WHEN status = 'devolvido' THEN 1 ELSE 0 END), 0) AS returnedLoans
       FROM (${sql})`,
      ...params
    );
    const records = query.all(`${sql}${orderBy} LIMIT ?`, ...params, REPORT_RECORD_LIMIT);

    return {
      metrics: {
        totalLoans: agg?.totalLoans ?? 0,
        activeLoans: agg?.activeLoans ?? 0,
        overdueLoans: agg?.overdueLoans ?? 0,
        returnedLoans: agg?.returnedLoans ?? 0,
      },
      records,
      recordsLimit: REPORT_RECORD_LIMIT,
      truncated: (agg?.totalLoans ?? 0) > records.length,
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
      const upper = upperBoundClause("m.date", filters.to);
      sql += ` AND ${upper.sql}`;
      params.push(upper.value);
    }

    const orderBy = ` ORDER BY m.date DESC`;

    const agg = query.get<any>(
      `SELECT COUNT(*) AS totalMaintenances,
              COALESCE(SUM(CASE WHEN type = 'preventiva' THEN 1 ELSE 0 END), 0) AS preventiveCount,
              COALESCE(SUM(CASE WHEN type = 'corretiva' THEN 1 ELSE 0 END), 0) AS correctiveCount,
              COALESCE(SUM(cost), 0) AS totalCost
       FROM (${sql})`,
      ...params
    );
    const records = query.all(`${sql}${orderBy} LIMIT ?`, ...params, REPORT_RECORD_LIMIT);

    return {
      metrics: {
        totalMaintenances: agg?.totalMaintenances ?? 0,
        preventiveCount: agg?.preventiveCount ?? 0,
        correctiveCount: agg?.correctiveCount ?? 0,
        totalCost: Number((agg?.totalCost ?? 0).toFixed(2)),
      },
      records,
      recordsLimit: REPORT_RECORD_LIMIT,
      truncated: (agg?.totalMaintenances ?? 0) > records.length,
    };
  }
}

