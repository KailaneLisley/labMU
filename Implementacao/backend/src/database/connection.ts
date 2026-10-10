import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.isAbsolute(env.DATABASE_FILE)
  ? env.DATABASE_FILE
  : path.resolve(__dirname, "../../", env.DATABASE_FILE);

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec("PRAGMA foreign_keys = ON;");

// Initialize Schema
const schemaPath = path.resolve(__dirname, "schema.sql");
if (fs.existsSync(schemaPath)) {
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  db.exec(schemaSql);
}

let transactionDepth = 0;

export const query = {
  get<T = any>(sql: string, ...params: any[]): T | undefined {
    const stmt = db.prepare(sql);
    return stmt.get(...params) as T | undefined;
  },

  all<T = any>(sql: string, ...params: any[]): T[] {
    const stmt = db.prepare(sql);
    return stmt.all(...params) as T[];
  },

  run(sql: string, ...params: any[]) {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  },

  transaction<T>(fn: () => T): T {
    if (transactionDepth > 0) {
      const sp = `sp_${transactionDepth++}`;
      db.exec(`SAVEPOINT ${sp};`);
      try {
        const result = fn();
        db.exec(`RELEASE SAVEPOINT ${sp};`);
        transactionDepth--;
        return result;
      } catch (error) {
        db.exec(`ROLLBACK TO SAVEPOINT ${sp};`);
        transactionDepth--;
        throw error;
      }
    }

    transactionDepth++;
    db.exec("BEGIN IMMEDIATE;");
    try {
      const result = fn();
      db.exec("COMMIT;");
      transactionDepth--;
      return result;
    } catch (error) {
      db.exec("ROLLBACK;");
      transactionDepth--;
      throw error;
    }
  },
};

