/**
 * Luoc do PostgreSQL cua Infinity Store.
 *
 * Chuyen tu ban Cloudflare D1 (SQLite), giu nguyen bang, khoa ngoai va rang buoc:
 * - Khoa chinh UUID dang text; thoi gian la so mili-giay (Date.now()) kieu bigint.
 * - Tien la so nguyen VND (bigint).
 * - Co dung/sai doi tu INTEGER 0/1 sang boolean.
 * - Cot "<x>_json" cu doi thanh jsonb "<x>".
 * - Tham chieu tuy chon dung NULL de khoa ngoai hoat dong.
 * Bang api_rate_limits va schema_migrations cua ban cu khong can nua
 * (gioi han tan suat chay trong Express, Drizzle tu quan ly migration).
 */
import { relations, sql } from "drizzle-orm";
import { bigint, boolean, check, index, integer, jsonb, pgTable, primaryKey, text, uniqueIndex } from "drizzle-orm/pg-core";
import type { CartItem, OrderItem, ProductColor, ProductMediaLink, ProductVariant, StoreSettings } from "../types";

const epochMs = (name: string) => bigint(name, { mode: "number" });
const vnd = (name: string) => bigint(name, { mode: "number" });

// ---------------------------------------------------------------------------
// Chi nhanh va nhan vien
// ---------------------------------------------------------------------------
export const branches = pgTable("branches", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull().default(""),
  hours: text("hours").notNull().default("08:00–22:00"),
  active: boolean("active").notNull().default(true),
  createdAt: epochMs("created_at").notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  role: text("role").notNull().default("sales"),
  /** Ten chi nhanh luu kem de hien thi nhanh; dong bo khi doi ten chi nhanh. */
  branch: text("branch").notNull().default(""),
  branchId: text("branch_id").references(() => branches.id, { onUpdate: "cascade", onDelete: "set null" }),
  active: boolean("active").notNull().default(true),
  createdAt: epochMs("created_at").notNull(),
}, (table) => [
  uniqueIndex("admin_users_username_idx").on(sql`lower(${table.username})`),
  index("admin_users_branch_idx").on(table.branchId, table.active),
  check("admin_users_role_check", sql`${table.role} IN ('owner', 'manager', 'sales', 'consultant', 'warranty', 'repair', 'inventory')`),
]);

