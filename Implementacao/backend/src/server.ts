import { app } from "./app.js";
import { env } from "./config/env.js";
import { initializeData } from "./bootstrap.js";

initializeData();

app.listen(env.PORT, () => {
  console.log(`
=====================================================
  🚀 labMU - Backend Server Rodando com Sucesso!
=====================================================
  Porta: http://localhost:${env.PORT}
  Health check: http://localhost:${env.PORT}/api/health
  
  👤 Administrador Padrão:
     E-mail: ${env.DEFAULT_ADMIN_EMAIL}
     Senha:  ${env.DEFAULT_ADMIN_PASSWORD}

  🔧 Técnico Padrão:
     E-mail: ${env.DEFAULT_TECH_EMAIL}
     Senha:  ${env.DEFAULT_TECH_PASSWORD}
=====================================================
  `);
});

