import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { badRequest, forbidden, notFound, text } from "../utils/http";
import { canManageEmployee } from "../middlewares/auth";
import type { AdminUser, InventoryOperation } from "../types";
import { getBranches } from "../repositories/branch.repository";
import {
  createCamera, getAccessibleCameras, getCameraPermissions, grantCameraBranch, revokeCameraPermission, setCameraActive,
} from "../repositories/camera.repository";
import {
  getAttendanceForDate, getAttendanceForMonth, getEmployeeAttendance, getEmployeeDirectory, getEmployeePhotoKey,
  getEmployeeProfile, getPayrollEmployeeDirectory, saveAttendance, saveEmployeeProfile, vietnamDate,
} from "../repositories/hr.repository";
import { getPayrollRecord, getPayrollRecords, savePayrollRecord } from "../repositories/payroll.repository";
import { adjustBranchInventory, getBranchInventory, getInventoryMovements } from "../repositories/inventory.repository";
import { getManagedProductById } from "../services/product.service";
import {
  getStudentVerification, getStudentVerifications, reviewStudentVerification,
} from "../repositories/student-verification.repository";
import {
  addWorkReport, canAccessTask, completeWorkTask, createWorkTask, getTaskFile, getWorkReports, getWorkTask,
  getWorkTasks,
} from "../repositories/task.repository";
import { deleteFile, detectImageType, getFile, imageExtension, putFile } from "../services/file-storage.service";
import { getAdminUsers } from "../repositories/admin-user.repository";

const ID_PATTERN = /^[a-zA-Z0-9-]{3,80}$/;

/** Tep rieng tu: khong cho trinh duyet doan noi dung, khong cache. */
function sendPrivateFile(res: Response, file: { bytes: Buffer; contentType: string }, name: string, disposition: "inline" | "attachment") {
  res.set({
    "Content-Type": file.contentType,
    "Content-Disposition": `${disposition}; filename="file"; filename*=UTF-8''${encodeURIComponent(name || "file")}`,
    "Cache-Control": "private, no-store",
    "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'",
    "X-Content-Type-Options": "nosniff",
  });
  res.send(file.bytes);
}

// ---- Cong viec ----

const TASK_FILE_TYPES = new Set([
  "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain", "image/jpeg", "image/png", "image/webp", "application/zip", "application/x-zip-compressed",
]);

async function saveTaskFile(file: Express.Multer.File | undefined, prefix: string) {
  if (!file?.size) return { key: "", name: "", type: "" };
  if (!TASK_FILE_TYPES.has(file.mimetype)) throw badRequest("Chỉ nhận PDF, Office, TXT, ZIP hoặc ảnh JPG/PNG/WEBP.");
  const extension = file.originalname.split(".").pop()?.toLowerCase() ?? "";
  const key = `${prefix}/${randomUUID()}${/^[a-z0-9]{1,8}$/.test(extension) ? `.${extension}` : ""}`;
  await putFile(key, file.buffer, file.mimetype);
  return { key, name: file.originalname.trim().slice(0, 180), type: file.mimetype };
}

// ---- Kho chi nhanh ----

/** Giam doc chon chi nhanh bat ky; nguoi khac chi lam viec voi chi nhanh cua minh. */
function inventoryBranchId(user: AdminUser, requested: string) {
  return user.role === "owner" ? requested : user.branchId;
}

/** Ho so co CCCD, tai khoan ngan hang, luong: quan ly chi nhan nhan vien chi nhanh minh. */
export async function listEmployees(req: Request, res: Response) {
  const user = req.admin!;
  const employees = await getEmployeeDirectory();
  res.json({ employees: employees.filter((employee) => employee.adminUserId === user.id || canManageEmployee(user, employee)) });
}

export async function getEmployee(req: Request, res: Response) {
  const user = req.admin!;
  const employee = await getEmployeeProfile(String(req.params.id));
  if (!employee || (user.id !== employee.adminUserId && !canManageEmployee(user, employee))) throw notFound("Không tìm thấy nhân viên.");
  res.json({ employee, attendance: await getEmployeeAttendance(employee.adminUserId) });
}

