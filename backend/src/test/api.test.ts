import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, beforeEach, describe, test } from "node:test";
import request from "supertest";

// Bien moi truong phai dat truoc khi nap app.
process.env.CASSO_WEBHOOK_SECRET = "casso-test-secret";
process.env.HR_DATA_KEY = "hr-test-key";
process.env.FRONTEND_URL = "http://localhost:3000";

import { createApp } from "../app";
import { eq } from "drizzle-orm";
import { branches, employeeProfiles, orders, products, rateLimitBuckets } from "../db/schema";
import { resetRateLimits } from "../middlewares/security";
import { createAdminUser, upsertOwner } from "../repositories/admin-user.repository";
import { loadSeedProducts, loadSeedStoreSettings } from "../db/seed-data";
import { seedStoreSettings } from "../services/store-settings.service";
import { insertSeedProducts } from "../repositories/product.repository";
import { publicFamilyKey } from "../services/product-catalog.service";
import { cookieOf, loginAdmin } from "./helpers";
import { useTestDatabase } from "./test-db";

const seedProducts = loadSeedProducts();
const app = createApp();
let close: () => Promise<void>;
let db: Awaited<ReturnType<typeof useTestDatabase>>["db"];

const HOME = { deliveryMethod: "Giao hàng tận nơi", address: "12 Lê Lợi, Quận 1", paymentMethod: "Chuyển khoản BIDV 24/7 - 1810408755" };
const IPHONE_17 = { productSlug: "iphone-17", storage: "256GB", color: "Đen" };

before(async () => {
  process.env.UPLOAD_DIR = await mkdtemp(path.join(tmpdir(), "infinity-uploads-"));
  ({ db, close } = await useTestDatabase());
  await insertSeedProducts(seedProducts);
  // Du lieu mau chi co 1 may moi bien the; dat hang nay tru ton that nen nang ton len de
  // cac test dat hang khong het hang giua chung.
  await setFamilyStock("iphone-17", 1000);
  await seedStoreSettings(loadSeedStoreSettings());
  await upsertOwner("admin", "owner-password-123");
  await db.insert(branches).values([
    { id: "b-q1", code: "Q1", name: "Chi nhánh Quận 1", address: "1 Nguyễn Huệ, Quận 1", createdAt: 1 },
    { id: "b-q3", code: "Q3", name: "Chi nhánh Quận 3", address: "3 Võ Văn Tần, Quận 3", createdAt: 2 },
    { id: "b-bh", code: "BH01", name: "Trung tâm bảo hành", address: "9 Cách Mạng Tháng 8", createdAt: 3 },
  ]);
  await createAdminUser({ username: "quanly.q1", name: "Quản lý Q1", password: "matkhau123", role: "manager", branch: "Chi nhánh Quận 1", branchId: "b-q1" });
  await createAdminUser({ username: "banhang.q1", name: "Bán hàng Q1", password: "matkhau123", role: "sales", branch: "Chi nhánh Quận 1", branchId: "b-q1" });
  await createAdminUser({ username: "kho.q1", name: "Kho Q1", password: "matkhau123", role: "inventory", branch: "Chi nhánh Quận 1", branchId: "b-q1" });
});

beforeEach(() => resetRateLimits());

after(async () => {
  await close();
});

const order = (body: Record<string, unknown>) => request(app).post("/api/orders").send({ customerName: "Nguyễn Văn A", phone: "0901234567", ...body });

/** Ban ghi cung dong may voi slug cong khai ("iphone-17" -> iphone-17-256gb...), khong lan sang "iphone-17-pro". */
async function familyRows(slug: string) {
  return (await db.select().from(products)).filter((row) => publicFamilyKey(row.slug) === slug);
}

/** Dat ton cho moi bien the cua mot dong may (loc theo mau neu co). */
async function setFamilyStock(slug: string, stock: number, color?: string) {
  for (const row of await familyRows(slug)) {
    const variants = row.variants.map((variant) => !color || variant.color === color ? { ...variant, stock } : variant);
    await db.update(products).set({ variants }).where(eq(products.id, row.id));
  }
}

async function variantStock(slug: string, storage: string, color: string) {
  for (const row of await familyRows(slug)) {
    const variant = row.variants.find((item) => item.storage === storage && item.color === color);
    if (variant) return variant.stock;
  }
  return undefined;
}

const setStatus = (cookie: string, id: string, status: string) =>
  request(app).patch(`/api/admin/orders/${id}/status`).set("Cookie", cookie).send({ status });

