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
  console.error("[Error Handler]", err);

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

  // Valor fora do domínio permitido pelo banco (ex.: perfil ou tipo inexistente)
  if (String(err?.message).includes("CHECK constraint failed")) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Um dos valores informados não é permitido.",
      },
    });
    return;
  }

  // SQLite constraints error
  if (err?.code === "SQLITE_CONSTRAINT" || String(err).includes("UNIQUE constraint failed")) {
    res.status(409).json({
      error: {
        code: "CONFLICT",
        message: "Registro conflitante: já existe um item cadastrado com este identificador único.",
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