export async function updateEmployee(req: Request, res: Response) {
  const user = req.admin!;
  const current = await getEmployeeProfile(String(req.params.id));
  if (!current) throw notFound("Không tìm thấy nhân viên.");
  if (!canManageEmployee(user, current)) throw forbidden("Bạn không có quyền cập nhật nhân viên ngoài chi nhánh của mình.");

  let photoKey = current.photoKey;
  let uploadedKey = "";
  if (req.file?.size) {
    const type = detectImageType(req.file.buffer);
    if (!["image/jpeg", "image/png", "image/webp"].includes(type)) throw badRequest("Ảnh nhân sự phải là tệp JPG, PNG hoặc WEBP hợp lệ.");
    uploadedKey = `hr-${current.adminUserId}-${randomUUID()}.${imageExtension(type)}`;
    await putFile(uploadedKey, req.file.buffer, type);
    photoKey = uploadedKey;
  }
  const field = (key: string) => text(req.body?.[key], 600);
  try {
    await saveEmployeeProfile({
      adminUserId: current.adminUserId,
      name: field("name"),
      dateOfBirth: field("dateOfBirth"),
      joinedDate: field("joinedDate"),
      citizenId: field("citizenId"),
      permanentAddress: field("permanentAddress"),
      temporaryAddress: field("temporaryAddress"),
      photoKey,
      bankName: field("bankName"),
      bankAccountName: field("bankAccountName"),
      bankAccountNumber: field("bankAccountNumber"),
      monthlySalary: Number(field("monthlySalary").replace(/\D/g, "")) || 0,
    });
  } catch (error) {
    if (uploadedKey) await deleteFile(uploadedKey);
    throw error;
  }
  if (uploadedKey && current.photoKey && current.photoKey !== uploadedKey) await deleteFile(current.photoKey);
  res.json({ ok: true });
}

export async function getEmployeePhoto(req: Request, res: Response) {
  const user = req.admin!;
  const id = String(req.params.id);
  if (!ID_PATTERN.test(id)) throw badRequest("Mã nhân viên không hợp lệ.");
  const employee = await getEmployeeProfile(id);
  if (!employee || (user.id !== id && !canManageEmployee(user, employee))) throw forbidden("Không có quyền truy cập.");
  const key = await getEmployeePhotoKey(id);
  const file = key ? await getFile(key) : undefined;
  if (!file) throw notFound("Chưa có ảnh nhân sự.");
  sendPrivateFile(res, file, "employee-photo", "inline");
}

export async function listAttendance(req: Request, res: Response) {
  const user = req.admin!;
  const date = text(req.query.date);
  const attendance = date ? await getAttendanceForDate(date) : await getAttendanceForMonth(text(req.query.month));
  if (user.role === "owner") {
    res.json({ attendance });
    return;
  }
  // Quan ly chi xem cham cong nhan vien chi nhanh minh (giong ban cu).
  const allowed = new Set((await getAdminUsers()).filter((employee) => canManageEmployee(user, employee)).map((employee) => employee.id));
  res.json({ attendance: attendance.filter((record) => allowed.has(record.adminUserId)) });
}

export async function updateAttendance(req: Request, res: Response) {
  const user = req.admin!;
  const employee = await getEmployeeProfile(text(req.body?.adminUserId));
  if (!employee) throw notFound("Không tìm thấy nhân viên.");
  if (!canManageEmployee(user, employee)) throw forbidden("Bạn không có quyền cập nhật nhân viên ngoài chi nhánh của mình.");
  await saveAttendance({
    adminUserId: employee.adminUserId,
    workDate: text(req.body?.workDate) || vietnamDate(),
    checkIn: text(req.body?.checkIn),
    checkOut: text(req.body?.checkOut),
    status: text(req.body?.status),
    note: text(req.body?.note),
    recordedBy: user.name,
  });
  res.json({ ok: true });
}

export async function getPayrollMonth(req: Request, res: Response) {
  const month = text(req.query.month) || vietnamDate().slice(0, 7);
  const [employees, records, attendance] = await Promise.all([
    getPayrollEmployeeDirectory(), getPayrollRecords(month), getAttendanceForMonth(month),
  ]);
  res.json({ month, employees, records, attendance });
}