describe("giỏ hàng lưu trên máy chủ", () => {
  const register = (username: string, phone: string) => request(app).post("/api/account/register")
    .send({ username, name: username, email: `${username}@example.com`, phone, password: "matkhau123" });
  const login = async (identifier: string) =>
    cookieOf(await request(app).post("/api/account/login").send({ identifier, password: "matkhau123" }), "infinity_customer");
  const line = (color: string, quantity = 1) => ({
    key: `iphone-17||256gb|${color}`, productSlug: "iphone-17", productName: "iPhone 17", image: "/a.png",
    ram: "", storage: "256GB", color, unitPrice: 24990000, quantity,
  });

  test("đăng nhập máy khác vẫn thấy giỏ, tài khoản khác không thấy", async () => {
    await register("gio.maya", "0907000001");
    await register("gio.mayb", "0907000002");
    const laptop = await login("gio.maya");
    const saved = await request(app).put("/api/account/cart").set("Cookie", laptop)
      .send({ items: [line("Đen", 2), line("Trắng", 99), { key: "", productSlug: "x" }] });
    assert.equal(saved.status, 200, saved.text);
    assert.deepEqual(saved.body.items.map((item: { color: string; quantity: number }) => [item.color, item.quantity]), [["Đen", 2], ["Trắng", 10]],
      "dòng hỏng bị bỏ, số lượng tối đa 10");

    const phone = await login("gio.maya");
    assert.notEqual(phone, laptop, "phiên đăng nhập mới = máy khác");
    const onPhone = await request(app).get("/api/account/cart").set("Cookie", phone);
    assert.equal(onPhone.body.items.length, 2);
    assert.match(String(onPhone.headers["cache-control"]), /no-store/);

    const other = await request(app).get("/api/account/cart").set("Cookie", await login("gio.mayb"));
    assert.deepEqual(other.body.items, []);
  });

  test("phải đăng nhập, giỏ tối đa 20 dòng", async () => {
    assert.equal((await request(app).get("/api/account/cart")).status, 401);
    const cookie = await login("gio.maya");
    const tooMany = await request(app).put("/api/account/cart").set("Cookie", cookie)
      .send({ items: Array.from({ length: 21 }, (_, index) => ({ ...line(`Màu ${index}`), key: `k${index}` })) });
    assert.equal(tooMany.status, 400);
  });
});

describe("cập nhật trạng thái đơn", () => {
  test("đi đúng quy trình, không nhảy cóc, không quay ngược", async () => {
    const owner = await loginAdmin(app, "admin", "owner-password-123");
    const placed = await order({ ...HOME, items: [IPHONE_17] });
    const id = placed.body.id as string;

    const skip = await setStatus(owner, id, "delivered");
    assert.equal(skip.status, 400);
    assert.match(skip.body.message, /Không thể chuyển đơn từ "Chờ xác nhận" sang "Đã giao"/);

    for (const status of ["confirmed", "processing", "shipping", "delivered"]) {
      const step = await setStatus(owner, id, status);
      assert.equal(step.status, 200, `${status}: ${step.text}`);
    }
    assert.equal((await setStatus(owner, id, "pending")).status, 400, "đơn đã giao không quay về chờ xác nhận");
    assert.equal((await setStatus(owner, id, "khong-co")).status, 400);
    assert.equal((await setStatus(owner, id, "delivered")).status, 200, "chọn lại trạng thái hiện tại không lỗi");

    const status = await request(app).get(`/api/orders/status?orderCode=${placed.body.orderCode}`);
    assert.equal(status.body.status, "delivered");
  });

  test("đặt hàng trừ tồn kho, hết hàng thì báo lỗi; hủy đơn cộng lại kho và trả lượt voucher", async () => {
    const owner = await loginAdmin(app, "admin", "owner-password-123");
    const WHITE = { productSlug: "iphone-17", storage: "256GB", color: "Trắng" };
    await setFamilyStock("iphone-17", 2, "Trắng");
    const voucher = await request(app).post("/api/admin/vouchers").set("Cookie", owner)
      .send({ code: "KHOTEST", type: "fixed", value: 100000, usageLimit: 1, active: true });
    assert.equal(voucher.status, 200, voucher.text);

    const first = await order({ ...HOME, voucherCode: "KHOTEST", items: [{ ...WHITE, quantity: 2 }] });
    assert.equal(first.status, 200, first.text);
    assert.equal(await variantStock("iphone-17", "256GB", "Trắng"), 0);

    const soldOut = await order({ ...HOME, items: [WHITE] });
    assert.equal(soldOut.status, 400);
    assert.match(soldOut.body.message, /hết hàng/);

    assert.equal((await setStatus(owner, first.body.id, "cancelled")).status, 200);
    assert.equal(await variantStock("iphone-17", "256GB", "Trắng"), 2, "hủy đơn cộng lại kho");
    assert.equal((await setStatus(owner, first.body.id, "confirmed")).status, 400, "đơn đã hủy không mở lại");

    const again = await order({ ...HOME, voucherCode: "KHOTEST", items: [WHITE] });
    assert.equal(again.status, 200, "voucher được trả lượt sau khi hủy");
    assert.equal(await variantStock("iphone-17", "256GB", "Trắng"), 1);
  });

  test("đặt quá số còn lại thì báo còn bao nhiêu, không trừ gì", async () => {
    const BLUE = { productSlug: "iphone-17", storage: "256GB", color: "Xanh Lam Khói" };
    await setFamilyStock("iphone-17", 3, "Xanh Lam Khói");
    const tooMany = await order({ ...HOME, items: [{ ...BLUE, quantity: 5 }] });
    assert.equal(tooMany.status, 400);
    assert.match(tooMany.body.message, /chỉ còn 3 sản phẩm/);
    assert.equal(await variantStock("iphone-17", "256GB", "Xanh Lam Khói"), 3);
  });

  test("đơn đặt trước khi có trừ kho: hủy không cộng thêm kho", async () => {
    const owner = await loginAdmin(app, "admin", "owner-password-123");
    const GREEN = { productSlug: "iphone-17", storage: "256GB", color: "Xanh Lá Xô Thơm" };
    await setFamilyStock("iphone-17", 5, "Xanh Lá Xô Thơm");
    const placed = await order({ ...HOME, items: [GREEN] });
    // Gia lap don cu: bo co stockReserved va tra ton ve nhu chua tru.
    const [saved] = await db.select().from(orders).where(eq(orders.id, placed.body.id));
    await db.update(orders).set({ items: saved.items.map(({ stockReserved: _, ...item }) => item) }).where(eq(orders.id, saved.id));
    await setFamilyStock("iphone-17", 5, "Xanh Lá Xô Thơm");

    assert.equal((await setStatus(owner, placed.body.id, "cancelled")).status, 200);
    assert.equal(await variantStock("iphone-17", "256GB", "Xanh Lá Xô Thơm"), 5);
  });
});

