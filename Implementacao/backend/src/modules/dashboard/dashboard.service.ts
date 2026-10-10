import { query } from "../../database/connection.js";

export class DashboardService {
  static getSummary() {
    // 1. Contagens de máquinas
    const machinesStats = query.get<any>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ativa' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'manutencao' THEN 1 ELSE 0 END) as maintenance,
        SUM(CASE WHEN status = 'inativa' THEN 1 ELSE 0 END) as inactive
      FROM machines
    `) || { total: 0, active: 0, maintenance: 0, inactive: 0 };

    // 2. Contagens de usuários
    const usersStats = query.get<any>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN role = 'tecnico' THEN 1 ELSE 0 END) as technicians,
        SUM(CASE WHEN role = 'administrador' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN role IN ('aluno', 'cliente', 'professor') THEN 1 ELSE 0 END) as clients
      FROM users
    `) || { total: 0, technicians: 0, admins: 0, clients: 0 };

    // 3. Empréstimos
    const loansStats = query.get<any>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('em_campo', 'devolucao_hoje') THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'atrasado' THEN 1 ELSE 0 END) as overdue,
        SUM(CASE WHEN status = 'devolvido' THEN 1 ELSE 0 END) as returned
      FROM loans
    `) || { total: 0, active: 0, overdue: 0, returned: 0 };

    // 4. Suprimentos em nível crítico ou baixo
    const suppliesStats = query.get<any>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('abaixo', 'critico') THEN 1 ELSE 0 END) as low_stock,
        SUM(balance) as total_kg
      FROM supplies
    `) || { total: 0, low_stock: 0, total_kg: 0 };

    // 5. Atividades recentes (últimas produções)
    const recentProductions = query.all(`
      SELECT p.id, p.type, p.description, p.client_name, p.supply_consumed, p.created_at,
             m.name as machine_name, u.name as technician_name
      FROM productions p
      JOIN machines m ON m.id = p.machine_id
      JOIN users u ON u.id = p.technician_id
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

    // 6. Próximas manutenções
    const upcomingMaintenances = query.all(`
      SELECT m.id, m.name, m.tag, m.next_maintenance_date, m.status
      FROM machines m
      WHERE m.next_maintenance_date IS NOT NULL
      ORDER BY m.next_maintenance_date ASC
      LIMIT 5
    `);

    return {
      machines: {
        total: machinesStats.total || 0,
        active: machinesStats.active || 0,
        maintenance: machinesStats.maintenance || 0,
        inactive: machinesStats.inactive || 0,
      },
      users: {
        total: usersStats.total || 0,
        technicians: usersStats.technicians || 0,
        admins: usersStats.admins || 0,
        clients: usersStats.clients || 0,
      },
      loans: {
        total: loansStats.total || 0,
        active: loansStats.active || 0,
        overdue: loansStats.overdue || 0,
        returned: loansStats.returned || 0,
      },
      supplies: {
        totalItems: suppliesStats.total || 0,
        lowStockItems: suppliesStats.low_stock || 0,
        totalBalanceKg: Number((suppliesStats.total_kg || 0).toFixed(2)),
      },
      recentProductions,
      upcomingMaintenances,
    };
  }
}