export const adminUserSessions = pgTable("admin_user_sessions", {
  id: text("id").primaryKey(),
  adminUserId: text("admin_user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: epochMs("expires_at").notNull(),
  createdAt: epochMs("created_at").notNull(),
}, (table) => [index("admin_user_sessions_user_idx").on(table.adminUserId)]);

export const branchCameras = pgTable("branch_cameras", {
  id: text("id").primaryKey(),
  branchId: text("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  location: text("location").notNull().default(""),
  streamUrl: text("stream_url").notNull(),
  streamType: text("stream_type").notNull().default("embed"),
  active: boolean("active").notNull().default(true),
  createdAt: epochMs("created_at").notNull(),
}, (table) => [
  index("branch_cameras_branch_idx").on(table.branchId, table.active),
  check("branch_cameras_stream_type_check", sql`${table.streamType} IN ('embed', 'video', 'snapshot')`),
]);

export const cameraBranchPermissions = pgTable("camera_branch_permissions", {
  id: text("id").primaryKey(),
  adminUserId: text("admin_user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  branchId: text("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  createdAt: epochMs("created_at").notNull(),
}, (table) => [
  uniqueIndex("camera_permission_unique_idx").on(table.adminUserId, table.branchId),
  index("camera_permission_branch_idx").on(table.branchId),
]);

// ---------------------------------------------------------------------------
// Nhan su: ho so, cham cong, passkey, bang luong, cong viec
// ---------------------------------------------------------------------------
export const employeeProfiles = pgTable("employee_profiles", {
  /** Quan he 1-1 voi admin_users. Cac cot *_encrypted ma hoa AES-GCM bang HR_DATA_KEY. */
  adminUserId: text("admin_user_id").primaryKey().references(() => adminUsers.id, { onDelete: "cascade" }),
  dateOfBirth: text("date_of_birth").notNull().default(""),
  joinedDate: text("joined_date").notNull().default(""),
  citizenIdEncrypted: text("citizen_id_encrypted").notNull().default(""),
  permanentAddressEncrypted: text("permanent_address_encrypted").notNull().default(""),
  temporaryAddressEncrypted: text("temporary_address_encrypted").notNull().default(""),
  photoKey: text("photo_key").notNull().default(""),
  bankName: text("bank_name").notNull().default(""),
  bankAccountNameEncrypted: text("bank_account_name_encrypted").notNull().default(""),
  bankAccountNumberEncrypted: text("bank_account_number_encrypted").notNull().default(""),
  monthlySalary: vnd("monthly_salary").notNull().default(0),
  updatedAt: epochMs("updated_at").notNull(),
}, (table) => [check("employee_profiles_salary_check", sql`${table.monthlySalary} >= 0`)]);

export const employeeAttendance = pgTable("employee_attendance", {
  id: text("id").primaryKey(),
  adminUserId: text("admin_user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  workDate: text("work_date").notNull(),
  checkIn: text("check_in").notNull().default(""),
  checkOut: text("check_out").notNull().default(""),
  status: text("status").notNull().default("present"),
  note: text("note").notNull().default(""),
  recordedBy: text("recorded_by").notNull().default(""),
  createdAt: epochMs("created_at").notNull(),
  updatedAt: epochMs("updated_at").notNull(),
}, (table) => [
  uniqueIndex("employee_attendance_user_date_idx").on(table.adminUserId, table.workDate),
  index("employee_attendance_date_idx").on(table.workDate, table.adminUserId),
  check("employee_attendance_date_check", sql`${table.workDate} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'`),
]);

export const employeeAttendancePasskeys = pgTable("employee_attendance_passkeys", {
  id: text("id").primaryKey(),
  adminUserId: text("admin_user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  publicKey: text("public_key").notNull(),
  counter: bigint("counter", { mode: "number" }).notNull().default(0),
  transports: jsonb("transports").$type<string[]>().notNull().default([]),
  deviceType: text("device_type").notNull().default("singleDevice"),
  backedUp: boolean("backed_up").notNull().default(false),
  createdAt: epochMs("created_at").notNull(),
  lastUsedAt: epochMs("last_used_at").notNull().default(0),
}, (table) => [
  index("employee_attendance_passkeys_user_idx").on(table.adminUserId, table.createdAt),
  check("employee_attendance_passkeys_counter_check", sql`${table.counter} >= 0`),
]);

export const employeeAttendanceChallenges = pgTable("employee_attendance_challenges", {
  id: text("id").primaryKey(),
  adminUserId: text("admin_user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  challenge: text("challenge").notNull(),
  expiresAt: epochMs("expires_at").notNull(),
  createdAt: epochMs("created_at").notNull(),
}, (table) => [index("employee_attendance_challenges_user_idx").on(table.adminUserId, table.expiresAt)]);

export const employeePayrollRecords = pgTable("employee_payroll_records", {
  id: text("id").primaryKey(),
  adminUserId: text("admin_user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  payrollMonth: text("payroll_month").notNull(),
  baseSalary: vnd("base_salary").notNull().default(0),
  payableAmount: vnd("payable_amount").notNull().default(0),
  bonusAmount: vnd("bonus_amount").notNull().default(0),
  socialInsuranceAmount: vnd("social_insurance_amount").notNull().default(0),
  personalIncomeTaxAmount: vnd("personal_income_tax_amount").notNull().default(0),
  workDays: integer("work_days").notNull().default(0),
  status: text("status").notNull().default("draft"),
  paidAt: epochMs("paid_at").notNull().default(0),
  note: text("note").notNull().default(""),
  updatedAt: epochMs("updated_at").notNull(),
}, (table) => [
  uniqueIndex("employee_payroll_user_month_idx").on(table.adminUserId, table.payrollMonth),
  index("employee_payroll_month_idx").on(table.payrollMonth, table.status),
  check("employee_payroll_month_check", sql`${table.payrollMonth} ~ '^[0-9]{4}-[0-9]{2}$'`),
  check("employee_payroll_amounts_check", sql`${table.baseSalary} >= 0 AND ${table.payableAmount} >= 0 AND ${table.bonusAmount} >= 0
    AND ${table.socialInsuranceAmount} >= 0 AND ${table.personalIncomeTaxAmount} >= 0`),
  check("employee_payroll_work_days_check", sql`${table.workDays} BETWEEN 0 AND 31`),
]);

export const workTasks = pgTable("work_tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  priority: text("priority").notNull().default("normal"),
  dueDate: text("due_date").notNull().default(""),
  status: text("status").notNull().default("assigned"),
  branchId: text("branch_id").notNull().default(""),
  branchName: text("branch_name").notNull().default(""),
  assignedTo: text("assigned_to").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  assignedName: text("assigned_name").notNull(),
  createdBy: text("created_by").notNull(),
  createdByName: text("created_by_name").notNull(),
  attachmentKey: text("attachment_key").notNull().default(""),
  attachmentName: text("attachment_name").notNull().default(""),
  attachmentType: text("attachment_type").notNull().default(""),
  createdAt: epochMs("created_at").notNull(),
  updatedAt: epochMs("updated_at").notNull(),
}, (table) => [
  index("work_tasks_assignee_idx").on(table.assignedTo, table.status, table.dueDate),
  index("work_tasks_branch_idx").on(table.branchId, table.status, table.dueDate),
]);

export const workTaskReports = pgTable("work_task_reports", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => workTasks.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  message: text("message").notNull(),
  progress: integer("progress").notNull().default(0),
  attachmentKey: text("attachment_key").notNull().default(""),
  attachmentName: text("attachment_name").notNull().default(""),
  attachmentType: text("attachment_type").notNull().default(""),
  createdAt: epochMs("created_at").notNull(),
}, (table) => [
  index("work_task_reports_task_idx").on(table.taskId, table.createdAt),
  check("work_task_reports_progress_check", sql`${table.progress} BETWEEN 0 AND 100`),
]);

// ---------------------------------------------------------------------------
// San pham, kho, luot xem
// ---------------------------------------------------------------------------
export const products = pgTable("products", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  category: text("category").notNull(),
  sku: text("sku").notNull().default(""),
  description: text("description").notNull().default(""),
  image: text("image").notNull(),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  badge: text("badge").notNull().default(""),
  tagline: text("tagline").notNull().default(""),
  /** Nhan gia hien thi, vi du "Tu 25.990.000đ" hoac "Lien he". */
  price: text("price").notNull(),
  costPrice: text("cost_price").notNull().default(""),
  sellingPrice: text("selling_price").notNull().default(""),
  salePrice: text("sale_price").notNull().default(""),
  /** Gia ban thuc te (VND): so dau tien trong sale_price -> selling_price -> price; dung de sap xep/loc. */
  priceVnd: bigint("price_vnd", { mode: "number" }).generatedAlwaysAs(sql`NULLIF(left(regexp_replace(substring(
      COALESCE(NULLIF(sale_price, ''), NULLIF(selling_price, ''), price) from '[0-9][0-9.,]*'), '[^0-9]', '', 'g'), 15), '')::bigint`),
  stock: integer("stock").notNull().default(0),
  status: text("status").notNull().default("active"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  condition: text("condition").notNull().default("new"),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  variants: jsonb("variants").$type<ProductVariant[]>().notNull().default([]),
  colors: jsonb("colors").$type<string[]>().notNull().default([]),
  specs: jsonb("specs").$type<string[]>().notNull().default([]),
  /** Mau/dung luong de chon khi san pham chua co bien the (co bien the thi lay tu bien the). */
  colorOptions: jsonb("color_options").$type<ProductColor[]>().notNull().default([]),
  storageOptions: jsonb("storage_options").$type<string[]>().notNull().default([]),
  /** Link gioi thieu (trang Apple, video...) hien o trang chi tiet. */
  mediaLinks: jsonb("media_links").$type<ProductMediaLink[]>().notNull().default([]),
  /** Thu tu trong trang danh muc (nho dung truoc); rong thi xep theo noi bat/ngay tao. */
  sortOrder: integer("sort_order"),
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
  source: text("source").notNull().default(""),
  createdAt: epochMs("created_at").notNull(),
  updatedAt: epochMs("updated_at").notNull(),
}, (table) => [
  index("products_category_active_idx").on(table.category, table.active),
  index("products_price_vnd_idx").on(table.priceVnd),
  check("products_stock_check", sql`${table.stock} >= 0`),
  check("products_status_check", sql`${table.status} IN ('draft', 'active', 'inactive')`),
  check("products_condition_check", sql`${table.condition} IN ('new', 'like-new')`),
]);

export const branchInventory = pgTable("branch_inventory", {
  branchId: text("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(0),
  updatedAt: epochMs("updated_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.branchId, table.productId] }),
  index("branch_inventory_branch_idx").on(table.branchId, table.updatedAt),
  index("branch_inventory_product_idx").on(table.productId),
  check("branch_inventory_quantity_check", sql`${table.quantity} >= 0`),
]);

/** Nhat ky kho: giu product_id/product_name dang anh chup de lich su khong mat khi xoa san pham. */
export const inventoryMovements = pgTable("inventory_movements", {
  id: text("id").primaryKey(),
  branchId: text("branch_id").notNull().references(() => branches.id, { onDelete: "restrict" }),
  productId: text("product_id").notNull(),
  productName: text("product_name").notNull(),
  operation: text("operation").notNull(),
  quantity: integer("quantity").notNull(),
  beforeQuantity: integer("before_quantity").notNull(),
  afterQuantity: integer("after_quantity").notNull(),
  note: text("note").notNull().default(""),
  actorId: text("actor_id").notNull(),
  actorName: text("actor_name").notNull(),
  createdAt: epochMs("created_at").notNull(),
}, (table) => [
  index("inventory_movements_branch_idx").on(table.branchId, table.createdAt),
  check("inventory_movements_operation_check", sql`${table.operation} IN ('receive', 'issue', 'count')`),
  check("inventory_movements_quantity_check", sql`${table.quantity} >= 0 AND ${table.beforeQuantity} >= 0 AND ${table.afterQuantity} >= 0`),
]);

/** Slug co the la ma dong may (khong phai san pham cu the) nen khong dat khoa ngoai. */
/** Cai dat cua hang (thong tin lien he, tai khoan nhan tien, ben ban tren hoa don): mot dong cho moi khoa. */
export const storeSettings = pgTable("store_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<StoreSettings>().notNull(),
  updatedBy: text("updated_by").notNull().default(""),
  updatedAt: epochMs("updated_at").notNull(),
});

/**
 * Bo dem gioi han dang nhap / OTP (5 lan / 15 phut). Nam trong CSDL vi Vercel chay nhieu may chu cung luc:
 * dem trong bo nho thi moi may dem rieng, gioi han that long hon con so cau hinh.
 */
export const rateLimitBuckets = pgTable("rate_limit_buckets", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: epochMs("reset_at").notNull(),
}, (table) => [index("rate_limit_buckets_reset_idx").on(table.resetAt)]);

export const productViews = pgTable("product_views", {
  id: text("id").primaryKey(),
  productSlug: text("product_slug").notNull(),
  visitorId: text("visitor_id").notNull(),
  viewedAt: epochMs("viewed_at").notNull(),
}, (table) => [
  index("product_views_slug_date_idx").on(table.productSlug, table.viewedAt),
  index("product_views_visitor_idx").on(table.visitorId, table.productSlug, table.viewedAt),
]);

// ---------------------------------------------------------------------------
// Khach hang
// ---------------------------------------------------------------------------
export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  username: text("username").notNull().default(""),
  avatarUrl: text("avatar_url").notNull().default(""),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  provider: text("provider").notNull().default("password"),
  googleSub: text("google_sub").notNull().default(""),
  emailVerified: boolean("email_verified").notNull().default(false),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  profileCompleted: boolean("profile_completed").notNull().default(true),
  verificationChannel: text("verification_channel").notNull().default("email"),
  createdAt: epochMs("created_at").notNull(),
}, (table) => [
  uniqueIndex("customers_google_sub_idx").on(table.googleSub).where(sql`${table.googleSub} <> ''`),
  uniqueIndex("customers_username_idx").on(sql`lower(${table.username})`).where(sql`${table.username} <> ''`),
]);

/**
 * Gio hang cua khach thanh vien: mot dong moi khach, cac mon nam trong jsonb (toi da 20 dong).
 * Luu tren may chu de dang nhap may khac van thay gio. Gia trong gio chi de hien thi -
 * dat hang luon tinh lai gia tu CSDL.
 */
export const customerCarts = pgTable("customer_carts", {
  customerId: text("customer_id").primaryKey().references(() => customers.id, { onDelete: "cascade" }),
  items: jsonb("items").$type<CartItem[]>().notNull().default([]),
  updatedAt: epochMs("updated_at").notNull(),
});

export const customerSessions = pgTable("customer_sessions", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: epochMs("expires_at").notNull(),
  createdAt: epochMs("created_at").notNull(),
}, (table) => [index("customer_sessions_customer_idx").on(table.customerId)]);

export const customerVerificationSessions = pgTable("customer_verification_sessions", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  channel: text("channel").notNull(),
  destination: text("destination").notNull(),
  expiresAt: epochMs("expires_at").notNull(),
  createdAt: epochMs("created_at").notNull(),
}, (table) => [index("customer_verification_customer_idx").on(table.customerId)]);

export const customerPasswordResetSessions = pgTable("customer_password_reset_sessions", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  channel: text("channel").notNull(),
  destination: text("destination").notNull(),
  expiresAt: epochMs("expires_at").notNull(),
  verifiedAt: epochMs("verified_at").notNull().default(0),
  attempts: integer("attempts").notNull().default(0),
  createdAt: epochMs("created_at").notNull(),
}, (table) => [
  index("customer_password_reset_customer_idx").on(table.customerId, table.createdAt),
  check("customer_password_reset_attempts_check", sql`${table.attempts} >= 0`),
]);