describe("cửa hàng", () => {
  test("gộp các bản dung lượng thành một dòng máy, đúng thứ tự danh mục", async () => {
    const response = await request(app).get("/api/products?category=iphone");
    assert.equal(response.status, 200);
    const slugs: string[] = response.body.products.map((product: { slug: string }) => product.slug);
    assert.ok(slugs.includes("iphone-17"));
    assert.ok(!slugs.includes("iphone-17-512gb"));
    // Thu tu luu trong cot sort_order (truoc day la danh sach slug viet cung trong code).
    assert.deepEqual(slugs.slice(0, 3), ["iphone-18-pro-max", "iphone-18-pro", "iphone-17-pro-max"]);
  });

  test("trang Laptop gồm cả laptop cũ", async () => {
    const categories = new Set((await request(app).get("/api/products?category=laptop")).body.products.map((product: { category: string }) => product.category));
    assert.ok(categories.has("laptop"));
  });

  test("link cũ theo dung lượng vẫn mở được sản phẩm", async () => {
    const response = await request(app).get("/api/products/iphone-17-256gb");
    assert.equal(response.status, 200);
    assert.equal(response.body.product.slug, "iphone-17");
  });
});

describe("đặt hàng", () => {
  test("giá tính lại ở máy chủ, mã đơn do máy chủ sinh", async () => {
    const response = await order({ ...HOME, orderCode: "HAAAAAAAAAAA", items: [{ ...IPHONE_17, quantity: 2, unitPrice: 1 }] });
    assert.equal(response.status, 200, response.text);
    assert.notEqual(response.body.orderCode, "HAAAAAAAAAAA");
    assert.match(response.body.orderCode, /^HA[A-Z0-9]{10}$/);
    const [saved] = (await db.select().from(orders)).filter((row) => row.id === response.body.id);
    assert.equal(saved.total, saved.items[0].unitPrice * 2);
    assert.ok(saved.items[0].unitPrice > 1_000_000);
  });

  test("không còn nhận thanh toán khi nhận hàng (COD)", async () => {
    const response = await order({ ...HOME, paymentMethod: "Thanh toán khi nhận máy", items: [IPHONE_17] });
    assert.equal(response.status, 400);
    assert.match(response.body.message, /COD/);
  });

  test("đến cửa hàng xem máy: bắt buộc chọn chi nhánh, không cần thanh toán", async () => {
    const missing = await order({ deliveryMethod: "Đến cửa hàng xem máy", items: [IPHONE_17] });
    assert.equal(missing.status, 400);
    const response = await order({ deliveryMethod: "Đến cửa hàng xem máy", branchId: "b-q1", items: [IPHONE_17] });
    assert.equal(response.status, 200, response.text);
    assert.equal(response.body.paymentStatus, "not_required");
    const [saved] = (await db.select().from(orders)).filter((row) => row.id === response.body.id);
    assert.equal(saved.branchId, "b-q1");
  });

  test("webhook Casso đánh dấu đơn chuyển khoản đã thanh toán", async () => {
    const placed = await order({ ...HOME, items: [IPHONE_17] });
    const orderCode = placed.body.orderCode as string;
    const unauthorized = await request(app).post("/api/payments/casso").set("secure-token", "sai").send({ error: 0, data: [] });
    assert.equal(unauthorized.status, 401);
    const webhook = await request(app).post("/api/payments/casso").set("secure-token", "casso-test-secret")
      .send({ error: 0, data: [{ id: 77, amount: placed.body.total, description: `CK ${orderCode}`, accountNumber: "1810408755" }] });
    assert.equal(webhook.body.processed, 1);
    const status = await request(app).get(`/api/orders/status?orderCode=${orderCode}`);
    assert.deepEqual(status.body, { status: "confirmed", paymentStatus: "paid" });
  });

  test("tra cứu bảo hành phải đúng số điện thoại", async () => {
    const placed = await order({ ...HOME, items: [IPHONE_17] });
    const wrong = await request(app).post("/api/warranty").send({ orderCode: placed.body.orderCode, phone: "0999999999" });
    assert.equal(wrong.status, 404);
    const right = await request(app).post("/api/warranty").send({ orderCode: placed.body.orderCode, phone: "+84 901 234 567" });
    assert.equal(right.status, 200);
    assert.equal(right.body.warranty.orderCode, placed.body.orderCode);
    assert.equal(right.body.warranty.citizenId, undefined, "không lộ thông tin cá nhân");
  });

  test("đặt trước máy mới: mã DT, không thu cọc", async () => {
    const response = await request(app).post("/api/preorders").send({
      productId: "iphone-18", configuration: "256GB", color: "Đen", customerName: "Trần B", phone: "0912345678", branchId: "b-q3",
    });
    assert.equal(response.status, 200, response.text);
    assert.match(response.body.orderCode, /^DT[A-Z0-9]{10}$/);
    assert.equal(response.body.paymentRequired, false);
  });

  test("voucher không vượt quá số lượt dùng", async () => {
    const owner = await loginAdmin(app, "admin", "owner-password-123");
    const created = await request(app).post("/api/admin/vouchers").set("Cookie", owner)
      .send({ code: "GIAM1", type: "fixed", value: 100000, usageLimit: 1, active: true });
    assert.equal(created.status, 200, created.text);
    assert.equal((await order({ ...HOME, voucherCode: "GIAM1", items: [IPHONE_17] })).status, 200);
    const second = await order({ ...HOME, voucherCode: "GIAM1", items: [IPHONE_17] });
    assert.equal(second.status, 400);
    assert.match(second.body.message, /hết lượt/);
  });
});