export async function savePayroll(req: Request, res: Response) {
  const body = req.body ?? {};
  const employee = await getEmployeeProfile(text(body.adminUserId));
  if (!employee) throw notFound("Không tìm thấy nhân viên.");
  const amount = (key: string) => Math.max(0, Math.round(Number(String(body[key] ?? "").replace(/[^0-9.-]/g, "")) || 0));
  await savePayrollRecord({
    adminUserId: employee.adminUserId,
    payrollMonth: text(body.payrollMonth),
    baseSalary: employee.monthlySalary,
    bonusAmount: amount("bonusAmount"),
    socialInsuranceAmount: amount("socialInsuranceAmount"),
    personalIncomeTaxAmount: amount("personalIncomeTaxAmount"),
    workDays: amount("workDays"),
    status: text(body.status),
    note: text(body.note),
  });
  res.json({ ok: true, record: await getPayrollRecord(employee.adminUserId, text(body.payrollMonth)) });
}

export async function getOwnPayroll(req: Request, res: Response) {
  const month = text(req.query.month) || vietnamDate().slice(0, 7);
  res.json({ month, record: await getPayrollRecord(req.admin!.id, month) ?? null });
}

export async function listTasks(req: Request, res: Response) {
  const tasks = await getWorkTasks(req.admin!);
  res.json({ tasks, reports: await getWorkReports(tasks.map((task) => task.id)) });
}

export async function createTask(req: Request, res: Response) {
  const actor = req.admin!;
  const assignee = (await getAdminUsers()).find((item) => item.id === text(req.body?.assignedTo) && item.active);
  if (!assignee) throw badRequest("Không tìm thấy nhân viên nhận việc.");
  if (actor.role === "manager" && (assignee.branchId !== actor.branchId || assignee.role === "manager")) {
    throw forbidden("Quản lý chỉ được giao việc cho nhân viên cấp dưới cùng chi nhánh.");
  }
  const title = text(req.body?.title);
  if (title.length < 3) throw badRequest("Vui lòng nhập tên công việc rõ ràng.");
  const file = await saveTaskFile(req.file, `task-files/${randomUUID()}`);
  try {
    await createWorkTask({
      title, description: text(req.body?.description, 3000), priority: text(req.body?.priority), dueDate: text(req.body?.dueDate),
      branchId: assignee.branchId, branchName: assignee.branch, assignedTo: assignee.id, assignedName: assignee.name,
      createdBy: actor.id, createdByName: actor.name, attachmentKey: file.key, attachmentName: file.name, attachmentType: file.type,
    });
  } catch (error) {
    if (file.key) await deleteFile(file.key);
    throw error;
  }
  res.json({ ok: true });
}

export async function reportTask(req: Request, res: Response) {
  const actor = req.admin!;
  const task = await getWorkTask(String(req.params.id));
  if (!task || !canAccessTask(actor, task)) throw forbidden("Bạn không có quyền báo cáo công việc này.");
  if (task.status === "completed") throw badRequest("Công việc đã hoàn tất và không nhận thêm báo cáo.");
  const message = text(req.body?.message, 3000);
  if (!message && !req.file?.size) throw badRequest("Vui lòng nhập nội dung hoặc đính kèm file báo cáo.");
  const file = await saveTaskFile(req.file, `task-reports/${task.id}`);
  try {
    await addWorkReport({
      taskId: task.id, authorId: actor.id, authorName: actor.name, message: message || "Đã gửi file báo cáo.",
      progress: Number(req.body?.progress) || 0, taskStatus: text(req.body?.taskStatus),
      attachmentKey: file.key, attachmentName: file.name, attachmentType: file.type,
    });
  } catch (error) {
    if (file.key) await deleteFile(file.key);
    throw error;
  }
  res.json({ ok: true });
}

export async function completeTask(req: Request, res: Response) {
  const task = await getWorkTask(String(req.params.id));
  if (!task || !canAccessTask(req.admin!, task)) throw forbidden("Bạn không có quyền duyệt công việc này.");
  await completeWorkTask(task.id);
  res.json({ ok: true });
}

export async function downloadTaskFile(req: Request, res: Response) {
  const kind = String(req.params.kind);
  const id = String(req.params.id);
  if ((kind !== "task" && kind !== "report") || !ID_PATTERN.test(id)) throw badRequest("Đường dẫn file không hợp lệ.");
  const entry = await getTaskFile(kind, id);
  if (!entry?.key || !canAccessTask(req.admin!, entry.task)) throw forbidden("Không có quyền tải file này.");
  const file = await getFile(entry.key);
  if (!file) throw notFound("Không tìm thấy file.");
  sendPrivateFile(res, { bytes: file.bytes, contentType: entry.type || file.contentType }, entry.name, "attachment");
}

