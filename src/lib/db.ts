import { migrations } from "./migrations";

// Thin query layer over either Postgres (DATABASE_URL, e.g. Supabase) or an
// embedded Postgres (PGlite) for local development. Same SQL runs on both.

export type Row = Record<string, any>;

export interface Querier {
  query<T extends Row = Row>(sql: string, params?: unknown[]): Promise<T[]>;
}

interface Db extends Querier {
  tx<T>(fn: (q: Querier) => Promise<T>): Promise<T>;
  /** Runs a multi-statement script (migrations) with no parameters. */
  exec(sql: string): Promise<void>;
}

async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url, max: 5 });
    return {
      async query(sql, params) {
        return (await pool.query(sql, params as any[])).rows;
      },
      async tx(fn) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const result = await fn({
            async query(sql, params) {
              return (await client.query(sql, params as any[])).rows;
            },
          });
          await client.query("COMMIT");
          return result;
        } catch (e) {
          await client.query("ROLLBACK");
          throw e;
        } finally {
          client.release();
        }
      },
      async exec(sql) {
        await pool.query(sql);
      },
    };
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const dir = process.env.PGLITE_DIR ?? "./.data/pglite";
  const { mkdirSync } = await import("node:fs");
  mkdirSync(dir, { recursive: true });
  const pg = await PGlite.create(dir);
  return {
    async query(sql, params) {
      return (await pg.query(sql, params as any[])).rows as any[];
    },
    async tx(fn) {
      return pg.transaction((t) =>
        fn({
          async query(sql, params) {
            return (await t.query(sql, params as any[])).rows as any[];
          },
        }),
      );
    },
    async exec(sql) {
      await pg.exec(sql);
    },
  };
}

async function migrate(db: Db) {
  await db.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  const applied = new Set(
    (await db.query<{ id: string }>("SELECT id FROM schema_migrations")).map((r) => r.id),
  );
  for (const m of migrations) {
    if (applied.has(m.id)) continue;
    // Postgres DDL is transactional, so a failed migration leaves nothing half-applied.
    try {
      await db.exec(`BEGIN;\n${m.sql}\nINSERT INTO schema_migrations (id) VALUES ('${m.id}');\nCOMMIT;`);
    } catch (e) {
      await db.exec("ROLLBACK").catch(() => {});
      throw e;
    }
  }
}

const g = globalThis as unknown as { __petproDb?: Promise<Db> };

function getDb(): Promise<Db> {
  if (!g.__petproDb) {
    g.__petproDb = (async () => {
      const db = await createDb();
      await migrate(db);
      return db;
    })();
    g.__petproDb.catch(() => (g.__petproDb = undefined));
  }
  return g.__petproDb;
}

export async function query<T extends Row = Row>(sql: string, params?: unknown[]): Promise<T[]> {
  return (await getDb()).query<T>(sql, params);
}

export async function one<T extends Row = Row>(sql: string, params?: unknown[]): Promise<T | null> {
  return (await query<T>(sql, params))[0] ?? null;
}

export async function tx<T>(fn: (q: Querier) => Promise<T>): Promise<T> {
  return (await getDb()).tx(fn);
}

export function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";
}
