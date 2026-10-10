-- Schema do Banco de Dados SQLite para o labMU

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('administrador', 'tecnico', 'aluno', 'professor', 'cliente')),
    registration TEXT UNIQUE NOT NULL,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK(status IN ('ativo', 'inativo', 'pendente')),
    password_hash TEXT,
    avatar TEXT,
    initials TEXT,
    avatar_color TEXT DEFAULT 'bg-orange-200',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS machines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tag TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('printer_3d_fdm', 'printer_3d_resin', 'scanner')),
    dimensions TEXT,
    bench TEXT,
    room TEXT,
    status TEXT NOT NULL DEFAULT 'ativa' CHECK(status IN ('ativa', 'manutencao', 'inativa')),
    last_maintenance TEXT,
    next_maintenance_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS maintenances (
    id TEXT PRIMARY KEY,
    machine_id TEXT NOT NULL REFERENCES machines(id) ON DELETE RESTRICT,
    technician_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK(type IN ('preventiva', 'corretiva')),
    status TEXT NOT NULL DEFAULT 'concluida' CHECK(status IN ('agendada', 'em_andamento', 'concluida', 'cancelada')),
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    parts TEXT,
    cost REAL DEFAULT 0,
    observations TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS supplies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT NOT NULL,
    balance REAL NOT NULL DEFAULT 0,
    minimum_balance REAL NOT NULL DEFAULT 1.0,
    status TEXT NOT NULL DEFAULT 'regular' CHECK(status IN ('regular', 'abaixo', 'critico')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY,
    supply_id TEXT NOT NULL REFERENCES supplies(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK(type IN ('entrada', 'saida_producao', 'ajuste', 'estorno')),
    quantity REAL NOT NULL,
    unit TEXT NOT NULL DEFAULT 'kg',
    lot TEXT,
    observations TEXT,
    reference_id TEXT,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS portable_equipment (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    category TEXT,
    serial_number TEXT,
    location TEXT,
    condition TEXT,
    accessories TEXT,
    status TEXT NOT NULL DEFAULT 'disponivel' CHECK(status IN ('disponivel', 'em_campo', 'atrasado', 'devolucao_hoje', 'manutencao', 'inativo')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS loans (
    id TEXT PRIMARY KEY,
    equipment_id TEXT NOT NULL REFERENCES portable_equipment(id) ON DELETE RESTRICT,
    responsible_name TEXT NOT NULL,
    responsible_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    checkout_date TEXT NOT NULL DEFAULT (datetime('now')),
    due_date TEXT NOT NULL,
    return_date TEXT,
    status TEXT NOT NULL DEFAULT 'em_campo' CHECK(status IN ('em_campo', 'atrasado', 'devolucao_hoje', 'devolvido')),
    operator_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS productions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('impressao_3d', 'escaneamento')),
    description TEXT NOT NULL,
    machine_id TEXT NOT NULL REFERENCES machines(id) ON DELETE RESTRICT,
    technician_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    client_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    client_name TEXT,
    supply_id TEXT REFERENCES supplies(id) ON DELETE SET NULL,
    supply_consumed REAL NOT NULL DEFAULT 0,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'concluida' CHECK(status IN ('em_andamento', 'concluida', 'cancelada')),
    observations TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_machines_tag ON machines(tag);
CREATE INDEX IF NOT EXISTS idx_maintenances_machine ON maintenances(machine_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_supply ON stock_movements(supply_id);
CREATE INDEX IF NOT EXISTS idx_equipment_code ON portable_equipment(code);
CREATE INDEX IF NOT EXISTS idx_loans_equipment ON loans(equipment_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_productions_machine ON productions(machine_id);
CREATE INDEX IF NOT EXISTS idx_productions_technician ON productions(technician_id);