describe("tài khoản khách", () => {
  test("đăng ký, xem hồ sơ, lịch sử mua, đăng xuất", async () => {
    const registered = await request(app).post("/api/account/register").send({
      username: "khach.moi", name: "Khách Mới", email: "khach@example.com", phone: "0901111222", password: "matkhau123",
    });
    assert.equal(registered.status, 200, registered.text);
    const cookie = cookieOf(registered, "infinity_customer");
    await request(app).post("/api/orders").set("Cookie", cookie).send({ customerName: "Khách Mới", phone: "0901111222", ...HOME, items: [IPHONE_17] });
    const purchases = await request(app).get("/api/account/purchases").set("Cookie", cookie);
    assert.equal(purchases.body.purchases.length, 1);
    await request(app).post("/api/account/logout").set("Cookie", cookie);
    assert.equal((await request(app).get("/api/account/me").set("Cookie", cookie)).body.customer, null);
  });

  test("dang nhap khong lo token: chi nam trong cookie httpOnly, body khong co, khong cho luu cache", async () => {
    const customer = await request(app).post("/api/account/register").send({
      username: "khach.token", name: "Khách Token", email: "khach.token@example.com", phone: "0901111444", password: "matkhau123",
    });
    const admin = await request(app).post("/api/admin/session").send({ username: "admin", password: "owner-password-123" });
    for (const [response, name] of [[customer, "infinity_customer"], [admin, "admin"]] as const) {
      assert.equal(response.status, 200, response.text);
      const setCookie = ([] as string[]).concat(response.headers["set-cookie"] ?? []).find((item) => item.startsWith(`${name}=`)) ?? "";
      const token = setCookie.split(";")[0].slice(name.length + 1);
      assert.match(token, /^[0-9a-f]{64}$/);
      assert.match(setCookie, /HttpOnly/i);
      assert.match(setCookie, /SameSite=Lax/i);
      assert.ok(!response.text.includes(token), `${name}: token khong duoc nam trong body`);
      assert.doesNotMatch(response.text, /passwordHash|passwordSalt|tokenHash|matkhau123|owner-password/i);
      assert.equal(response.headers["cache-control"], "no-store");
    }
  });

  test("cookie ten cu huy_customer van dang nhap duoc, dang xuat thi xoa ca hai ten", async () => {
    const registered = await request(app).post("/api/account/register").send({
      username: "khach.cu", name: "Khách Cũ", email: "khach.cu@example.com", phone: "0901111333", password: "matkhau123",
    });
    assert.equal(registered.status, 200, registered.text);
    const legacy = cookieOf(registered, "infinity_customer").replace(/^infinity_customer=/, "huy_customer=");
    const me = await request(app).get("/api/account/me").set("Cookie", legacy);
    assert.equal(me.body.customer?.username, "khach.cu");
    const logout = await request(app).post("/api/account/logout").set("Cookie", legacy);
    const cleared = ([] as string[]).concat(logout.headers["set-cookie"] ?? []);
    assert.ok(cleared.some((item) => item.startsWith("infinity_customer=;")));
    assert.ok(cleared.some((item) => item.startsWith("huy_customer=;")));
    assert.equal((await request(app).get("/api/account/me").set("Cookie", legacy)).body.customer, null);
  });

  test("giới hạn 5 lần đăng nhập sai trong 15 phút", async () => {
    let last = 0;
    for (let index = 0; index < 6; index += 1) {
      last = (await request(app).post("/api/account/login").send({ identifier: "khong-co", password: "sai-mat-khau" })).status;
    }
    assert.equal(last, 429);
  });

  test("giới hạn đăng nhập đếm chung giữa nhiều máy chủ (bộ đếm trong CSDL)", async () => {
    // Vercel chạy nhiều instance: 3 lần sai ở máy A + 3 lần ở máy B vẫn phải bị chặn ở lần thứ 6.
    const serverA = createApp();
    const serverB = createApp();
    const statuses: number[] = [];
    for (let index = 0; index < 6; index += 1) {
      const server = index % 2 === 0 ? serverA : serverB;
      statuses.push((await request(server).post("/api/admin/session").send({ username: "khong-co", password: "sai" })).status);
    }
    assert.deepEqual(statuses.slice(0, 5).every((status) => status !== 429), true, String(statuses));
    assert.equal(statuses[5], 429, String(statuses));
    // Luot dem phai nam trong CSDL (moi may chu thay), khong chi trong bo nho mot tien trinh.
    const [bucket] = await db.select().from(rateLimitBuckets).where(eq(rateLimitBuckets.key, "auth:/api/admin/session:::ffff:127.0.0.1"));
    assert.ok(bucket, "khong thay luot dem trong bang rate_limit_buckets");
    assert.equal(bucket.count, 6);
  });

  test("chặn request ghi từ trang web khác", async () => {
    const response = await request(app).post("/api/account/login").set("Origin", "https://trang-la.example").send({});
    assert.equal(response.status, 403);
  });
});

