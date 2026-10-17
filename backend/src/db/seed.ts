// Nap san pham mau (bo qua san pham da co), thong tin cua hang (neu chua co) va tai khoan chu cua hang.
// Chay lai nhieu lan van an toan.
import { env } from "../config/env";
import { upsertOwner } from "../repositories/admin-user.repository";
import { insertSeedProducts } from "../repositories/product.repository";
import { seedStoreSettings } from "../services/store-settings.service";
import { loadSeedProducts, loadSeedStoreSettings } from "./seed-data";

async function main() {
  const count = await insertSeedProducts(loadSeedProducts());
  console.log(`Đã kiểm tra ${count} sản phẩm mẫu.`);
  await seedStoreSettings(loadSeedStoreSettings());
  console.log("Đã kiểm tra thông tin cửa hàng (không ghi đè nếu đã có).");

  if (env.ownerPassword) {
    await upsertOwner(env.ownerUsername, env.ownerPassword);
    console.log(`Tài khoản chủ cửa hàng: ${env.ownerUsername}`);
  } else {
    console.log("Bỏ qua tạo tài khoản chủ cửa hàng (chưa đặt OWNER_PASSWORD).");
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
