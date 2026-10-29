import { env } from "./config/env.js";
import { seedDatabase } from "./database/seed.js";

// Cria dados iniciais (incluindo contas padrão). Em produção não há contas com senha conhecida.
export function initializeData(): void {
  if (env.NODE_ENV === "production") {
    return;
  }

  seedDatabase();
}
