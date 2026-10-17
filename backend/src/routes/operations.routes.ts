import { Router } from "express";
import multer from "multer";
import { INVENTORY_STAFF, MANAGERS, OWNER_ONLY, requireAdmin } from "../middlewares/auth";
import * as controller from "../controllers/operations.controller";

export const operationsRoutes = Router();

const anyStaff = requireAdmin();
const managers = requireAdmin(...MANAGERS);
export const owner = requireAdmin(...OWNER_ONLY);
const inventoryStaff = requireAdmin(...INVENTORY_STAFF);
const upload = (maxBytes: number) => multer({ storage: multer.memoryStorage(), limits: { fileSize: maxBytes, files: 1 } });
/** Gioi han 4 MB vi Vercel chi nhan request toi da 4,5 MB (ban cu cho 15 MB). */
const TASK_FILE_BYTES = (Number(process.env.MAX_TASK_FILE_MB) || 4) * 1024 * 1024;

// ---- Nhan su ----
operationsRoutes.get("/hr/employees", managers, controller.listEmployees);
operationsRoutes.get("/hr/employees/:id", anyStaff, controller.getEmployee);
operationsRoutes.put("/hr/employees/:id", managers, upload(5 * 1024 * 1024).single("photo"), controller.updateEmployee);
// Duong dan cu "/api/admin/hr-photo/<id>" van dung (giao dien dang tro toi).
operationsRoutes.get(["/hr/employees/:id/photo", "/hr-photo/:id"], anyStaff, controller.getEmployeePhoto);
// ---- Cham cong ----
operationsRoutes.get("/attendance", managers, controller.listAttendance);
operationsRoutes.put("/attendance", managers, controller.updateAttendance);
// ---- Bang luong (chi Giam doc) ----
operationsRoutes.get("/payroll", owner, controller.getPayrollMonth);
operationsRoutes.put("/payroll", owner, controller.savePayroll);
// Nhan vien xem phieu luong cua chinh minh.
operationsRoutes.get("/payroll/me", anyStaff, controller.getOwnPayroll);
operationsRoutes.get("/tasks", anyStaff, controller.listTasks);
operationsRoutes.post("/tasks", managers, upload(TASK_FILE_BYTES).single("attachment"), controller.createTask);
operationsRoutes.post("/tasks/:id/reports", anyStaff, upload(TASK_FILE_BYTES).single("reportAttachment"), controller.reportTask);
operationsRoutes.post("/tasks/:id/complete", managers, controller.completeTask);
operationsRoutes.get("/task-files/:kind/:id", anyStaff, controller.downloadTaskFile);
// ---- Camera chi nhanh ----
operationsRoutes.get("/cameras", anyStaff, controller.listCameras);
operationsRoutes.post("/cameras", owner, controller.addCamera);
operationsRoutes.patch("/cameras/:id/active", owner, controller.toggleCameraActive);
operationsRoutes.post("/camera-permissions", owner, controller.grantCameraPermission);
operationsRoutes.delete("/camera-permissions/:id", owner, controller.removeCameraPermission);
operationsRoutes.get("/inventory", inventoryStaff, controller.getInventory);
operationsRoutes.post("/inventory/adjust", inventoryStaff, controller.adjustInventory);
// ---- Xac minh sinh vien ----
operationsRoutes.get("/student-verifications", anyStaff, controller.listStudentVerifications);
operationsRoutes.post("/student-verifications/:id/review", anyStaff, controller.decideStudentVerification);
operationsRoutes.get("/student-verifications/:id/document", anyStaff, controller.getStudentVerificationDocument);