export const studentVerifications = pgTable("student_verifications", {
  id: text("id").primaryKey(),
  /** Moi khach hang co toi da mot ho so xac minh (quan he 1-1). */
  customerId: text("customer_id").notNull().unique().references(() => customers.id, { onDelete: "cascade" }),
  school: text("school").notNull(),
  studentCode: text("student_code").notNull(),
  graduationYear: text("graduation_year").notNull().default(""),
  faculty: text("faculty").notNull().default(""),
  documentKey: text("document_key").notNull(),
  documentName: text("document_name").notNull().default(""),
  documentType: text("document_type").notNull().default(""),
  status: text("status").notNull().default("pending"),
  reviewNote: text("review_note").notNull().default(""),
  reviewedBy: text("reviewed_by").notNull().default(""),
  reviewedByName: text("reviewed_by_name").notNull().default(""),
  createdAt: epochMs("created_at").notNull(),
  updatedAt: epochMs("updated_at").notNull(),
  reviewedAt: epochMs("reviewed_at").notNull().default(0),
}, (table) => [
  index("student_verifications_status_idx").on(table.status, table.updatedAt),
  check("student_verifications_status_check", sql`${table.status} IN ('pending', 'approved', 'rejected')`),
]);

// ---------------------------------------------------------------------------
// Don hang, thanh toan, voucher
// ---------------------------------------------------------------------------
export const vouchers = pgTable("vouchers", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(),
  value: vnd("value").notNull(),
  minOrder: vnd("min_order").notNull().default(0),
  maxDiscount: vnd("max_discount").notNull().default(0),
  usageLimit: integer("usage_limit").notNull().default(0),
  usedCount: integer("used_count").notNull().default(0),
  startsAt: epochMs("starts_at").notNull().default(0),
  expiresAt: epochMs("expires_at").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: epochMs("created_at").notNull(),
}, (table) => [
  check("vouchers_type_check", sql`${table.type} IN ('percent', 'fixed')`),
  check("vouchers_value_check", sql`${table.value} > 0 AND (${table.type} <> 'percent' OR ${table.value} <= 100)`),
  check("vouchers_amounts_check", sql`${table.minOrder} >= 0 AND ${table.maxDiscount} >= 0 AND ${table.usageLimit} >= 0 AND ${table.usedCount} >= 0`),
  check("vouchers_period_check", sql`${table.expiresAt} = 0 OR ${table.expiresAt} >= ${table.startsAt}`),
]);

