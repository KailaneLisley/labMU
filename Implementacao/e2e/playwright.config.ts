import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

// Os testes ponta a ponta usam um PostgreSQL descartável, nunca o banco de desenvolvimento ou produção.
// Na CI, o job e2e provê E2E_DATABASE_URL (serviço postgres:17). Localmente, aponte para um banco vazio
// com o schema de supabase/migrations/202611160001_initial_schema.sql aplicado.
const e2eDatabaseUrl = process.env.E2E_DATABASE_URL;
if (!e2eDatabaseUrl) {
  throw new Error("Defina E2E_DATABASE_URL com um PostgreSQL descartável para executar os testes e2e.");
}

const backendDir = path.resolve(__dirname, "../backend");
const frontendDir = path.resolve(__dirname, "../frontend/perfil_adm");

export default defineConfig({
  testDir: "tests",
  // Todos os testes compartilham um banco: rodam em sequência
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      // localServer.ts abre a porta e aplica o seed de desenvolvimento (src/server.ts é só o export serverless)
      command: "npx tsx src/localServer.ts",
      cwd: backendDir,
      url: "http://localhost:3001/api/health",
      reuseExistingServer: false,
      timeout: 90_000,
      env: {
        PORT: "3001",
        NODE_ENV: "development",
        DATABASE_URL: e2eDatabaseUrl,
        PGSSL: process.env.E2E_PGSSL ?? "disable",
      },
    },
    {
      command: "npx vite --port 3100 --strictPort --host 127.0.0.1",
      cwd: frontendDir,
      url: "http://localhost:3100/login",
      reuseExistingServer: false,
      timeout: 90_000,
      env: { BROWSER: "none" },
    },
  ],
});