describe("phân quyền quản trị", () => {
  test("quản lý chỉ thấy đơn của chi nhánh mình", async () => {
    const manager = await loginAdmin(app, "quanly.q1", "matkhau123");
    const visible = (await request(app).get("/api/admin/orders").set("Cookie", manager)).body.orders as Array<{ branchId: string }>;
    assert.ok(visible.length >= 1);
    assert.ok(visible.every((item) => item.branchId === "b-q1"));
  });

  test("nhân viên bán hàng chỉ thao tác đơn được giao", async () => {
    const owner = await loginAdmin(app, "admin", "owner-password-123");
    const sales = await loginAdmin(app, "banhang.q1", "matkhau123");
    const placed = await order({ deliveryMethod: "Đến cửa hàng xem máy", branchId: "b-q1", items: [IPHONE_17] });
    const before = await request(app).patch(`/api/admin/orders/${placed.body.id}/status`).set("Cookie", sales).send({ status: "confirmed" });
    assert.equal(before.status, 403);

    const staff = (await request(app).get("/api/admin/staff").set("Cookie", owner)).body.users as Array<{ id: string; username: string }>;
    const salesId = staff.find((item) => item.username === "banhang.q1")!.id;
    const assigned = await request(app).patch(`/api/admin/orders/${placed.body.id}/assignment`).set("Cookie", owner)
      .send({ branchId: "b-q1", adminUserId: salesId });
    assert.equal(assigned.status, 200, assigned.text);
    const afterAssign = await request(app).patch(`/api/admin/orders/${placed.body.id}/status`).set("Cookie", sales).send({ status: "confirmed" });
    assert.equal(afterAssign.status, 200);
  });

  test("không giao đơn cho nhân viên kho", async () => {
    const owner = await loginAdmin(app, "admin", "owner-password-123");
    const staff = (await request(app).get("/api/admin/staff").set("Cookie", owner)).body.users as Array<{ id: string; username: string }>;
    const placed = await order({ deliveryMethod: "Đến cửa hàng xem máy", branchId: "b-q1", items: [IPHONE_17] });
    const response = await request(app).patch(`/api/admin/orders/${placed.body.id}/assignment`).set("Cookie", owner)
      .send({ branchId: "b-q1", adminUserId: staff.find((item) => item.username === "kho.q1")!.id });
    assert.equal(response.status, 400);
  });

  test("nhân viên kho không sửa được sản phẩm", async () => {
    const inventory = await loginAdmin(app, "kho.q1", "matkhau123");
    const response = await request(app).post("/api/admin/products/delete").set("Cookie", inventory).send({ ids: ["seed-iphone-17"] });
    assert.equal(response.status, 403);
  });

  test("quản lý không tạo được quản lý khác; nhân viên bảo hành về chi nhánh bảo hành", async () => {
    const manager = await loginAdmin(app, "quanly.q1", "matkhau123");
    const managerRole = await request(app).post("/api/admin/staff").set("Cookie", manager)
      .send({ username: "quanly.moi", name: "QL mới", password: "matkhau123", role: "manager" });
    assert.equal(managerRole.status, 403);
    const owner = await loginAdmin(app, "admin", "owner-password-123");
    const repair = await request(app).post("/api/admin/staff").set("Cookie", owner)
      .send({ username: "suachua01", name: "Sửa chữa", password: "matkhau123", role: "repair", branchId: "b-q1" });
    assert.equal(repair.status, 200, repair.text);
    assert.equal(repair.body.branchId, "b-bh");
  });

  test("sửa sản phẩm phụ kiện giữ nguyên danh mục", async () => {
    const owner = await loginAdmin(app, "admin", "owner-password-123");
    const accessory = seedProducts.find((product) => product.category === "phu-kien")!;
    const response = await request(app).post("/api/admin/products").set("Cookie", owner)
      .field("id", `seed-${accessory.slug}`).field("name", accessory.name).field("brand", accessory.brand)
      .field("category", "phu-kien").field("existingImages", accessory.image).field("primaryImage", accessory.image)
      .field("sellingPrice", "199.000đ");
    assert.equal(response.status, 200, response.text);
    const saved = await request(app).get(`/api/admin/products/seed-${accessory.slug}`).set("Cookie", owner);
    assert.equal(saved.body.product.category, "phu-kien");
  });

  test("sửa sản phẩm qua form không làm mất link giới thiệu và thứ tự hiển thị", async () => {
    const owner = await loginAdmin(app, "admin", "owner-password-123");
    const before = (await request(app).get("/api/admin/products/seed-iphone-17-pro").set("Cookie", owner)).body.product;
    assert.ok(before.mediaLinks?.length, "san pham co link gioi thieu trong CSDL");
    const response = await request(app).post("/api/admin/products").set("Cookie", owner)
      .field("id", before.id).field("name", before.name).field("brand", before.brand).field("category", before.category)
      .field("existingImages", before.images.join("\n")).field("primaryImage", before.image)
      .field("variantsJson", JSON.stringify(before.variants)).field("sellingPrice", before.sellingPrice);
    assert.equal(response.status, 200, response.text);
    const after = (await request(app).get("/api/admin/products/seed-iphone-17-pro").set("Cookie", owner)).body.product;
    assert.deepEqual(after.mediaLinks, before.mediaLinks);
    assert.equal(after.sortOrder, before.sortOrder);
  });
});

