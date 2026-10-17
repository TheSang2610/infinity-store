// Chuyen du lieu D1 cu sang PostgreSQL dang cau hinh trong DATABASE_URL.
//
//   npm run db:import-d1 -- <file .sqlite|.sql> [--files-from <thu muc chua tep R2>]
//
// --files-from: thu muc chua tep tai ve tu R2 cu (giu nguyen ten key, ke ca thu muc con
// nhu "student-verifications/..."). Script chep tung tep CSDL dang tham chieu vao kho moi.
// Tai R2 ve may: `wrangler r2 object get <bucket>/<key> --file <duong dan>` hoac giao dien Cloudflare.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { importD1, openD1Export, referencedStorageKeys } from "../src/db/import-d1";
import { detectImageType, isPdf, putFile } from "../src/services/file-storage.service";

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((arg, index) => !arg.startsWith("--") && args[index - 1] !== "--files-from");
  const filesFlag = args.indexOf("--files-from");
  const filesFrom = filesFlag >= 0 ? args[filesFlag + 1] : "";
  if (!file) throw new Error("Thiếu đường dẫn file D1 (.sqlite hoặc .sql).");

  const source = openD1Export(path.resolve(file));
  console.log(`Nhập dữ liệu từ ${file}:`);
  await importD1(source);

  const keys = referencedStorageKeys(source);
  if (!filesFrom) {
    console.log(`\nCSDL tham chiếu ${keys.length} tệp trên R2 cũ. Chạy lại với --files-from <thư mục> để chép sang kho mới:`);
    for (const key of keys) console.log(`  ${key}`);
    process.exit(0);
  }

  let copied = 0;
  for (const key of keys) {
    try {
      const bytes = await readFile(path.join(path.resolve(filesFrom), ...key.split("/")));
      const contentType = isPdf(bytes) ? "application/pdf" : detectImageType(bytes) || "application/octet-stream";
      await putFile(key, bytes, contentType);
      copied += 1;
    } catch {
      console.warn(`  ! thiếu tệp ${key}`);
    }
  }
  console.log(`Đã chép ${copied}/${keys.length} tệp.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
