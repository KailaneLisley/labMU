import { AsyncLocalStorage } from "node:async_hooks";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

type TransactionContext = {
  client: PoolClient;
  depth: number;
};

type RunResult<T extends QueryResultRow = QueryResultRow> = {
  changes: number;
  rows: T[];
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL precisa ser definida para usar o PostgreSQL.");
}

// Em serverless, mantenha o pool pequeno para não esgotar as conexões do Supabase.
const pool = new Pool({
  connectionString: databaseUrl,
  max: Number(process.env.PG_POOL_MAX) || (process.env.NODE_ENV === "production" ? 1 : 5),
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
  ssl: process.env.PGSSL === "disable"
    ? false
    : { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== "false" },
});

const transactionContext = new AsyncLocalStorage<TransactionContext>();

/**
 * Converte os placeholders SQLite (?) para placeholders PostgreSQL ($1, $2...).
 * Ignora interrogações dentro de strings e comentários SQL.
 */
export function toPostgresPlaceholders(sql: string): string {
  let output = "";
  let parameterIndex = 0;
  let state: "normal" | "single" | "double" | "line-comment" | "block-comment" = "normal";

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const next = sql[i + 1];

    if (state === "single") {
      output += char;
      if (char === "'" && next === "'") {
        output += next;
        i++;
      } else if (char === "'") {
        state = "normal";
      }
      continue;
    }

    if (state === "double") {
      output += char;
      if (char === '"' && next === '"') {
        output += next;
        i++;
      } else if (char === '"') {
        state = "normal";
      }
      continue;
    }

    if (state === "line-comment") {
      output += char;
      if (char === "\n") state = "normal";
      continue;
    }

    if (state === "block-comment") {
      output += char;
      if (char === "*" && next === "/") {
        output += next;
        i++;
        state = "normal";
      }
      continue;
    }

    if (char === "'" ) {
      state = "single";
      output += char;
    } else if (char === '"') {
      state = "double";
      output += char;
    } else if (char === "-" && next === "-") {
      state = "line-comment";
      output += char + next;
      i++;
    } else if (char === "/" && next === "*") {
      state = "block-comment";
      output += char + next;
      i++;
    } else if (char === "?") {
      parameterIndex++;
      output += `$${parameterIndex}`;
    } else {
      output += char;
    }
  }

  return output;
}

async function execute<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[]
) {
  const statement = toPostgresPlaceholders(sql);
  const context = transactionContext.getStore();

  if (context) {
    return context.client.query<T>(statement, params);
  }

  return pool.query<T>(statement, params);
}

export const postgres = {
  async get<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    ...params: unknown[]
  ): Promise<T | undefined> {
    const result = await execute<T>(sql, params);
    return result.rows[0];
  },

  async all<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    ...params: unknown[]
  ): Promise<T[]> {
    const result = await execute<T>(sql, params);
    return result.rows;
  },

  async run<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    ...params: unknown[]
  ): Promise<RunResult<T>> {
    const result = await execute<T>(sql, params);
    return { changes: result.rowCount ?? 0, rows: result.rows };
  },

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    const current = transactionContext.getStore();

    if (current) {
      const savepoint = `labmu_sp_${current.depth}`;
      await current.client.query(`SAVEPOINT ${savepoint}`);

      try {
        const result = await transactionContext.run(
          { client: current.client, depth: current.depth + 1 },
          callback
        );
        await current.client.query(`RELEASE SAVEPOINT ${savepoint}`);
        return result;
      } catch (error) {
        await current.client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
        await current.client.query(`RELEASE SAVEPOINT ${savepoint}`);
        throw error;
      }
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const result = await transactionContext.run({ client, depth: 1 }, callback);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async close(): Promise<void> {
    await pool.end();
  },
};
