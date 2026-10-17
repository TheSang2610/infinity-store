import { readFileSync } from "node:fs";
import path from "node:path";
import type { ProductInput } from "../repositories/product.repository";
import type { StoreSettings } from "../types";

// Du lieu ban dau cho CSDL moi (thu muc backend/seed/): chi doc khi seed, luc chay chi doc CSDL.
// Sau khi seed, sua san pham va thong tin cua hang trong trang quan tri.

const SEED_DIR = path.resolve(__dirname, "../../seed");

/** Catalog mau, sinh tu scripts/legacy-catalog/bake-catalog.ts --seed. */
export function loadSeedProducts(): ProductInput[] {
  return readJson("products.json");
}

/** Thong tin cua hang ban dau (lien he, tai khoan nhan tien, ben ban tren hoa don). */
export function loadSeedStoreSettings(): StoreSettings {
  return readJson("store-settings.json");
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(SEED_DIR, file), "utf8")) as T;
}
