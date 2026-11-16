-- Initial PostgreSQL schema for labMU.
-- Compatibility-first migration: preserve TEXT IDs, status values and date/time
-- representation from SQLite. SQL date/time expressions will be adapted in the
-- application layer in a separate change.

CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('administrador', 'tecnico', 'aluno', 'professor', 'cliente')),
  registration TEXT NOT NULL UNIQUE,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pendente')),
  password_hash TEXT,
  security_question TEXT,
  security_answer TEXT,
  avatar TEXT,
  initials TEXT,
  avatar_color TEXT DEFAULT 'bg-orange-200',
  created_at TEXT NOT NULL DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS')
);

CREATE TABLE IF NOT EXISTS public.machines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tag TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('printer_3d_fdm', 'printer_3d_resin', 'scanner')),
  dimensions TEXT,
  bench TEXT,
  room TEXT,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'manutencao', 'inativa')),
  last_maintenance TEXT,
  next_maintenance_date TEXT,
  created_at TEXT NOT NULL DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS')
);

CREATE TABLE IF NOT EXISTS public.maintenances (
  id TEXT PRIMARY KEY,
  machine_id TEXT NOT NULL REFERENCES public.machines(id) ON DELETE RESTRICT,
  technician_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('preventiva', 'corretiva')),
  status TEXT NOT NULL DEFAULT 'concluida' CHECK (status IN ('agendada', 'em_andamento', 'concluida', 'cancelada')),
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  parts TEXT,
  cost DOUBLE PRECISION DEFAULT 0,
  observations TEXT,
  created_at TEXT NOT NULL DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS')
);

CREATE TABLE IF NOT EXISTS public.supplies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT NOT NULL,
  balance DOUBLE PRECISION NOT NULL DEFAULT 0,
  minimum_balance DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  status TEXT NOT NULL DEFAULT 'regular' CHECK (status IN ('regular', 'abaixo', 'critico')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS')
);

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id TEXT PRIMARY KEY,
  supply_id TEXT NOT NULL REFERENCES public.supplies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida_producao', 'ajuste', 'estorno')),
  quantity DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  lot TEXT,
  observations TEXT,
  reference_id TEXT,
  created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS')
);

CREATE TABLE IF NOT EXISTS public.portable_equipment (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  category TEXT,
  serial_number TEXT,
  location TEXT,
  condition TEXT,
  accessories TEXT,
  status TEXT NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'em_campo', 'atrasado', 'devolucao_hoje', 'manutencao', 'inativo')),
  created_at TEXT NOT NULL DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS')
);

CREATE TABLE IF NOT EXISTS public.loans (
  id TEXT PRIMARY KEY,
  equipment_id TEXT NOT NULL REFERENCES public.portable_equipment(id) ON DELETE RESTRICT,
  responsible_name TEXT NOT NULL,
  responsible_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  checkout_date TEXT NOT NULL DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS'),
  due_date TEXT NOT NULL,
  return_date TEXT,
  status TEXT NOT NULL DEFAULT 'em_campo' CHECK (status IN ('em_campo', 'atrasado', 'devolucao_hoje', 'devolvido')),
  operator_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS')
);

CREATE TABLE IF NOT EXISTS public.productions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('impressao_3d', 'escaneamento')),
  description TEXT NOT NULL,
  machine_id TEXT NOT NULL REFERENCES public.machines(id) ON DELETE RESTRICT,
  technician_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  client_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  client_name TEXT,
  supply_id TEXT REFERENCES public.supplies(id) ON DELETE SET NULL,
  supply_consumed DOUBLE PRECISION NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'concluida' CHECK (status IN ('em_andamento', 'concluida', 'cancelada')),
  observations TEXT,
  created_at TEXT NOT NULL DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS')
);

CREATE TABLE IF NOT EXISTS public.revoked_tokens (
  jti TEXT PRIMARY KEY,
  expires_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_maintenances_machine ON public.maintenances(machine_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_supply ON public.stock_movements(supply_id);
CREATE INDEX IF NOT EXISTS idx_loans_equipment ON public.loans(equipment_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);
CREATE INDEX IF NOT EXISTS idx_productions_machine ON public.productions(machine_id);
CREATE INDEX IF NOT EXISTS idx_productions_technician ON public.productions(technician_id);
CREATE INDEX IF NOT EXISTS idx_productions_created ON public.productions(created_at);
CREATE INDEX IF NOT EXISTS idx_maintenances_date ON public.maintenances(date);
CREATE INDEX IF NOT EXISTS idx_loans_checkout ON public.loans(checkout_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON public.stock_movements(created_at);

-- The backend connects with its private database credential. No direct table
-- access is granted to anonymous/authenticated API clients by these policies.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portable_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revoked_tokens ENABLE ROW LEVEL SECURITY;