export async function listCameras(req: Request, res: Response) {
  const user = req.admin!;
  res.json({
    cameras: await getAccessibleCameras(user),
    permissions: user.role === "owner" ? await getCameraPermissions() : [],
  });
}

export async function addCamera(req: Request, res: Response) {
  await createCamera({
    branchId: text(req.body?.branchId), name: text(req.body?.name), location: text(req.body?.location),
    streamUrl: text(req.body?.streamUrl, 2000), streamType: text(req.body?.streamType),
  });
  res.json({ ok: true });
}

export async function toggleCameraActive(req: Request, res: Response) {
  await setCameraActive(String(req.params.id), req.body?.active === true);
  res.json({ ok: true });
}

export async function grantCameraPermission(req: Request, res: Response) {
  const adminUserId = text(req.body?.adminUserId);
  const branchId = text(req.body?.branchId);
  if (!adminUserId || !branchId) throw badRequest("Vui lòng chọn nhân viên và chi nhánh.");
  await grantCameraBranch(adminUserId, branchId);
  res.json({ ok: true });
}

export async function removeCameraPermission(req: Request, res: Response) {
  await revokeCameraPermission(String(req.params.id));
  res.json({ ok: true });
}

export async function getInventory(req: Request, res: Response) {
  const branches = await getBranches(false);
  // Chi Giam doc duoc mac dinh sang chi nhanh dau tien; tai khoan chua gan chi nhanh khong xem kho nao.
  const branchId = inventoryBranchId(req.admin!, text(req.query.branch)) || (req.admin!.role === "owner" ? branches[0]?.id ?? "" : "");
  const branch = branches.find((item) => item.id === branchId);
  res.json({
    branches,
    branch: branch ?? null,
    items: branch ? await getBranchInventory(branch.id) : [],
    movements: branch ? await getInventoryMovements(branch.id) : [],
  });
}

export async function adjustInventory(req: Request, res: Response) {
  const actor = req.admin!;
  const branch = (await getBranches(false)).find((item) => item.id === inventoryBranchId(actor, text(req.body?.branchId)));
  if (!branch) throw badRequest("Không tìm thấy chi nhánh đang hoạt động.");
  const product = await getManagedProductById(text(req.body?.productId));
  if (!product) throw notFound("Không tìm thấy sản phẩm cần điều chỉnh.");
  const requested = text(req.body?.operation);
  const operation: InventoryOperation = requested === "issue" || requested === "count" ? requested : "receive";
  const result = await adjustBranchInventory({
    branchId: branch.id, product, operation, quantity: Number(req.body?.quantity),
    note: text(req.body?.note), actorId: actor.id, actorName: actor.name,
  });
  res.json({ ok: true, branchId: branch.id, operation, ...result });
}

export async function listStudentVerifications(_req: Request, res: Response) {
  res.json({ verifications: await getStudentVerifications() });
}

export async function decideStudentVerification(req: Request, res: Response) {
  const actor = req.admin!;
  const id = String(req.params.id);
  const decision = text(req.body?.decision);
  if (!ID_PATTERN.test(id) || (decision !== "approved" && decision !== "rejected")) throw badRequest("Yêu cầu xét duyệt không hợp lệ.");
  await reviewStudentVerification({ id, status: decision, note: text(req.body?.note), reviewerId: actor.id, reviewerName: actor.name });
  res.json({ ok: true, status: decision });
}

export async function getStudentVerificationDocument(req: Request, res: Response) {
  const id = String(req.params.id);
  if (!ID_PATTERN.test(id)) throw badRequest("Mã hồ sơ không hợp lệ.");
  const verification = await getStudentVerification(id);
  const file = verification?.documentKey ? await getFile(verification.documentKey) : undefined;
  if (!verification || !file) throw notFound("Không tìm thấy hồ sơ.");
  sendPrivateFile(res, { bytes: file.bytes, contentType: verification.documentType || file.contentType }, verification.documentName, "inline");
}
