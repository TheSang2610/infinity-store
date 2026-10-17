// Mot so file phai co o ca frontend (giao dien dung) lan backend (kiem tra du lieu),
// vi hai ben deploy rieng tren Vercel. Test nay bat buoc hai ban giong het nhau:
// sua mot ben ma quen ben kia thi gia hien tren web se lech gia may chu tinh.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const repo = new URL("../../", import.meta.url);

const COPIES = [
  ["backend/src/types/index.ts", "frontend/src/types/index.ts"],
  ["backend/src/utils/installment.ts", "frontend/src/lib/installment.ts"],
  ["backend/src/utils/order-pricing.ts", "frontend/src/lib/order-pricing.ts"],
  ["backend/src/constants/preorder-products.ts", "frontend/src/constants/portal/preorder-products.ts"],
  ["backend/src/services/chatbot/advisor.ts", "frontend/src/lib/chatbot/advisor.ts"],
  ["backend/src/services/chatbot/consult.ts", "frontend/src/lib/chatbot/consult.ts"],
];

/** Bo dong ghi chu "Ban sao cua ..." va duong dan import kieu (khac nhau giua hai du an). */
function normalize(source) {
  return source
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => !/^\/\/ (Ban sao cua|Kieu du lieu dung chung)/.test(line))
    .map((line) => line.replace(/from "(?:\.\.\/types|\.\.\/\.\.\/types|@\/lib\/types|@\/src\/types|@\/src\/lib\/products|@\/app\/products)"/, 'from "<types>"'))
    .join("\n")
    .trim();
}

for (const [backendFile, frontendFile] of COPIES) {
  test(`${frontendFile} giong ${backendFile}`, async () => {
    const [backend, frontend] = await Promise.all([
      readFile(new URL(backendFile, repo), "utf8"),
      readFile(new URL(frontendFile, repo), "utf8"),
    ]);
    assert.equal(normalize(frontend), normalize(backend), `Sửa ${frontendFile} thì chép sang ${backendFile} (hoặc ngược lại).`);
  });
}
