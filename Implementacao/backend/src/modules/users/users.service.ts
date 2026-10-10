import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { query } from "../../database/connection.js";
import { AppError } from "../../middlewares/errorHandler.js";

export class UsersService {
  static listUsers(filters: {
    q?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    let sql = `SELECT id, name, email, role, registration, phone, status, avatar, initials, avatar_color, created_at, updated_at
               FROM users WHERE 1=1`;
    const params: any[] = [];

    if (filters.q) {
      const search = `%${filters.q.trim().toLowerCase()}%`;
      sql += ` AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR registration LIKE ?)`;
      params.push(search, search, search);
    }

    if (filters.role && filters.role !== "all") {
      sql += ` AND role = ?`;
      params.push(filters.role);
    }

    if (filters.status && filters.status !== "all") {
      sql += ` AND status = ?`;
      params.push(filters.status);
    }

    sql += ` ORDER BY created_at DESC`;

    const allRecords = query.all(sql, ...params);
    const total = allRecords.length;

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 50);
    const startIndex = (page - 1) * limit;
    const paginated = allRecords.slice(startIndex, startIndex + limit);

    return {
      data: paginated.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        registration: u.registration,
        phone: u.phone || "",
        status: u.status,
        avatar: u.avatar || "",
        initials: u.initials || u.name.slice(0, 2).toUpperCase(),
        avatarColor: u.avatar_color || "bg-orange-200",
        createdAt: u.created_at,
        updatedAt: u.updated_at,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static getUserById(id: string) {
    const u = query.get<any>(
      `SELECT id, name, email, role, registration, phone, status, avatar, initials, avatar_color, created_at, updated_at
       FROM users WHERE id = ?`,
      id
    );

    if (!u) {
      throw new AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
    }

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      registration: u.registration,
      phone: u.phone || "",
      status: u.status,
      avatar: u.avatar || "",
      initials: u.initials || u.name.slice(0, 2).toUpperCase(),
      avatarColor: u.avatar_color || "bg-orange-200",
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    };
  }

  static createUser(data: {
    name: string;
    email: string;
    role: "tecnico" | "aluno" | "professor" | "administrador";
    registration: string;
    phone?: string;
    status?: "ativo" | "inativo" | "pendente";
    password?: string;
  }) {
    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();
    const registration = data.registration.trim();

    if (!name || !email || !registration) {
      throw new AppError("Nome, e-mail e matrícula são obrigatórios.", 400);
    }

    const existingEmail = query.get("SELECT id FROM users WHERE email = ?", email);
    if (existingEmail) {
      throw new AppError("Já existe um usuário cadastrado com este e-mail.", 409, "EMAIL_EXISTS");
    }

    const existingReg = query.get("SELECT id FROM users WHERE registration = ?", registration);
    if (existingReg) {
      throw new AppError("Esta matrícula já está vinculada a outro usuário.", 409, "REGISTRATION_EXISTS");
    }

    const id = `usr-${data.role}-${crypto.randomUUID()}`;
    const initials = name.split(/\s+/).slice(0, 2).map((n) => n[0]).join("").toUpperCase();

    let passwordHash: string | null = null;
    if (data.password) {
      passwordHash = bcrypt.hashSync(data.password, 10);
    } else if (data.role === "administrador" || data.role === "tecnico") {
      // Senha temporária padrão se não enviada
      passwordHash = bcrypt.hashSync("Mudar@123", 10);
    }

    const avatarColors = {
      tecnico: "bg-orange-200",
      administrador: "bg-red-200",
      professor: "bg-blue-200",
      aluno: "bg-purple-200",
    };

    query.run(
      `INSERT INTO users (id, name, email, role, registration, phone, status, password_hash, initials, avatar_color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      name,
      email,
      data.role,
      registration,
      data.phone || "",
      data.status || "ativo",
      passwordHash,
      initials,
      avatarColors[data.role] || "bg-gray-200"
    );

    return this.getUserById(id);
  }

  static updateUser(id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    role?: "tecnico" | "aluno" | "professor" | "administrador";
    registration?: string;
    status?: "ativo" | "inativo" | "pendente";
    avatar?: string;
  }) {
    const existing = this.getUserById(id);

    if (data.email && data.email.toLowerCase() !== existing.email.toLowerCase()) {
      const emailConflict = query.get("SELECT id FROM users WHERE email = ? AND id != ?", data.email.toLowerCase(), id);
      if (emailConflict) {
        throw new AppError("Já existe outro usuário cadastrado com este e-mail.", 409, "EMAIL_EXISTS");
      }
    }

    if (data.registration && data.registration !== existing.registration) {
      const regConflict = query.get("SELECT id FROM users WHERE registration = ? AND id != ?", data.registration, id);
      if (regConflict) {
        throw new AppError("Esta matrícula já está em uso por outro usuário.", 409, "REGISTRATION_EXISTS");
      }
    }

    const name = data.name !== undefined ? data.name.trim() : existing.name;
    const email = data.email !== undefined ? data.email.trim().toLowerCase() : existing.email;
    const phone = data.phone !== undefined ? data.phone.trim() : existing.phone;
    const role = data.role !== undefined ? data.role : existing.role;
    const registration = data.registration !== undefined ? data.registration.trim() : existing.registration;
    const status = data.status !== undefined ? data.status : existing.status;
    const avatar = data.avatar !== undefined ? data.avatar : existing.avatar;
    const initials = name.split(/\s+/).slice(0, 2).map((n: string) => n[0]).join("").toUpperCase();

    query.run(
      `UPDATE users
       SET name = ?, email = ?, phone = ?, role = ?, registration = ?, status = ?, avatar = ?, initials = ?, updated_at = datetime('now')
       WHERE id = ?`,
      name,
      email,
      phone,
      role,
      registration,
      status,
      avatar,
      initials,
      id
    );

    return this.getUserById(id);
  }

  static updateStatus(id: string, status: "ativo" | "inativo" | "pendente") {
    this.getUserById(id);
    query.run(`UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?`, status, id);
    return this.getUserById(id);
  }
}

