import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { query } from "../../database/connection.js";
import { env } from "../../config/env.js";
import { AppError } from "../../middlewares/errorHandler.js";

export class AuthService {
  static login(email: string, password: string, requestedRole?: string) {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      throw new AppError("E-mail e senha são obrigatórios.", 400, "MISSING_CREDENTIALS");
    }

    const user = query.get<any>(
      `SELECT id, name, email, role, registration, phone, status, password_hash, avatar, initials, avatar_color
       FROM users WHERE email = ?`,
      normalizedEmail
    );

    if (!user || !user.password_hash) {
      throw new AppError("E-mail ou senha incorretos.", 401, "INVALID_CREDENTIALS");
    }

    if (user.status !== "ativo") {
      throw new AppError("Esta conta está inativa ou pendente de ativação.", 403, "ACCOUNT_INACTIVE");
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      throw new AppError("E-mail ou senha incorretos.", 401, "INVALID_CREDENTIALS");
    }

    if (requestedRole && user.role !== requestedRole) {
      const friendlyRole = requestedRole === "administrador" ? "Administrador" : "Técnico";
      throw new AppError(
        `Este usuário não possui o perfil de ${friendlyRole}.`,
        403,
        "INVALID_ROLE"
      );
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        registration: user.registration,
        phone: user.phone || "",
        status: user.status,
        avatar: user.avatar || "",
        initials: user.initials || user.name.slice(0, 2).toUpperCase(),
        avatarColor: user.avatar_color || "bg-orange-200",
      },
    };
  }

  static register(data: {
    name: string;
    email: string;
    registration: string;
    phone?: string;
    password: string;
  }) {
    const name = data.name?.trim().replace(/\s+/g, " ");
    const email = data.email?.trim().toLowerCase();
    const registration = data.registration?.trim();
    const phone = data.phone?.trim() || "";
    const password = data.password;

    if (!name || name.length < 3) {
      throw new AppError("Informe seu nome completo.", 400, "INVALID_NAME");
    }

    if (!email || !/^[^\s@]+@unicap\.br$/i.test(email)) {
      throw new AppError(
        "Use um e-mail institucional válido (@unicap.br).",
        400,
        "INVALID_EMAIL"
      );
    }

    if (!registration || registration.length < 3) {
      throw new AppError("Informe uma matrícula válida.", 400, "INVALID_REGISTRATION");
    }

    if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      throw new AppError(
        "A senha deve conter ao menos 8 caracteres, com ao menos uma letra e um número.",
        400,
        "WEAK_PASSWORD"
      );
    }

    const existingEmail = query.get("SELECT id FROM users WHERE email = ?", email);
    if (existingEmail) {
      throw new AppError("Este e-mail já possui um cadastro ativo.", 409, "EMAIL_EXISTS");
    }

    const existingReg = query.get("SELECT id FROM users WHERE registration = ?", registration);
    if (existingReg) {
      throw new AppError("Esta matrícula já está vinculada a outro usuário.", 409, "REGISTRATION_EXISTS");
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const userId = `usr-tech-${crypto.randomUUID()}`;
    const initials = name
      .split(/\s+/)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();

    query.run(
      `INSERT INTO users (id, name, email, role, registration, phone, status, password_hash, initials, avatar_color)
       VALUES (?, ?, ?, 'tecnico', ?, ?, 'ativo', ?, ?, 'bg-orange-200')`,
      userId,
      name,
      email,
      registration,
      phone,
      passwordHash,
      initials
    );

    const token = jwt.sign(
      { sub: userId, email, role: "tecnico" },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    return {
      token,
      user: {
        id: userId,
        name,
        email,
        role: "tecnico" as const,
        registration,
        phone,
        status: "ativo" as const,
        initials,
        avatar: "",
        avatarColor: "bg-orange-200",
      },
    };
  }

  static getMe(userId: string) {
    const user = query.get<any>(
      `SELECT id, name, email, role, registration, phone, status, avatar, initials, avatar_color, created_at, updated_at
       FROM users WHERE id = ?`,
      userId
    );

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      registration: user.registration,
      phone: user.phone || "",
      status: user.status,
      avatar: user.avatar || "",
      initials: user.initials || user.name.slice(0, 2).toUpperCase(),
      avatarColor: user.avatar_color || "bg-orange-200",
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }
}

