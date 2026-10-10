import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { query } from "../database/connection.js";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: "administrador" | "tecnico" | "aluno" | "professor" | "cliente";
  registration: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Token de autenticação não fornecido.",
      },
    });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      sub: string;
      email: string;
      role: AuthenticatedUser["role"];
    };

    const user = query.get<any>(
      "SELECT id, name, email, role, registration, status FROM users WHERE id = ?",
      payload.sub
    );

    if (!user || user.status !== "ativo") {
      res.status(401).json({
        error: {
          code: "USER_INACTIVE_OR_NOT_FOUND",
          message: "Usuário não encontrado ou inativo.",
        },
      });
      return;
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      registration: user.registration,
    };

    next();
  } catch (error) {
    res.status(401).json({
      error: {
        code: "INVALID_TOKEN",
        message: "Sessão inválida ou expirada. Faça login novamente.",
      },
    });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Autenticação requerida.",
        },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: `Acesso negado para o perfil ${req.user.role}. Permissão requerida: ${roles.join(", ")}.`,
        },
      });
      return;
    }

    next();
  };
};

