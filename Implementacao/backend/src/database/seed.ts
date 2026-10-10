import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { query } from "./connection.js";
import { env } from "../config/env.js";

export function seedDatabase() {
  console.log("Iniciando seed do banco de dados...");

  // 1. Usuários Padrão (Administrador e Técnico)
  const existingAdmin = query.get("SELECT id FROM users WHERE email = ?", env.DEFAULT_ADMIN_EMAIL);
  if (!existingAdmin) {
    const adminPasswordHash = bcrypt.hashSync(env.DEFAULT_ADMIN_PASSWORD, 10);
    query.run(
      `INSERT INTO users (id, name, email, role, registration, phone, status, password_hash, initials, avatar_color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "usr-admin-musarq",
      "Administrador MUSARQ",
      env.DEFAULT_ADMIN_EMAIL,
      "administrador",
      "000001",
      "(81) 2119-4000 • Ramal 01",
      "ativo",
      adminPasswordHash,
      "AD",
      "bg-red-200"
    );
    console.log(`[Seed] Administrador padrão criado: ${env.DEFAULT_ADMIN_EMAIL} (Senha: ${env.DEFAULT_ADMIN_PASSWORD})`);
  }

  const existingTech = query.get("SELECT id FROM users WHERE email = ?", env.DEFAULT_TECH_EMAIL);
  if (!existingTech) {
    const techPasswordHash = bcrypt.hashSync(env.DEFAULT_TECH_PASSWORD, 10);
    query.run(
      `INSERT INTO users (id, name, email, role, registration, phone, status, password_hash, initials, avatar_color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "usr-tech-musarq",
      "Técnico MUSARQ",
      env.DEFAULT_TECH_EMAIL,
      "tecnico",
      "201904732",
      "(81) 2119-4102 • Ramal 18",
      "ativo",
      techPasswordHash,
      "TM",
      "bg-orange-200"
    );
    console.log(`[Seed] Técnico padrão criado: ${env.DEFAULT_TECH_EMAIL} (Senha: ${env.DEFAULT_TECH_PASSWORD})`);
  }

  // Usuários de referência para produção e empréstimos (Alunos/Professores)
  const mockClients = [
    {
      id: "usr-aluno-beatriz",
      name: "Beatriz Albuquerque",
      email: "b.albuquerque@aluno.unicap.br",
      role: "aluno",
      registration: "282208192",
      phone: "(81) 99614-2209",
      initials: "BA",
      avatarColor: "bg-gray-200"
    },
    {
      id: "usr-prof-carlos",
      name: "Prof. Carlos Eduardo",
      email: "carlos.mendes@unicap.br",
      role: "professor",
      registration: "199843210",
      phone: "(81) 2119-4088",
      initials: "CE",
      avatarColor: "bg-blue-200"
    },
    {
      id: "usr-aluno-mariana",
      name: "Mariana Lima",
      email: "mariana.lima@aluno.unicap.br",
      role: "aluno",
      registration: "282361988",
      phone: "(81) 98822-1094",
      initials: "ML",
      avatarColor: "bg-purple-200"
    }
  ];

  for (const client of mockClients) {
    const exists = query.get("SELECT id FROM users WHERE email = ?", client.email);
    if (!exists) {
      query.run(
        `INSERT INTO users (id, name, email, role, registration, phone, status, initials, avatar_color)
         VALUES (?, ?, ?, ?, ?, ?, 'ativo', ?, ?)`,
        client.id,
        client.name,
        client.email,
        client.role,
        client.registration,
        client.phone,
        client.initials,
        client.avatarColor
      );
    }
  }

  // 2. Máquinas (Impressoras 3D e Scanners fixos)
  const mockMachines = [
    {
      id: "mach-1",
      name: "Creality K1 Max",
      tag: "TAG #N01",
      type: "printer_3d_fdm",
      dimensions: "380x380mm",
      bench: "Bancada 01",
      room: "Oficina Principal",
      status: "ativa",
      lastMaintenance: "2026-09-15",
      nextMaintenanceDate: "2026-10-15"
    },
    {
      id: "mach-2",
      name: "Bambu Lab X1-Carbon",
      tag: "TAG #N02",
      type: "printer_3d_fdm",
      dimensions: "AMS 4-cores",
      bench: "Bancada 01",
      room: "Ala Precisão",
      status: "ativa",
      lastMaintenance: "2026-09-20",
      nextMaintenanceDate: "2026-10-20"
    },
    {
      id: "mach-3",
      name: "Creality Ender 3 S1",
      tag: "TAG #N03",
      type: "printer_3d_fdm",
      dimensions: "220x220mm",
      bench: "Bancada 02",
      room: "Oficina Principal",
      status: "manutencao",
      lastMaintenance: "2026-10-01",
      nextMaintenanceDate: "2026-10-12"
    },
    {
      id: "mach-4",
      name: "Elegoo Saturn 3 Ultra 12K",
      tag: "TAG #N04",
      type: "printer_3d_resin",
      dimensions: "218x123x260mm",
      bench: "Bancada Resina",
      room: "Sala Quimica",
      status: "ativa",
      lastMaintenance: "2026-09-25",
      nextMaintenanceDate: "2026-10-25"
    },
    {
      id: "mach-5",
      name: "Scanner 3D de Mesa Shining 3D",
      tag: "TAG #SC01",
      type: "scanner",
      dimensions: "Mesa rotatória",
      bench: "Bancada Digitalização",
      room: "Sala de Escaneamento",
      status: "ativa",
      lastMaintenance: "2026-09-10",
      nextMaintenanceDate: "2026-10-10"
    }
  ];

  for (const m of mockMachines) {
    const exists = query.get("SELECT id FROM machines WHERE tag = ?", m.tag);
    if (!exists) {
      query.run(
        `INSERT INTO machines (id, name, tag, type, dimensions, bench, room, status, last_maintenance, next_maintenance_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        m.id,
        m.name,
        m.tag,
        m.type,
        m.dimensions,
        m.bench,
        m.room,
        m.status,
        m.lastMaintenance,
        m.nextMaintenanceDate
      );
    }
  }

  // 3. Suprimentos (Impressão 3D)
  const mockSupplies = [
    { id: "sup-1", name: "PLA 1.75mm", type: "Termoplástico", color: "Marfim", balance: 8.5, status: "regular" },
    { id: "sup-2", name: "PLA 1.75mm", type: "Termoplástico", color: "Cinza Arquitetura", balance: 0.8, status: "abaixo" },
    { id: "sup-3", name: "PETG 1.75mm", type: "Termoplástico", color: "Translúcido", balance: 5.2, status: "regular" },
    { id: "sup-4", name: "Resina Standard 405nm", type: "Fotopolímero SLA", color: "Cinza", balance: 9.4, status: "regular" },
    { id: "sup-5", name: "Resina Bio Clara", type: "Fotopolímero SLA", color: "Incolor", balance: 0.4, status: "critico" },
  ];

  for (const s of mockSupplies) {
    const exists = query.get("SELECT id FROM supplies WHERE id = ?", s.id);
    if (!exists) {
      query.run(
        `INSERT INTO supplies (id, name, type, color, balance, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        s.id,
        s.name,
        s.type,
        s.color,
        s.balance,
        s.status
      );

      // Movimento de entrada inicial para rastreabilidade
      query.run(
        `INSERT INTO stock_movements (id, supply_id, type, quantity, lot, observations, created_by)
         VALUES (?, ?, 'entrada', ?, 'LOTE-INICIAL-2026', 'Carga inicial do estoque do laboratório', 'usr-admin-musarq')`,
        crypto.randomUUID(),
        s.id,
        s.balance
      );
    }
  }

  // 4. Equipamentos Portáteis (Apenas estes podem ser emprestados!)
  const mockEquipment = [
    {
      id: "eq-1",
      name: "Scanner 3D EinScan 5E Portátil",
      code: "#3841",
      category: "Digitalização Portátil",
      serial_number: "ES5E-99210",
      location: "Armário A - Gaveta 1",
      condition: "Excelente",
      accessories: "Cabo USB-C, Marcadores, Maleta",
      status: "atrasado"
    },
    {
      id: "eq-2",
      name: "Paquímetro Digital Mitutoyo 150mm",
      code: "#M4",
      category: "Metrologia",
      serial_number: "MIT-500-196",
      location: "Bancada de Ajustes",
      condition: "Calibrado",
      accessories: "Estojo original",
      status: "devolucao_hoje"
    },
    {
      id: "eq-3",
      name: "Câmera Térmica Flir C5",
      code: "#1892",
      category: "Termografia",
      serial_number: "FLIR-C5-8172",
      location: "Armário de Óptica",
      condition: "Bom estado",
      accessories: "Carregador, Alça de pulso",
      status: "em_campo"
    },
    {
      id: "eq-4",
      name: "Kit Lentes Macro Canon 100mm",
      code: "#OPT-02",
      category: "Fotografia/Óptica",
      serial_number: "CN-MACRO-100",
      location: "Armário de Óptica",
      condition: "Sem riscos",
      accessories: "Para-sol, Tampa frontal e traseira",
      status: "disponivel"
    },
    {
      id: "eq-5",
      name: "Mesa Digitalizadora Wacom Intuos Pro",
      code: "#TAB-01",
      category: "Modelagem Digital",
      serial_number: "WAC-PTH-660",
      location: "Armário B",
      condition: "Ótimo",
      accessories: "Caneta Pro Pen 2, Cabo USB",
      status: "disponivel"
    }
  ];

  for (const eq of mockEquipment) {
    const exists = query.get("SELECT id FROM portable_equipment WHERE code = ?", eq.code);
    if (!exists) {
      query.run(
        `INSERT INTO portable_equipment (id, name, code, category, serial_number, location, condition, accessories, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        eq.id,
        eq.name,
        eq.code,
        eq.category,
        eq.serial_number,
        eq.location,
        eq.condition,
        eq.accessories,
        eq.status
      );
    }
  }

  // 5. Empréstimos Ativos de Equipamentos
  const mockLoans = [
    {
      id: "loan-1",
      equipment_id: "eq-1",
      responsible_name: "Beatriz Albuquerque",
      due_date: "2026-10-09T18:00:00Z",
      status: "atrasado",
      notes: "Projeto de escaneamento de maquete arquitetônica"
    },
    {
      id: "loan-2",
      equipment_id: "eq-2",
      responsible_name: "Prof. Carlos Eduardo",
      due_date: "2026-10-10T17:30:00Z",
      status: "devolucao_hoje",
      notes: "Aferição de peças para aula de prototipagem"
    },
    {
      id: "loan-3",
      equipment_id: "eq-3",
      responsible_name: "Lucas Vasconcolos",
      due_date: "2026-10-14T12:00:00Z",
      status: "em_campo",
      notes: "Análise térmica de extrusão de filamento"
    }
  ];

  for (const l of mockLoans) {
    const exists = query.get("SELECT id FROM loans WHERE id = ?", l.id);
    if (!exists) {
      query.run(
        `INSERT INTO loans (id, equipment_id, responsible_name, due_date, status, notes, operator_id)
         VALUES (?, ?, ?, ?, ?, ?, 'usr-tech-musarq')`,
        l.id,
        l.equipment_id,
        l.responsible_name,
        l.due_date,
        l.status,
        l.notes
      );
    }
  }

  // 6. Manutenções registradas
  const mockMaintenances = [
    {
      id: "maint-1",
      machine_id: "mach-1",
      type: "preventiva",
      status: "concluida",
      date: "2026-09-15",
      description: "Lubrificação dos eixos lineares X/Y e limpeza do bico extrusor",
      parts: "Nenhuma peça substituída",
      cost: 0,
      observations: "Máquina operando perfeitamente."
    },
    {
      id: "maint-2",
      machine_id: "mach-3",
      type: "corretiva",
      status: "em_andamento",
      date: "2026-10-01",
      description: "Substituição do termistor da mesa aquecida e nivelamento manual",
      parts: "Termistor 100K NTC",
      cost: 45.0,
      observations: "Aguardando teste de aquecimento contínuo de 2 horas."
    }
  ];

  for (const m of mockMaintenances) {
    const exists = query.get("SELECT id FROM maintenances WHERE id = ?", m.id);
    if (!exists) {
      query.run(
        `INSERT INTO maintenances (id, machine_id, technician_id, type, status, date, description, parts, cost, observations)
         VALUES (?, ?, 'usr-tech-musarq', ?, ?, ?, ?, ?, ?, ?)`,
        m.id,
        m.machine_id,
        m.type,
        m.status,
        m.date,
        m.description,
        m.parts,
        m.cost,
        m.observations
      );
    }
  }

  // 7. Produções registradas
  const mockProductions = [
    {
      id: "prod-1",
      type: "impressao_3d",
      description: "Maquete Estrutural Pavilhão Sul",
      machine_id: "mach-1",
      technician_id: "usr-tech-musarq",
      client_name: "Beatriz Albuquerque",
      supply_id: "sup-1",
      supply_consumed: 0.35,
      duration_minutes: 240,
      status: "concluida",
      observations: "Preenchimento 15%, sem suportes necessários"
    },
    {
      id: "prod-2",
      type: "escaneamento",
      description: "Digitalização de Escultura em Argila",
      machine_id: "mach-5",
      technician_id: "usr-tech-musarq",
      client_name: "Mariana Lima",
      supply_id: null,
      supply_consumed: 0,
      duration_minutes: 45,
      status: "concluida",
      observations: "Malha gerada em OBJ/STL com alta resolução"
    }
  ];

  for (const p of mockProductions) {
    const exists = query.get("SELECT id FROM productions WHERE id = ?", p.id);
    if (!exists) {
      query.run(
        `INSERT INTO productions (id, type, description, machine_id, technician_id, client_name, supply_id, supply_consumed, duration_minutes, status, observations)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        p.id,
        p.type,
        p.description,
        p.machine_id,
        p.technician_id,
        p.client_name,
        p.supply_id,
        p.supply_consumed,
        p.duration_minutes,
        p.status,
        p.observations
      );
    }
  }

  console.log("Seed finalizado com sucesso!");
}

if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  seedDatabase();
}

