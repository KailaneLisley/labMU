import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode = 400, code = "BAD_REQUEST") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (process.env.NODE_ENV !== "test") {
    console.error("[Error Handler]", err);
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Corpo JSON malformado enviado pelo cliente
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "O corpo da requisição não é um JSON válido.",
      },
    });
    return;
  }

  // Valor fora do domínio permitido pelo banco (PostgreSQL CHECK / SQLite legacy).
  if (err?.code === "23514" || String(err?.message).includes("CHECK constraint failed")) {
    const constraint = String(err?.constraint || err?.message || "");
    const field = err?.column || constraint.match(/_(role|status|type)_check$/)?.[1];
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: field
          ? `Valor inválido para o campo "${field}".`
          : "Um dos valores informados não é permitido.",
      },
    });
    return;
  }

  // Erros de cliente lançados pelo próprio Express (ex.: corpo acima do limite → 413)
  if (typeof err?.status === "number" && err.status >= 400 && err.status < 500) {
    const tooLarge = err.type === "entity.too.large";
    res.status(err.status).json({
      error: {
        code: tooLarge ? "PAYLOAD_TOO_LARGE" : "BAD_REQUEST",
        message: tooLarge ? "O corpo da requisição é grande demais." : "Requisição inválida.",
      },
    });
    return;
  }

  // SQLite constraints error
  if (err?.code === "23505" || err?.code === "SQLITE_CONSTRAINT" || String(err).includes("UNIQUE constraint failed")) {
    res.status(409).json({
      error: {
        code: "CONFLICT",
        message: "Registro conflitante: já existe um item cadastrado com este identificador único.",
      },
    });
    return;
  }

  // Referência inexistente ou campo obrigatório ausente no PostgreSQL.
  if (err?.code === "23503" || err?.code === "23502") {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Um dos valores informados é inválido ou está ausente.",
      },
    });
    return;
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Ocorreu um erro interno no servidor.",
    },
  });
};

