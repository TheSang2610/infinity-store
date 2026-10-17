// Chuyen du lieu tu Cloudflare D1 (SQLite) sang PostgreSQL.
// Nhan file .sqlite/.db (ban sao CSDL) hoac .sql (lenh `wrangler d1 export`).
// Bang hay cot khong co trong ban cu thi bo qua / dung gia tri mac dinh.

import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { getTableColumns, type Table } from "drizzle-orm";
import { getDb } from "./client";
import * as schema from "./schema";

type SqliteRow = Record<string, unknown>;

// Thu tu: bang cha truoc bang co khoa ngoai.
const TABLES: Array<{ name: string; table: Table }> = [
  { name: "branches", table: schema.branches },
  { name: "admin_users", table: schema.adminUsers },
  { name: "admin_user_sessions", table: schema.adminUserSessions },
  { name: "branch_cameras", table: schema.branchCameras },
  { name: "camera_branch_permissions", table: schema.cameraBranchPermissions },
  { name: "employee_profiles", table: schema.employeeProfiles },
  { name: "employee_attendance", table: schema.employeeAttendance },
  { name: "employee_attendance_passkeys", table: schema.employeeAttendancePasskeys },
  { name: "employee_payroll_records", table: schema.employeePayrollRecords },
  { name: "work_tasks", table: schema.workTasks },
  { name: "work_task_reports", table: schema.workTaskReports },
  { name: "products", table: schema.products },
  { name: "branch_inventory", table: schema.branchInventory },
  { name: "inventory_movements", table: schema.inventoryMovements },
  { name: "product_views", table: schema.productViews },
  { name: "customers", table: schema.customers },
  { name: "customer_sessions", table: schema.customerSessions },
  { name: "customer_password_reset_sessions", table: schema.customerPasswordResetSessions },
  { name: "student_verifications", table: schema.studentVerifications },
  { name: "vouchers", table: schema.vouchers },
  { name: "orders", table: schema.orders },
  { name: "bank_payment_events", table: schema.bankPaymentEvents },
  { name: "live_chat_conversations", table: schema.liveChatConversations },
  { name: "live_chat_messages", table: schema.liveChatMessages },
];
// Bo qua co chu dich: api_rate_limits, schema_migrations, employee_attendance_challenges (het han sau 5 phut),
// customer_verification_sessions (het han sau 10 phut), _cf_METADATA.

// Cot JSON o ban cu ten "<x>_json", o ban moi ten "<x>" kieu jsonb.
const JSON_COLUMNS: Record<string, string> = {
  images: "images_json",
  tags: "tags_json",
  variants: "variants_json",
  colors: "colors_json",
  specs: "specs_json",
  items: "items_json",
  transports: "transports_json",
};

/** Cot khoa ngoai cho phep NULL: chuoi rong o ban cu doi thanh NULL. */
const NULLABLE_REFERENCES = new Set(["branch_id", "customer_id", "assigned_admin_id"]);

/** Tai khoan Giam doc ban cu la tai khoan ao co id "owner" (khong nam trong admin_users). */
export const OWNER_ID = "owner";

export function openD1Export(filePath: string) {
  if (/\.sql$/i.test(filePath)) {
    const db = new DatabaseSync(":memory:");
    db.exec(readFileSync(filePath, "utf8"));
    return db;
  }
  return new DatabaseSync(filePath, { readOnly: true });
}

