import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { storeSettings } from "../db/schema";
import type { StoreSettings } from "../types";

const STORE_KEY = "store";

export async function findStoreSettings(): Promise<StoreSettings | undefined> {
  const [row] = await getDb().select().from(storeSettings).where(eq(storeSettings.key, STORE_KEY)).limit(1);
  return row?.value;
}

export async function saveStoreSettings(value: StoreSettings, updatedBy: string) {
  const updatedAt = Date.now();
  await getDb().insert(storeSettings).values({ key: STORE_KEY, value, updatedBy, updatedAt })
    .onConflictDoUpdate({ target: storeSettings.key, set: { value, updatedBy, updatedAt } });
}

/** Chi them khi chua co (dung cho seed, khong ghi de thong tin chu cua hang da sua). */
export async function insertStoreSettingsIfMissing(value: StoreSettings) {
  await getDb().insert(storeSettings).values({ key: STORE_KEY, value, updatedBy: "seed", updatedAt: Date.now() }).onConflictDoNothing();
}
