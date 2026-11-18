import { app } from "./app.js";

// Vercel detecta este arquivo como entrypoint Express e executa o app como Function.
// Não iniciar listener nem executar seed/bootstrap durante invocações serverless.
export default app;
