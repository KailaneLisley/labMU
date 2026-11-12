import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Segredo só para desenvolvimento local. Em produção, JWT_SECRET é obrigatório.
const DEV_JWT_SECRET = "labmu_dev_only_jwt_secret_nao_usar_em_producao";

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET precisa ser definido em produção.");
  }

  console.warn("[env] JWT_SECRET não definido; usando segredo de desenvolvimento.");
  return DEV_JWT_SECRET;
}

// Aceita número de proxies (0, 1, 2...), "true" (= 1) ou "false" (= 0). Valor inválido falha no boot,
// em vez de desligar a proteção de IP em silêncio.
function parseTrustProxy(raw: string | undefined, isProduction: boolean): number {
  const value = (raw ?? "").trim().toLowerCase();
  if (value === "") return isProduction ? 1 : 0;
  if (value === "true") return 1;
  if (value === "false") return 0;
  const hops = Number(value);
  if (!Number.isInteger(hops) || hops < 0) {
    throw new Error(`TRUST_PROXY inválido: "${raw}". Use um inteiro >= 0, "true" ou "false".`);
  }
  return hops;
}

export const env = {
  PORT: Number(process.env.PORT) || 3001,
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_SECRET: resolveJwtSecret(),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  // Origens do frontend autorizadas a chamar a API (separadas por vírgula)
  CORS_ORIGINS: (process.env.CORS_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  // Quantos proxies à frente da API (ex.: Render = 1). Sem isso, todos os clientes aparecem
  // com o IP do proxy e compartilham o limite de tentativas de login.
  TRUST_PROXY: parseTrustProxy(process.env.TRUST_PROXY, process.env.NODE_ENV === "production"),
  DATABASE_FILE: process.env.DATABASE_FILE || "./data/labmu.sqlite",
  DEFAULT_ADMIN_EMAIL: (process.env.DEFAULT_ADMIN_EMAIL || "admin.musarq@unicap.br").toLowerCase(),
  DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123",
  DEFAULT_TECH_EMAIL: (process.env.DEFAULT_TECH_EMAIL || "tecnico.musarq@unicap.br").toLowerCase(),
  DEFAULT_TECH_PASSWORD: process.env.DEFAULT_TECH_PASSWORD || "Tecnico@123",
  // Primeiro administrador em produção (usado só se ainda não existir nenhum administrador)
  INITIAL_ADMIN_EMAIL: (process.env.INITIAL_ADMIN_EMAIL || "").trim().toLowerCase(),
  INITIAL_ADMIN_PASSWORD: process.env.INITIAL_ADMIN_PASSWORD || "",
};