export const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipping", "delivered", "cancelled", "returned"] as const;
export const PAYMENT_STATUSES = ["not_required", "unpaid", "paid", "refunded", "failed"] as const;

/**
 * Don hang luu "anh chup" thong tin khach, san pham, chi nhanh tai thoi diem dat
 * de hoa don khong doi khi du lieu goc thay doi.
 */
export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  orderCode: text("order_code").notNull().unique(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull().default(""),
  productSlug: text("product_slug").notNull().default(""),
  productName: text("product_name").notNull(),
  color: text("color").notNull().default(""),
  storage: text("storage").notNull().default(""),
  quantity: integer("quantity").notNull().default(1),
  deliveryMethod: text("delivery_method").notNull().default(""),
  address: text("address").notNull().default(""),
  paymentMethod: text("payment_method").notNull().default(""),
  contactTime: text("contact_time").notNull().default(""),
  note: text("note").notNull().default(""),
  status: text("status").notNull().default("pending"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  total: vnd("total").notNull().default(0),
  shippingFee: vnd("shipping_fee").notNull().default(0),
  discount: vnd("discount").notNull().default(0),
  financeCompany: text("finance_company").notNull().default(""),
  installmentName: text("installment_name").notNull().default(""),
  installmentPhone: text("installment_phone").notNull().default(""),
  dateOfBirth: text("date_of_birth").notNull().default(""),
  citizenId: text("citizen_id").notNull().default(""),
  citizenIdIssueDate: text("citizen_id_issue_date").notNull().default(""),
  citizenIdIssuePlace: text("citizen_id_issue_place").notNull().default(""),
  downPaymentPercent: integer("down_payment_percent").notNull().default(0),
  downPaymentAmount: vnd("down_payment_amount").notNull().default(0),
  financedAmount: vnd("financed_amount").notNull().default(0),
  installmentTerm: integer("installment_term").notNull().default(0),
  monthlyPayment: vnd("monthly_payment").notNull().default(0),
  estimatedInterest: vnd("estimated_interest").notNull().default(0),
  /** NULL = khach vang lai (khong dang nhap). */
  customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
  voucherCode: text("voucher_code").notNull().default(""),
  items: jsonb("items").$type<OrderItem[]>().notNull().default([]),
  invoiceStatus: text("invoice_status").notNull().default("not_created"),
  invoiceNumber: text("invoice_number").notNull().default(""),
  invoiceTemplateCode: text("invoice_template_code").notNull().default(""),
  invoiceSeries: text("invoice_series").notNull().default(""),
  invoiceDate: text("invoice_date").notNull().default(""),
  invoiceBuyerType: text("invoice_buyer_type").notNull().default("individual"),
  invoiceBuyerName: text("invoice_buyer_name").notNull().default(""),
  invoiceCompanyName: text("invoice_company_name").notNull().default(""),
  invoiceTaxCode: text("invoice_tax_code").notNull().default(""),
  invoiceAddress: text("invoice_address").notNull().default(""),
  invoiceEmail: text("invoice_email").notNull().default(""),
  invoiceSellerName: text("invoice_seller_name").notNull().default(""),
  invoiceSellerTaxCode: text("invoice_seller_tax_code").notNull().default(""),
  invoiceSellerAddress: text("invoice_seller_address").notNull().default(""),
  invoiceSellerPhone: text("invoice_seller_phone").notNull().default(""),
  invoiceTaxRate: integer("invoice_tax_rate").notNull().default(0),
  invoiceTaxIncluded: boolean("invoice_tax_included").notNull().default(true),
  invoiceNote: text("invoice_note").notNull().default(""),
  warrantyMonths: integer("warranty_months").notNull().default(12),
  warrantyStartDate: text("warranty_start_date").notNull().default(""),
  warrantySerials: text("warranty_serials").notNull().default(""),
  warrantyPolicy: text("warranty_policy").notNull().default(""),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "set null" }),
  branchName: text("branch_name").notNull().default(""),
  assignedAdminId: text("assigned_admin_id").references(() => adminUsers.id, { onDelete: "set null" }),
  assignedAdminName: text("assigned_admin_name").notNull().default(""),
  createdAt: epochMs("created_at").notNull(),
}, (table) => [
  index("orders_created_at_idx").on(table.createdAt),
  index("orders_customer_idx").on(table.customerId, table.createdAt),
  index("orders_branch_created_idx").on(table.branchId, table.createdAt),
  index("orders_assigned_admin_idx").on(table.assignedAdminId, table.createdAt),
  index("orders_status_idx").on(table.status, table.createdAt),
  check("orders_quantity_check", sql`${table.quantity} > 0`),
  check("orders_status_check", sql`${table.status} IN ('pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled', 'returned')`),
  check("orders_payment_status_check", sql`${table.paymentStatus} IN ('not_required', 'unpaid', 'paid', 'refunded', 'failed')`),
  check("orders_money_check", sql`${table.total} >= 0 AND ${table.shippingFee} >= 0 AND ${table.discount} >= 0
    AND ${table.downPaymentAmount} >= 0 AND ${table.financedAmount} >= 0 AND ${table.monthlyPayment} >= 0
    AND ${table.estimatedInterest} >= 0`),
  check("orders_down_payment_check", sql`${table.downPaymentPercent} BETWEEN 0 AND 100`),
  check("orders_invoice_check", sql`${table.invoiceTaxRate} BETWEEN 0 AND 100`),
]);

