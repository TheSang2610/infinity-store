import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { setDb, type Database } from "../db/client";
import * as schema from "../db/schema";

/** CSDL PostgreSQL that (PGlite) chay trong bo nho, da tao bang theo migration. */
export async function useTestDatabase() {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.resolve(__dirname, "../../drizzle") });
  setDb(db as unknown as Database);
  return { db, close: () => client.close() };
}
