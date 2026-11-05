import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

// Cada execução usa um banco SQLite novo, separado do banco de desenvolvimento
const dbFile = process.env.E2E_DB_FILE ?? path.resolve(__dirname, ".tmp", `e2e-${Date.now()}.sqlite`);
process.env.E2E_DB_FILE = dbFile;

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
      command: "npx tsx src/server.ts",
      cwd: backendDir,
      url: "http://localhost:3001/api/health",
      reuseExistingServer: false,
      timeout: 90_000,
      env: { PORT: "3001", DATABASE_FILE: dbFile, NODE_ENV: "development" },
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