export async function importD1(source: DatabaseSync, log: (line: string) => void = console.log) {
  const tables = tableNames(source);
  const summary: Record<string, number> = {};
  const importedIds: Record<string, Set<string>> = {};

  // Bang con chi giu dong co bang cha da nhap (du lieu cu co the con dong mo coi).
  const parents: Record<string, Array<[string, string]>> = {
    admin_user_sessions: [["admin_users", "adminUserId"]],
    camera_branch_permissions: [["admin_users", "adminUserId"], ["branches", "branchId"]],
    branch_cameras: [["branches", "branchId"]],
    employee_profiles: [["admin_users", "adminUserId"]],
    employee_attendance: [["admin_users", "adminUserId"]],
    employee_attendance_passkeys: [["admin_users", "adminUserId"]],
    employee_payroll_records: [["admin_users", "adminUserId"]],
    work_tasks: [["admin_users", "assignedTo"]],
    work_task_reports: [["work_tasks", "taskId"]],
    branch_inventory: [["branches", "branchId"], ["products", "productId"]],
    inventory_movements: [["branches", "branchId"]],
    customer_sessions: [["customers", "customerId"]],
    customer_password_reset_sessions: [["customers", "customerId"]],
    student_verifications: [["customers", "customerId"]],
    live_chat_messages: [["live_chat_conversations", "conversationId"]],
  };

  for (const { name, table } of TABLES) {
    if (!tables.has(name)) {
      log(`- ${name}: không có trong bản cũ, bỏ qua`);
      continue;
    }
    const rows = source.prepare(`SELECT * FROM "${name}"`).all() as SqliteRow[];
    const mapped = rows.map((row) => mapRow(table, row))
      .filter((row) => (parents[name] ?? []).every(([parent, key]) => importedIds[parent]?.has(String(row[key]))));

    if (name === "orders") {
      // Don tro toi chi nhanh/nhan vien/khach khong con ton tai thi bo lien ket, giu don.
      for (const row of mapped) {
        if (row.branchId && !importedIds.branches?.has(String(row.branchId))) row.branchId = null;
        if (row.customerId && !importedIds.customers?.has(String(row.customerId))) row.customerId = null;
        if (row.assignedAdminId && !importedIds.admin_users?.has(String(row.assignedAdminId))) row.assignedAdminId = null;
      }
    }
    if (name === "admin_users") {
      for (const row of mapped) {
        if (row.branchId && !importedIds.branches?.has(String(row.branchId))) row.branchId = null;
      }
      // Giam doc ban cu khong co dong trong admin_users; tao dong "owner" (chua co mat khau,
      // lenh seed se dat OWNER_PASSWORD) de du lieu tham chieu toi "owner" van dung.
      if (!mapped.some((row) => row.id === OWNER_ID)) {
        mapped.push({
          id: OWNER_ID, username: "admin", name: "Giám đốc", passwordHash: "", passwordSalt: "",
          role: "owner", branch: "Toàn hệ thống", branchId: null, active: true, createdAt: 0,
        });
      }
    }

    for (let start = 0; start < mapped.length; start += 200) {
      // Chay lai script khong nhan doi du lieu.
      await getDb().insert(table).values(mapped.slice(start, start + 200)).onConflictDoNothing();
    }
    importedIds[name] = new Set(mapped.map((row) => String(row.id ?? row.adminUserId ?? `${row.branchId}:${row.productId}`)));
    if (name === "products") importedIds.products = new Set(mapped.map((row) => String(row.id)));
    summary[name] = mapped.length;
    log(`- ${name}: ${mapped.length}/${rows.length} dòng`);
  }
  return summary;
}

/** Doi mot dong SQLite sang dang Drizzle can: 0/1 -> boolean, chuoi JSON -> mang, '' -> NULL o khoa ngoai. */
function mapRow(table: Table, row: SqliteRow): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, column] of Object.entries(getTableColumns(table))) {
    if (key === "priceVnd") continue; // cot tu sinh
    const sourceName = JSON_COLUMNS[column.name] ?? column.name;
    if (!(sourceName in row)) continue; // de mac dinh cua cot
    const value = row[sourceName];
    if (value === null || (value === "" && NULLABLE_REFERENCES.has(column.name) && !column.notNull)) {
      if (!column.notNull) result[key] = null;
      continue;
    }
    if (column.dataType === "boolean") result[key] = Number(value) === 1;
    else if (column.dataType === "json") result[key] = parseJsonArray(value);
    else if (column.dataType === "number") result[key] = Number(value) || 0;
    else result[key] = String(value);
  }
  if (table === schema.orders && result.status === "new") result.status = "pending";
  return result;
}

function parseJsonArray(value: unknown) {
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function tableNames(source: DatabaseSync) {
  return new Set((source.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as Array<{ name: string }>).map((row) => row.name));
}

/** Key anh/tep tren R2 cu dang duoc CSDL tham chieu (de chep sang kho moi). */
export function referencedStorageKeys(source: DatabaseSync) {
  const keys = new Set<string>();
  const tables = tableNames(source);
  const collectUrls = (text: unknown) => {
    for (const match of String(text ?? "").matchAll(/\/api\/product-images\/([a-zA-Z0-9._-]+)/g)) keys.add(match[1]);
  };
  const read = (table: string, columns: string) =>
    tables.has(table) ? source.prepare(`SELECT ${columns} FROM "${table}"`).all() as SqliteRow[] : [];

  for (const row of read("products", "image, images_json, variants_json")) Object.values(row).forEach(collectUrls);
  for (const row of read("customers", "avatar_url")) collectUrls(row.avatar_url);
  for (const row of read("orders", "items_json")) collectUrls(row.items_json);
  // Tep rieng tu luu bang key tran (khong qua /api/product-images).
  for (const row of read("employee_profiles", "photo_key")) if (row.photo_key) keys.add(String(row.photo_key));
  for (const row of read("work_tasks", "attachment_key")) if (row.attachment_key) keys.add(String(row.attachment_key));
  for (const row of read("work_task_reports", "attachment_key")) if (row.attachment_key) keys.add(String(row.attachment_key));
  for (const row of read("student_verifications", "document_key")) if (row.document_key) keys.add(String(row.document_key));
  return [...keys];
}