describe("các lỗi review đã sửa", () => {
  test("giá iPhone 17 lấy theo CSDL, không theo bảng giá cứng trong code", async () => {
    // Admin doi gia o bang bien the cua form san pham.
    const [row] = await db.select().from(products).where(eq(products.slug, "iphone-17-256gb"));
    await db.update(products).set({ variants: row.variants.map((variant) => ({ ...variant, price: "19.990.000đ", salePrice: "" })) })
      .where(eq(products.slug, "iphone-17-256gb"));
    const shown = await request(app).get("/api/products/iphone-17");
    assert.equal(shown.status, 200);
    const variant256 = shown.body.product.variants.find((variant: { storage: string }) => variant.storage === "256GB");
    assert.equal(variant256.price, "19.990.000đ");
    const placed = await order({ ...HOME, items: [IPHONE_17] });
    assert.equal(placed.status, 200, placed.text);
    assert.equal(placed.body.total, 19_990_000, "đơn hàng tính đúng giá admin đặt");
  });

  test("chặn JSON có khóa __proto__", async () => {
    const response = await request(app).post("/api/orders").set("Content-Type", "application/json")
      .send('{"customerName":"A","__proto__":{"admin":true}}');
    assert.equal(response.status, 400);
  });

  test("API khuôn mặt báo tạm tắt khi chưa cấu hình máy DeepFace", async () => {
    const sales = await loginAdmin(app, "banhang.q1", "matkhau123");
    const response = await request(app).get("/api/face/attendance").set("Cookie", sales);
    assert.equal(response.status, 503);
    assert.match(response.body.message, /tạm tắt/);
  });
});

