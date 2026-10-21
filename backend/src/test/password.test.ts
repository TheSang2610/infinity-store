import assert from "node:assert/strict";
import { pbkdf2Sync } from "node:crypto";
import { after, before, describe, test } from "node:test";
import { eq } from "drizzle-orm";

process.env.FRONTEND_URL = "http://localhost:3000";

import { adminUsers } from "../db/schema";
import { authenticateAdminUser, upsertOwner } from "../repositories/admin-user.repository";
import { createPasswordHash, PASSWORD_ITERATIONS, passwordNeedsRehash, verifyPassword } from "../utils/crypto";
import { useTestDatabase } from "./test-db";

/** Hash dang cu: hex tran, 120.000 vong (ban D1 / truoc khi ghi phien ban). */
function legacyHash(password: string, salt: string) {
  return pbkdf2Sync(password, Buffer.from(salt, "hex"), 120_000, 32, "sha256").toString("hex");
}

describe("hash mat khau co phien ban", () => {
  test("hash moi ghi phien ban va so vong, dung mat khau moi qua", async () => {
    const { salt, hash } = await createPasswordHash("mat-khau-dung");
    assert.match(hash, new RegExp(`^v2\\$${PASSWORD_ITERATIONS}\\$[0-9a-f]{64}$`));
    assert.equal(await verifyPassword("mat-khau-dung", salt, hash), true);
    assert.equal(await verifyPassword("mat-khau-sai", salt, hash), false);
    assert.equal(passwordNeedsRehash(hash), false);
  });

  test("hash dang cu van dang nhap duoc va bi danh dau can bam lai", async () => {
    const salt = "00112233445566778899aabbccddeeff";
    const old = legacyHash("mat-khau-cu", salt);
    assert.equal(await verifyPassword("mat-khau-cu", salt, old), true);
    assert.equal(await verifyPassword("sai", salt, old), false);
    assert.equal(passwordNeedsRehash(old), true);
  });

  test("hash sai dinh dang hoac thieu muoi thi tu choi", async () => {
    assert.equal(await verifyPassword("x", "00112233445566778899aabbccddeeff", "khong-phai-hash"), false);
    assert.equal(await verifyPassword("x", "", legacyHash("x", "00")), false);
  });
});

describe("dang nhap bam lai hash cu", () => {
  let close: () => Promise<void>;
  let db: Awaited<ReturnType<typeof useTestDatabase>>["db"];
  before(async () => ({ db, close } = await useTestDatabase()));
  after(async () => close());

  test("Giam doc co hash cu dang nhap dung thi hash duoc nang len dang moi", async () => {
    await upsertOwner("admin", "tam-thoi-123456");
    const salt = "ffeeddccbbaa99887766554433221100";
    await db.update(adminUsers).set({ passwordHash: legacyHash("mat-khau-cu-123", salt), passwordSalt: salt }).where(eq(adminUsers.username, "admin"));

    assert.equal(await authenticateAdminUser("admin", "sai-mat-khau"), undefined);
    const [unchanged] = await db.select().from(adminUsers).where(eq(adminUsers.username, "admin"));
    assert.equal(passwordNeedsRehash(unchanged.passwordHash), true, "sai mat khau thi khong duoc dong vao hash");

    assert.ok(await authenticateAdminUser("admin", "mat-khau-cu-123"));
    const [upgraded] = await db.select().from(adminUsers).where(eq(adminUsers.username, "admin"));
    assert.match(upgraded.passwordHash, /^v2\$/);
    assert.ok(await authenticateAdminUser("admin", "mat-khau-cu-123"), "mat khau cu van dung sau khi bam lai");
  });
});
