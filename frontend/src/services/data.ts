import "server-only";
import { cache } from "react";
import { api, ApiError, orUndefined } from "@/src/services/api";
import type {
  AdminUser, AttendanceRecord, Branch, BranchAvailability, BranchInventoryItem, Camera, CameraPermission, Customer,
  EmployeeDirectoryEntry, EmployeeProfile, InventoryMovement, LiveConversation, ManagedOrder, ManagedProduct,
  PayrollEmployee, PayrollRecord, ProductCategory, PublicStoreSettings, StoreSettings, StudentVerification, Voucher,
  WorkReport, WorkTask,
} from "@/src/types";
import { EMPTY_STORE_SETTINGS } from "@/src/lib/store-settings";

// Ham doc du lieu cho server component. Giu dung ten va cach goi cua cac ham trong db/*.ts
// ban cu de cac trang khong phai sua; ben trong goi API backend.
// cache(): trong cung mot lan render, goi lap lai cung tham so chi gui mot request.

const get = cache(<T,>(path: string) => api<T>(path));

// ---- Thong tin cua hang (trang quan tri > Cai dat cua hang) ----

/** Backend loi thi tra thong tin rong de trang van hien (footer/so dien thoai de trong). */
export async function getStoreSettings(): Promise<PublicStoreSettings> {
  try {
    return (await get<{ settings: PublicStoreSettings }>("/settings")).settings;
  } catch {
    return EMPTY_STORE_SETTINGS;
  }
}

export async function getEditableStoreSettings() {
  return (await get<{ settings: StoreSettings }>("/admin/settings")).settings;
}

// ---- San pham ----

export async function getPublicProducts(category?: ProductCategory) {
  return (await get<{ products: ManagedProduct[] }>(`/products${category ? `?category=${encodeURIComponent(category)}` : ""}`)).products;
}

/** Ban rut gon cho chatbot o layout goc (moi trang deu goi). */
export async function getChatbotProducts() {
  return (await get<{ products: Array<Pick<ManagedProduct, "slug" | "name" | "brand" | "price" | "tagline" | "stock" | "active">> }>("/products?view=summary")).products;
}

export async function getProductBySlug(slug: string) {
  return orUndefined(async () => (await get<{ product: ManagedProduct }>(`/products/${encodeURIComponent(slug)}`)).product);
}

export async function getProductBranchAvailability(slug: string) {
  return (await get<{ branches: BranchAvailability[] }>(`/products/${encodeURIComponent(slug)}/availability`)).branches;
}

export async function getManagedProducts() {
  return (await get<{ products: ManagedProduct[] }>("/admin/products")).products;
}

export async function getManagedProductById(id: string) {
  return orUndefined(async () => (await get<{ product: ManagedProduct }>(`/admin/products/${encodeURIComponent(id)}`)).product);
}


// ---- Chi nhanh, nhan vien ----

/** Khach (khong dang nhap) chi xem duoc chi nhanh dang hoat dong. */
export async function getBranches(includeInactive = true): Promise<Branch[]> {
  if (!includeInactive) return (await get<{ branches: Branch[] }>("/branches")).branches;
  try {
    return (await get<{ branches: Branch[] }>("/admin/branches")).branches;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return (await get<{ branches: Branch[] }>("/branches")).branches;
    throw error;
  }
}

export async function getBranchById(id: string) {
  return orUndefined(async () => (await get<{ branch: Branch }>(`/admin/branches/${encodeURIComponent(id)}`)).branch);
}

export async function getAdminUsers() {
  return (await get<{ users: AdminUser[] }>("/admin/staff")).users;
}

// ---- Don hang, khach, voucher ----

export async function getManagedOrders() {
  return (await get<{ orders: ManagedOrder[] }>("/admin/orders")).orders;
}

export async function getReportingOrders() {
  return (await get<{ orders: ManagedOrder[] }>("/admin/reports/orders")).orders;
}

export async function getManagedOrderById(id: string) {
  return orUndefined(async () => (await get<{ order: ManagedOrder }>(`/admin/orders/${encodeURIComponent(id)}`)).order);
}