describe("kho chi nhánh", () => {
  test("nhập rồi xuất quá số lượng thì báo lỗi, nhật ký khớp tồn kho", async () => {
    const inventory = await loginAdmin(app, "kho.q1", "matkhau123");
    const adjust = (operation: string, quantity: number) => request(app).post("/api/admin/inventory/adjust").set("Cookie", inventory)
      .send({ branchId: "b-q3", productId: "seed-iphone-17-256gb", operation, quantity });
    const received = await adjust("receive", 5);
    assert.equal(received.status, 200, received.text);
    assert.equal(received.body.branchId, "b-q1", "nhân viên kho chỉ làm việc ở chi nhánh mình");
    assert.equal(received.body.afterQuantity, 5);
    assert.equal((await adjust("issue", 9)).status, 409);
    const state = await request(app).get("/api/admin/inventory").set("Cookie", inventory);
    assert.equal(state.body.movements.length, 1);
  });
});

describe("nhân sự", () => {
  test("hồ sơ mã hóa trong CSDL, đọc ra đúng; ảnh hồ sơ không mở được qua link ảnh công khai", async () => {
    const owner = await loginAdmin(app, "admin", "owner-password-123");
    const staff = (await request(app).get("/api/admin/staff").set("Cookie", owner)).body.users as Array<{ id: string; username: string }>;
    const salesId = staff.find((item) => item.username === "banhang.q1")!.id;
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0]);
    const saved = await request(app).put(`/api/admin/hr/employees/${salesId}`).set("Cookie", owner)
      .field("name", "Bán hàng Q1").field("citizenId", "079123456789").field("bankAccountNumber", "190312345678").field("monthlySalary", "15000000")
      .attach("photo", jpeg, { filename: "anh.jpg", contentType: "image/jpeg" });
    assert.equal(saved.status, 200, saved.text);

    const [row] = (await db.select().from(employeeProfiles)).filter((item) => item.adminUserId === salesId);
    assert.match(row.citizenIdEncrypted, /^v1\./);
    assert.ok(!row.citizenIdEncrypted.includes("079123456789"));
    const profile = await request(app).get(`/api/admin/hr/employees/${salesId}`).set("Cookie", owner);
    assert.equal(profile.body.employee.citizenId, "079123456789");

    assert.equal((await request(app).get(`/api/product-images/${row.photoKey}`)).status, 400);
    assert.equal((await request(app).get(`/api/admin/hr/employees/${salesId}/photo`).set("Cookie", owner)).status, 200);
    const otherBranch = await createAdminUser({ username: "quanly.q3", name: "QL Q3", password: "matkhau123", role: "manager", branch: "Chi nhánh Quận 3", branchId: "b-q3" });
    assert.ok(otherBranch);
    const managerQ3 = await loginAdmin(app, "quanly.q3", "matkhau123");
    assert.equal((await request(app).get(`/api/admin/hr/employees/${salesId}/photo`).set("Cookie", managerQ3)).status, 403);
  });

  test("bảng lương chỉ Giám đốc xem được", async () => {
    const manager = await loginAdmin(app, "quanly.q1", "matkhau123");
    assert.equal((await request(app).get("/api/admin/payroll").set("Cookie", manager)).status, 403);
  });
});

