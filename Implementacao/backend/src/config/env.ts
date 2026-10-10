import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const env = {
  PORT: Number(process.env.PORT) || 3001,
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_SECRET: process.env.JWT_SECRET || "labmu_super_secret_jwt_key_2026_musarq",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  DATABASE_FILE: process.env.DATABASE_FILE || "./data/labmu.sqlite",
  DEFAULT_ADMIN_EMAIL: (process.env.DEFAULT_ADMIN_EMAIL || "admin.musarq@unicap.br").toLowerCase(),
  DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123",
  DEFAULT_TECH_EMAIL: (process.env.DEFAULT_TECH_EMAIL || "tecnico.musarq@unicap.br").toLowerCase(),
  DEFAULT_TECH_PASSWORD: process.env.DEFAULT_TECH_PASSWORD || "Tecnico@123",
};

