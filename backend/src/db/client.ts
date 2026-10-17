import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../config/env";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

let database: Database | undefined;

export function getDb(): Database {
  if (database) return database;
  if (!env.databaseUrl) throw new Error("Chưa cấu hình DATABASE_URL cho PostgreSQL.");
  database = env.databaseUrl.startsWith("pglite:") ? openPglite(env.databaseUrl.slice("pglite:".length)) : openPostgres(env.databaseUrl);
  return database;
}

/** Chi dung trong test: thay CSDL bang PGlite chay trong bo nho. */
export function setDb(next: Database) {
  database = next;
}

function openPostgres(url: string) {
  const pool = new Pool({
    connectionString: url,
    // Neon/Supabase can SSL, Postgres tren may thi khong.
    ssl: /sslmode=require/.test(url) ? { rejectUnauthorized: false } : undefined,
    max: 5,
  });
  return drizzle(pool, { schema });
}

/**
 * DATABASE_URL=pglite:./.pglite - PostgreSQL chay ngay trong Node, luu vao thu muc,
 * de chay thu tren may chua cai PostgreSQL. Khong dung cho production.
 */
function openPglite(dataDir: string): Database {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PGlite } = require("@electric-sql/pglite") as typeof import("@electric-sql/pglite");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle: drizzlePglite } = require("drizzle-orm/pglite") as typeof import("drizzle-orm/pglite");
  return drizzlePglite(new PGlite(dataDir || undefined), { schema }) as unknown as Database;
}
