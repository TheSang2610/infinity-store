import { Router } from "express";
import multer from "multer";
import { CATALOG_EDITORS, MANAGERS, OWNER_ONLY, requireAdmin } from "../middlewares/auth";
import { MAX_IMAGE_BYTES } from "../services/admin-product.service";
import * as controller from "../controllers/admin.controller";

export const adminRoutes = Router();

const anyStaff = requireAdmin();
const catalogEditor = requireAdmin(...CATALOG_EDITORS);
const managers = requireAdmin(...MANAGERS);
const owner = requireAdmin(...OWNER_ONLY);
const productUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMAGE_BYTES, files: 40 } });

// ---- Phien dang nhap ----
adminRoutes.post("/session", controller.login);
adminRoutes.delete("/session", controller.logout);
adminRoutes.get("/me", anyStaff, controller.getCurrentAdmin);
// ---- So lieu cho dashboard / bao cao ----
adminRoutes.get("/reports/orders", anyStaff, controller.listReportingOrders);
adminRoutes.get("/reports/product-views", managers, controller.getProductViewReport);
// ---- San pham ----
adminRoutes.get("/products", anyStaff, controller.listProducts);
adminRoutes.get("/products/:id", anyStaff, controller.getProduct);
// Form multipart: truong text + imageFiles[] + variantImage_<id>. Co "id" la cap nhat.
adminRoutes.post("/products", catalogEditor, productUpload.any(), controller.saveProduct);
adminRoutes.patch("/products/:id/active", catalogEditor, controller.toggleProductActive);
adminRoutes.post("/products/delete", catalogEditor, controller.removeProducts);
// ---- Don hang ----
adminRoutes.get("/orders", anyStaff, controller.listOrders);
adminRoutes.get("/orders/:id", anyStaff, controller.getOrder);
adminRoutes.patch("/orders/:id/status", anyStaff, controller.changeOrderStatus);
adminRoutes.patch("/orders/:id/payment-status", anyStaff, controller.changeOrderPaymentStatus);
/** Dieu don ve chi nhanh va nhan vien phu trach. Quan ly chi dieu trong chi nhanh minh. */
adminRoutes.patch("/orders/:id/assignment", managers, controller.assignOrder);
adminRoutes.put("/orders/:id/invoice", anyStaff, controller.saveOrderInvoice);
// ---- Khach hang ----
// Du lieu rieng tu cua khach: chi Giam doc (giong ban cu requireOwnerPage).
adminRoutes.get("/customers", owner, controller.listCustomers);
// ---- Voucher ----
adminRoutes.get("/vouchers", owner, controller.listVouchers);
adminRoutes.post("/vouchers", owner, controller.submitVoucher);
adminRoutes.patch("/vouchers/:id/active", owner, controller.toggleVoucherActive);
adminRoutes.delete("/vouchers/:id", owner, controller.removeVoucher);
// ---- Nhan vien ----
adminRoutes.get("/staff", anyStaff, controller.listStaff);
/**
 * Tao tai khoan nhan vien. Quan ly chi them nhan su cap duoi cho chi nhanh minh;
 * nhan vien bao hanh/sua chua luon thuoc chi nhanh bao hanh.
 */
adminRoutes.post("/staff", managers, controller.createStaff);
adminRoutes.patch("/staff/:id/active", owner, controller.toggleStaffActive);
// ---- Chi nhanh ----
adminRoutes.get("/branches", anyStaff, controller.listBranches);
adminRoutes.get("/branches/:id", anyStaff, controller.getBranch);
adminRoutes.post("/branches", owner, controller.addBranch);
adminRoutes.put("/branches/:id", owner, controller.editBranch);
adminRoutes.patch("/branches/:id/active", owner, controller.toggleBranchActive);