/** Giao dich ngan hang tu webhook; doi soat voi orders qua order_code (co the den truoc khi don duoc tao). */
export const bankPaymentEvents = pgTable("bank_payment_events", {
  id: text("id").primaryKey(),
  orderCode: text("order_code").notNull(),
  amount: vnd("amount").notNull(),
  description: text("description").notNull().default(""),
  accountNumber: text("account_number").notNull().default(""),
  createdAt: epochMs("created_at").notNull(),
}, (table) => [
  index("bank_payment_events_order_code_idx").on(table.orderCode),
  check("bank_payment_events_amount_check", sql`${table.amount} >= 0`),
]);

// ---------------------------------------------------------------------------
// Ho tro truc tuyen
// ---------------------------------------------------------------------------
export const liveChatConversations = pgTable("live_chat_conversations", {
  id: text("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  token: text("token").notNull().unique(),
  status: text("status").notNull().default("waiting"),
  assignedAdmin: text("assigned_admin").notNull().default(""),
  branchId: text("branch_id").notNull().default(""),
  branchName: text("branch_name").notNull().default(""),
  createdAt: epochMs("created_at").notNull(),
  updatedAt: epochMs("updated_at").notNull(),
}, (table) => [index("live_chat_conversations_branch_idx").on(table.branchId, table.status, table.updatedAt)]);

export const liveChatMessages = pgTable("live_chat_messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => liveChatConversations.id, { onDelete: "cascade" }),
  sender: text("sender").notNull(),
  senderName: text("sender_name").notNull().default(""),
  text: text("text").notNull(),
  createdAt: epochMs("created_at").notNull(),
}, (table) => [
  index("live_chat_messages_conversation_idx").on(table.conversationId, table.createdAt),
  check("live_chat_messages_sender_check", sql`${table.sender} IN ('customer', 'admin', 'system')`),
]);

