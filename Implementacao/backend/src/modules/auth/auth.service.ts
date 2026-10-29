import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { query } from "../../database/connection.js";
import { env } from "../../config/env.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { isLoginBlocked, recordLoginFailure, resetAccountFailures } from "./loginAttempts.js";
import { isTokenRevoked, revokeToken } from "./tokenRevocation.js";

// Perfis que acessam o sistema; Aluno, Professor e Cliente não têm login
const LOGIN_ROLES = ["administrador", "tecnico"];

function signSession(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, jti: crypto.randomUUID() },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as any }
  );
}

// Pergunta usada para contas que não são técnicos com pergunta cadastrada
const DECOY_SECURITY_QUESTION = "Qual o nome do seu primeiro animal de estimação?";

// A resposta é normalizada (sem espaços nas pontas, minúscula) e guardada com hash, como a senha.
function normalizeSecurityAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

function hashSecurityAnswer(answer: string): string {
  return bcrypt.hashSync(normalizeSecurityAnswer(answer), 10);
}

// Contas antigas guardam a resposta em texto puro: são aceitas e migradas para hash no primeiro uso.
function matchesSecurityAnswer(userId: string, stored: string | null, answer: string): boolean {
  if (!stored) return false;

  if (stored.startsWith("$2")) {
    return bcrypt.compareSync(normalizeSecurityAnswer(answer), stored);
  }

  const matches = stored.trim().toLowerCase() === normalizeSecurityAnswer(answer);
  if (matches) {
    query.run("UPDATE users SET security_answer = ? WHERE id = ?", hashSecurityAnswer(answer), userId);
  }
  return matches;
}

export class AuthService {
  static login(email: string, password: string, requestedRole?: string, ip = "desconhecido") {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      throw new AppError("E-mail e senha são obrigatórios.", 400, "MISSING_CREDENTIALS");
    }

    if (isLoginBlocked(normalizedEmail, ip)) {
      throw new AppError(
        "Muitas tentativas de login. Aguarde 15 minutos e tente novamente.",
        429,
        "TOO_MANY_ATTEMPTS"
      );
    }

    const user = query.get<any>(
      `SELECT id, name, email, role, registration, phone, status, password_hash, avatar, initials, avatar_color
       FROM users WHERE email = ?`,
      normalizedEmail
    );

    const isMatch = user?.password_hash ? bcrypt.compareSync(password, user.password_hash) : false;
    if (!isMatch) {
      recordLoginFailure(normalizedEmail, ip);
      throw new AppError("E-mail ou senha incorretos.", 401, "INVALID_CREDENTIALS");
    }

    // Só depois de confirmar a senha, para não revelar o status da conta a quem não a conhece
    if (!LOGIN_ROLES.includes(user.role)) {
      throw new AppError("Este perfil não possui acesso ao sistema.", 403, "ROLE_NOT_ALLOWED");
    }

    if (user.status !== "ativo") {
      throw new AppError("Esta conta está inativa ou pendente de ativação.", 403, "ACCOUNT_INACTIVE");
    }

    if (requestedRole && user.role !== requestedRole) {
      const friendlyRole = requestedRole === "administrador" ? "Administrador" : "Técnico";
      throw new AppError(
        `Este usuário não possui o perfil de ${friendlyRole}.`,
        403,
        "INVALID_ROLE"
      );
    }

    resetAccountFailures(normalizedEmail);

