import express from "express";
import cors from "cors";
import { authRouter } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { machinesRouter } from "./modules/machines/machines.routes.js";
import { maintenanceRouter } from "./modules/maintenance/maintenance.routes.js";
import { suppliesRouter } from "./modules/supplies/supplies.routes.js";
import { equipmentRouter } from "./modules/equipment/equipment.routes.js";
import { loansRouter } from "./modules/loans/loans.routes.js";
import { productionRouter } from "./modules/production/production.routes.js";
import { reportsRouter } from "./modules/reports/reports.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export const app = express();

// Middlewares globais
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", system: "labMU API", timestamp: new Date().toISOString() });
});

// Rotas da API com prefixo /api e fallbacks diretos
app.use("/api/auth", authRouter);
app.use("/auth", authRouter);

app.use("/api/users", usersRouter);
app.use("/api/machines", machinesRouter);
app.use("/api/maintenances", maintenanceRouter);
app.use("/api/supplies", suppliesRouter);
app.use("/api/stock", suppliesRouter);
app.use("/api/equipment", equipmentRouter);
app.use("/api/loans", loansRouter);
app.use("/api/productions", productionRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/dashboard", dashboardRouter);

// Rota 404
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "A rota solicitada não foi encontrada.",
    },
  });
});

// Tratamento centralizado de erros
app.use(errorHandler);

