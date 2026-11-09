import { AppError } from "../middlewares/errorHandler.js";

// Garante que um valor de enum vindo do cliente está entre os permitidos.
// Sem isso, o valor chegaria ao CHECK do banco e a resposta não diria qual campo está errado.
export function assertAllowed<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string
): asserts value is T {
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    throw new AppError(`Valor inválido para o campo "${field}".`, 400, "INVALID_FIELD_VALUE");
  }
}
