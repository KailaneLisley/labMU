import bcrypt from "bcryptjs";
import { env } from "./config/env.js";
import { query } from "./database/connection.js";
import { seedDatabase } from "./database/seed.js";

// Cria dados iniciais. Em desenvolvimento usa as contas padrão do seed.
// Em produção não há contas com senha conhecida: o primeiro administrador vem de
// INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD e só é criado se nenhum administrador existir.
export function initializeData(): void {
  if (env.NODE_ENV === "production") {
    createInitialAdminIfMissing();
    return;
  }

  seedDatabase();
}

function createInitialAdminIfMissing(): void {
  const admins = query.get<{ total: number }>("SELECT COUNT(*) AS total FROM users WHERE role = 'administrador'");
  if ((admins?.total ?? 0) > 0) return;

  if (!env.INITIAL_ADMIN_EMAIL || !env.INITIAL_ADMIN_PASSWORD) {
    console.warn(
      "[Bootstrap] Nenhum administrador cadastrado. Defina INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD para criar o primeiro acesso."
    );
    return;
  }

  const password = env.INITIAL_ADMIN_PASSWORD;
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new Error("INITIAL_ADMIN_PASSWORD deve ter ao menos 8 caracteres, com letras e números.");
  }

  query.run(
    `INSERT INTO users (id, name, email, role, registration, status, password_hash, initials, avatar_color)
     VALUES (?, ?, ?, 'administrador', ?, 'ativo', ?, 'AD', 'bg-red-200')`,
    "usr-admin-inicial",
    "Administrador",
    env.INITIAL_ADMIN_EMAIL,
    "000001",
    bcrypt.hashSync(password, 10)
  );
  console.log(`[Bootstrap] Administrador inicial criado: ${env.INITIAL_ADMIN_EMAIL}`);
}