/** Hoa don cua chinh khach dang dang nhap. */
export async function getCustomerOrderById(id: string) {
  return orUndefined(async () => (await get<{ order: ManagedOrder }>(`/account/orders/${encodeURIComponent(id)}`)).order);
}

export async function getManagedCustomers() {
  return (await get<{ customers: Customer[] }>("/admin/customers")).customers;
}

export async function getManagedVouchers() {
  return (await get<{ vouchers: Voucher[] }>("/admin/vouchers")).vouchers;
}

export async function getProductViewStats() {
  return get<{ totalViews: number; uniqueVisitors: number; todayViews: number; todayVisitors: number; products: Array<{ slug: string; name: string; views: number; visitors: number }> }>(
    "/admin/reports/product-views",
  );
}

export async function getAdminConversations() {
  return (await get<{ conversations: LiveConversation[] }>("/admin/live-chat")).conversations;
}

// ---- Nhan su, cham cong, luong ----

export async function getEmployeeDirectory() {
  return (await get<{ employees: EmployeeDirectoryEntry[] }>("/admin/hr/employees")).employees;
}

const employeeDetail = cache((id: string) =>
  orUndefined(() => api<{ employee: EmployeeProfile; attendance: AttendanceRecord[] }>(`/admin/hr/employees/${encodeURIComponent(id)}`)));

export async function getEmployeeProfile(adminUserId: string) {
  return (await employeeDetail(adminUserId))?.employee;
}

export async function getEmployeeAttendance(adminUserId: string) {
  return (await employeeDetail(adminUserId))?.attendance ?? [];
}

export async function getAttendanceForDate(workDate: string) {
  return (await get<{ attendance: AttendanceRecord[] }>(`/admin/attendance?date=${encodeURIComponent(workDate)}`)).attendance;
}

export async function getAttendanceForMonth(month: string) {
  return (await get<{ attendance: AttendanceRecord[] }>(`/admin/attendance?month=${encodeURIComponent(month)}`)).attendance;
}

const payrollMonth = cache((month: string) =>
  api<{ month: string; employees: PayrollEmployee[]; records: PayrollRecord[]; attendance: AttendanceRecord[] }>(`/admin/payroll?month=${encodeURIComponent(month)}`));

export async function getPayrollEmployeeDirectory(month = vietnamDate().slice(0, 7)) {
  return (await payrollMonth(month)).employees;
}

export async function getPayrollRecords(month: string) {
  return (await payrollMonth(month)).records;
}

export async function getPayrollRecord(adminUserId: string, month: string) {
  return (await payrollMonth(month)).records.find((record) => record.adminUserId === adminUserId);
}

export function vietnamDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

// ---- Cong viec ----

const taskBoard = cache(() => api<{ tasks: WorkTask[]; reports: WorkReport[] }>("/admin/tasks"));

export async function getWorkTasks() {
  return (await taskBoard()).tasks;
}

export async function getWorkReports(taskIds: string[]) {
  const ids = new Set(taskIds);
  return (await taskBoard()).reports.filter((report) => ids.has(report.taskId));
}


// ---- Kho, camera, sinh vien ----

const inventoryView = cache((branchId: string) =>
  api<{ branch: Branch | null; items: BranchInventoryItem[]; movements: InventoryMovement[] }>(`/admin/inventory?branch=${encodeURIComponent(branchId)}`));

export async function getBranchInventory(branchId: string) {
  return (await inventoryView(branchId)).items;
}

export async function getInventoryMovements(branchId: string) {
  return (await inventoryView(branchId)).movements;
}

const cameraView = cache(() => api<{ cameras: Camera[]; permissions: CameraPermission[] }>("/admin/cameras"));

export async function getAccessibleCameras() {
  return (await cameraView()).cameras;
}

export async function getCameraPermissions() {
  return (await cameraView()).permissions;
}

export async function getStudentVerifications() {
  return (await get<{ verifications: StudentVerification[] }>("/admin/student-verifications")).verifications;
}
