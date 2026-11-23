import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";
import { postgres } from "./postgres.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ordem respeita as chaves estrangeiras do schema do labMU.
const TABLES = [
  "users",
  "machines",
  "supplies",
  "portable_equipment",
  "maintenances",
  "stock_movements",
  "loans",
  "productions",
  "revoked_tokens",
] as const;

type TableName = (typeof TABLES)[number];

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function resolveSourcePath(): string {
  const configured = process.env.SQLITE_SOURCE_FILE || env.DATABASE_FILE;
  return path.isAbsolute(configured)
    ? configured
    : path.resolve(__dirname, "../../", configured);
}

/**
 * Importa o banco SQLite legado para o schema PostgreSQL já criado.
 * Por segurança, aborta se qualquer tabela de destino não estiver vazia.
 * A importação inteira é transacional: qualquer erro desfaz todas as inserções.
 */
export async function migrateSqliteToPostgres(): Promise<Array<{ table: TableName; rows: number }>> {
  const sourcePath = resolveSourcePath();
  if (!fs.existsSync(sourcePath)) {
    throw new Error(
      `Arquivo SQLite não encontrado: ${sourcePath}. Defina SQLITE_SOURCE_FILE com o caminho do arquivo legado.`
    );
  }

  const sqlite = new DatabaseSync(sourcePath);
  const summary: Array<{ table: TableName; rows: number }> = [];

  try {
    const sourceRows = new Map<TableName, Array<Record<string, unknown>>>();

    for (const table of TABLES) {
      const rows = sqlite.prepare(`SELECT * FROM ${quoteIdentifier(table)}`).all() as Array<Record<string, unknown>>;
      sourceRows.set(table, rows);
    }

    await postgres.transaction(async () => {
      // Não mistura dados antigos com dados já existentes no destino.
      for (const table of TABLES) {
        const target = await postgres.get<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM public.${quoteIdentifier(table)}`
        );
        if ((target?.count ?? 0) !== 0) {
          throw new Error(
            `A tabela public.${table} já contém ${target?.count ?? 0} registro(s). A importação foi cancelada sem alterar o destino.`
          );
        }
      }

      for (const table of TABLES) {
        const rows = sourceRows.get(table) ?? [];
        if (rows.length === 0) {
          summary.push({ table, rows: 0 });
          continue;
        }

        const columns = Object.keys(rows[0]);
        if (columns.length === 0) {
          summary.push({ table, rows: 0 });
          continue;
        }

        // Verifica que todas as linhas possuem o mesmo conjunto de colunas.
        for (const row of rows) {
          if (Object.keys(row).join("\0") !== columns.join("\0")) {
            throw new Error(`A estrutura das linhas da tabela SQLite ${table} não é consistente.`);
          }
        }

        const columnSql = columns.map(quoteIdentifier).join(", ");
        const placeholders = columns.map(() => "?").join(", ");
        const insertSql = `INSERT INTO public.${quoteIdentifier(table)} (${columnSql}) VALUES (${placeholders})`;

        for (const row of rows) {
          await postgres.run(insertSql, ...columns.map((column) => row[column]));
        }

        const target = await postgres.get<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM public.${quoteIdentifier(table)}`
        );
        if ((target?.count ?? 0) !== rows.length) {
          throw new Error(
            `Conferência falhou em ${table}: SQLite tem ${rows.length}, PostgreSQL tem ${target?.count ?? 0}.`
          );
        }

        summary.push({ table, rows: rows.length });
      }
    });

    return summary;
  } finally {
    sqlite.close();
  }
}

const invokedFile = process.argv[1] ?? "";
if (invokedFile.endsWith("migrateSqliteToPostgres.ts") || invokedFile.endsWith("migrateSqliteToPostgres.js")) {
  try {
    const summary = await migrateSqliteToPostgres();
    console.log("Importação SQLite → PostgreSQL concluída:");
    for (const item of summary) console.log(`- ${item.table}: ${item.rows} registro(s)`);
  } catch (error) {
    console.error("Falha na importação SQLite → PostgreSQL:", error);
    process.exitCode = 1;
  } finally {
    await postgres.close();
  }
}
