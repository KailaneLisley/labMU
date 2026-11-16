import { initializeData } from "../bootstrap.js";
import { postgres } from "./postgres.js";

try {
  await initializeData();
  console.log("Bootstrap administrativo concluído.");
} catch (error) {
  console.error("Falha no bootstrap administrativo:", error);
  process.exitCode = 1;
} finally {
  await postgres.close();
}