// ---------------------------------------------------------------------------
// Quan he (cho db.query.*.findMany({ with: ... }))
// ---------------------------------------------------------------------------
export const branchesRelations = relations(branches, ({ many }) => ({
  staff: many(adminUsers),
  cameras: many(branchCameras),
  inventory: many(branchInventory),
  orders: many(orders),
}));

export const adminUsersRelations = relations(adminUsers, ({ one, many }) => ({
  branchRef: one(branches, { fields: [adminUsers.branchId], references: [branches.id] }),
  profile: one(employeeProfiles, { fields: [adminUsers.id], references: [employeeProfiles.adminUserId] }),
  attendance: many(employeeAttendance),
  payroll: many(employeePayrollRecords),
  tasks: many(workTasks),
}));

export const employeeProfilesRelations = relations(employeeProfiles, ({ one }) => ({
  user: one(adminUsers, { fields: [employeeProfiles.adminUserId], references: [adminUsers.id] }),
}));

export const workTasksRelations = relations(workTasks, ({ one, many }) => ({
  assignee: one(adminUsers, { fields: [workTasks.assignedTo], references: [adminUsers.id] }),
  reports: many(workTaskReports),
}));

export const workTaskReportsRelations = relations(workTaskReports, ({ one }) => ({
  task: one(workTasks, { fields: [workTaskReports.taskId], references: [workTasks.id] }),
}));

export const liveChatConversationsRelations = relations(liveChatConversations, ({ many }) => ({
  messages: many(liveChatMessages),
}));

export const liveChatMessagesRelations = relations(liveChatMessages, ({ one }) => ({
  conversation: one(liveChatConversations, { fields: [liveChatMessages.conversationId], references: [liveChatConversations.id] }),
}));