describe("chat với cửa hàng", () => {
  test("khách mở chat, nhân viên chi nhánh trả lời, chi nhánh khác không thấy", async () => {
    const started = await request(app).post("/api/live-chat").send({ action: "start", name: "Khách C", phone: "0909000111", branchId: "b-q1" });
    assert.equal(started.status, 200, started.text);
    const { id, token } = started.body;
    const manager = await loginAdmin(app, "quanly.q1", "matkhau123");
    assert.equal((await request(app).post("/api/admin/live-chat").set("Cookie", manager).send({ conversationId: id, text: "Chào anh" })).status, 200);
    const messages = await request(app).get(`/api/live-chat?conversationId=${id}`).set("X-Chat-Token", token);
    assert.ok(messages.body.messages.some((message: { text: string }) => message.text === "Chào anh"));
    assert.equal((await request(app).get(`/api/live-chat?conversationId=${id}`).set("X-Chat-Token", "sai")).status, 403);
    assert.equal((await request(app).get(`/api/live-chat?conversationId=${id}&token=${token}`)).status, 200, "trang cu gui ?token= van dung");
    const managerQ3 = await loginAdmin(app, "quanly.q3", "matkhau123");
    assert.equal((await request(app).get(`/api/admin/live-chat?conversationId=${id}`).set("Cookie", managerQ3)).status, 404);
  });
});

describe("cài đặt cửa hàng", () => {
  test("thông tin công khai lấy từ CSDL, tên phương thức thanh toán tạo từ tài khoản ngân hàng", async () => {
    const response = await request(app).get("/api/settings");
    assert.equal(response.status, 200);
    assert.equal(response.body.settings.hotline, "0384.589.559");
    assert.equal(response.body.settings.paymentMethods.bankTransfer, HOME.paymentMethod);
  });

  test("chỉ Giám đốc được sửa", async () => {
    const manager = await loginAdmin(app, "quanly.q1", "matkhau123");
    const denied = await request(app).put("/api/admin/settings").set("Cookie", manager).send({ settings: { storeName: "X" } });
    assert.equal(denied.status, 403);
  });

  test("đổi tài khoản nhận tiền thì đơn mới dùng tài khoản mới, QR theo tài khoản mới", async () => {
    const owner = await loginAdmin(app, "admin", "owner-password-123");
    const current = (await request(app).get("/api/admin/settings").set("Cookie", owner)).body.settings;
    const bad = await request(app).put("/api/admin/settings").set("Cookie", owner)
      .send({ settings: { ...current, bank: { ...current.bank, code: "ngan-hang-khong-co" } } });
    assert.equal(bad.status, 400);

    const saved = await request(app).put("/api/admin/settings").set("Cookie", owner)
      .send({ settings: { ...current, bank: { ...current.bank, accountNumber: "9876543210" } } });
    assert.equal(saved.status, 200, saved.text);
    try {
      const label = (await request(app).get("/api/settings")).body.settings.paymentMethods.bankTransfer;
      assert.equal(label, "Chuyển khoản BIDV 24/7 - 9876543210");
      const oldLabel = await order({ ...HOME, items: [IPHONE_17] });
      assert.equal(oldLabel.status, 400, "tên phương thức cũ không còn hợp lệ");
      const placed = await order({ ...HOME, paymentMethod: label, items: [IPHONE_17] });
      assert.equal(placed.status, 200, placed.text);
    } finally {
      await request(app).put("/api/admin/settings").set("Cookie", owner).send({ settings: current });
    }
  });
});

describe("lỗi review lần 2", () => {
  test("đổi X-Forwarded-For không vượt được giới hạn đăng nhập", async () => {
    let last = 0;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await request(app).post("/api/admin/session")
        // Khach gia IP o dau chuoi; proxy that (Vercel/Nginx) noi IP that vao cuoi.
        .set("X-Forwarded-For", `10.0.0.${attempt}, 203.0.113.9`).send({ username: "admin", password: "sai-mat-khau" });
      last = response.status;
    }
    assert.equal(last, 429);
  });

  test("API sản phẩm công khai không lộ giá nhập, serial, mã vạch", async () => {
    const [row] = await db.select().from(products).where(eq(products.slug, "iphone-17-256gb"));
    await db.update(products).set({
      costPrice: "15.000.000đ",
      variants: row.variants.map((variant) => ({ ...variant, costPrice: "15.000.000đ", serials: ["SN-BI-MAT"], barcode: "893000" })),
    }).where(eq(products.slug, "iphone-17-256gb"));
    const detail = await request(app).get("/api/products/iphone-17");
    const list = await request(app).get("/api/products?category=iphone");
    for (const text of [detail.text, list.text]) {
      assert.doesNotMatch(text, /costPrice|SN-BI-MAT|893000/);
    }
  });

  test("màu gõ không dấu vẫn tính đúng giá biến thể", async () => {
    const product = (await request(app).get("/api/products/iphone-17")).body.product;
    const variant = product.variants.find((item: { color?: string }) => /[^\x00-\x7F]/.test(item.color ?? ""));
    const plain = variant.color.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
    const placed = await order({ ...HOME, items: [{ productSlug: "iphone-17", storage: variant.storage, color: plain }] });
    assert.equal(placed.status, 200, placed.text);
    assert.equal(placed.body.total, Number(variant.price.replace(/\D/g, "")));
  });
});