    const token = signSession(user);

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
    securityQuestion?: string;
    securityAnswer?: string;
  }) {
    const name = data.name?.trim().replace(/\s+/g, " ");
    const email = data.email?.trim().toLowerCase();
    const registration = data.registration?.trim();
    const phone = data.phone?.trim() || "";
    const password = data.password;
    const securityQuestion = data.securityQuestion?.trim() || "";
    const securityAnswer = data.securityAnswer?.trim() || "";

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

    if (!securityQuestion || securityQuestion.length < 4) {
      throw new AppError("Escolha ou defina uma pergunta de segurança.", 400, "INVALID_SECURITY_QUESTION");
    }

    if (!securityAnswer || securityAnswer.length < 2) {
      throw new AppError("Informe a resposta para sua pergunta de segurança.", 400, "INVALID_SECURITY_ANSWER");
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
      `INSERT INTO users (id, name, email, role, registration, phone, status, password_hash, security_question, security_answer, initials, avatar_color)
       VALUES (?, ?, ?, 'tecnico', ?, ?, 'ativo', ?, ?, ?, ?, 'bg-orange-200')`,
      userId,
      name,
      email,
      registration,
      phone,
      passwordHash,
      securityQuestion,
      hashSecurityAnswer(securityAnswer),
      initials
    );

    const token = signSession({ id: userId, email, role: "tecnico" });

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

  static verifyForgotEmail(email: string) {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new AppError("Informe seu e-mail institucional.", 400, "MISSING_EMAIL");
    }

    const user = query.get<any>(
      `SELECT id, name, email, role, status, security_question FROM users WHERE email = ?`,
      normalizedEmail
    );

    // Só técnicos com pergunta cadastrada recebem a pergunta real. Para as demais contas,
    // a resposta é idêntica à de um e-mail inexistente, para não revelar quais contas existem.
    if (!user || user.role !== "tecnico" || !user.security_question) {
      return { email: normalizedEmail, question: DECOY_SECURITY_QUESTION };
    }

    return {
      email: user.email,
      question: user.security_question,
    };
  }

  static verifyForgotAnswer(email: string, answer: string) {
    const normalizedEmail = email?.trim().toLowerCase();
    const cleanAnswer = answer?.trim();

    if (!normalizedEmail || !cleanAnswer) {
      throw new AppError("E-mail e resposta são obrigatórios.", 400, "MISSING_FIELDS");
    }

    const user = query.get<any>(
      `SELECT id, email, role, security_answer FROM users WHERE email = ?`,
      normalizedEmail
    );

    // Mesma resposta para conta inexistente, de administrador ou de aluno (ver verifyForgotEmail)
    const isTechnician = user?.role === "tecnico";
    if (!isTechnician || !matchesSecurityAnswer(user.id, user.security_answer, cleanAnswer)) {
      throw new AppError("Resposta de segurança incorreta. Tente novamente.", 400, "INCORRECT_ANSWER");
    }

    const resetToken = jwt.sign(
      { sub: user.id, email: user.email, purpose: "password_reset", jti: crypto.randomUUID() },
      env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return {
      verified: true,
      resetToken,
    };
  }

  static resetPassword(data: { email: string; resetToken: string; newPassword: string }) {
    const normalizedEmail = data.email?.trim().toLowerCase();
    const resetToken = data.resetToken;
    const newPassword = data.newPassword;

    if (!normalizedEmail || !resetToken || !newPassword) {
      throw new AppError("Todos os campos são obrigatórios.", 400, "MISSING_FIELDS");
    }

    let decoded: any;
    try {
      decoded = jwt.verify(resetToken, env.JWT_SECRET);
    } catch {
      throw new AppError("O link ou sessão de recuperação expirou. Inicie o processo novamente.", 401, "INVALID_TOKEN");
    }

    if (decoded.purpose !== "password_reset" || decoded.email !== normalizedEmail) {
      throw new AppError("Token de recuperação inválido para este e-mail.", 401, "INVALID_TOKEN");
    }

    // Uso único: o token deixa de valer depois da primeira redefinição
    if (!decoded.jti || isTokenRevoked(decoded.jti)) {
      throw new AppError("Este link de recuperação já foi utilizado. Inicie o processo novamente.", 401, "INVALID_TOKEN");
    }

    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      throw new AppError(
        "A nova senha deve conter ao menos 8 caracteres, com ao menos uma letra e um número.",
        400,
        "WEAK_PASSWORD"
      );
    }

    const user = query.get<any>("SELECT id, role FROM users WHERE email = ?", normalizedEmail);
    if (!user) {
      throw new AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
    }

    if (user.role !== "tecnico") {
      throw new AppError("Ação restrita a contas de Técnico.", 403, "UNAUTHORIZED_ROLE");
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    query.run("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?", passwordHash, user.id);
    revokeToken(decoded.jti, decoded.exp);

    return {
      message: "Senha redefinida com sucesso! Você já pode entrar com sua nova senha.",
    };
  }

  static logout(session: { jti: string; exp: number }) {
    revokeToken(session.jti, session.exp);
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

