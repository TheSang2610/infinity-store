// Tao/cap nhat bang theo cac file trong drizzle/ (sinh bang `npm run db:generate`).
import path from "node:path";
import { migrate as migratePostgres } from "drizzle-orm/node-postgres/migrator";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { env } from "../config/env";
import { getDb } from "./client";

async function main() {
  const migrationsFolder = path.resolve(__dirname, "../../drizzle");
  if (env.databaseUrl.startsWith("pglite:")) {
    await migratePglite(getDb() as never, { migrationsFolder });
  } else {
    await migratePostgres(getDb(), { migrationsFolder });
  }
  console.log("Đã cập nhật cấu trúc CSDL.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
