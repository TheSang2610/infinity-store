import { Router } from "express";
import multer from "multer";
import { requireCustomer } from "../middlewares/auth";
import * as controller from "../controllers/account.controller";

export const accountRoutes = Router();

const upload = (maxBytes: number) => multer({ storage: multer.memoryStorage(), limits: { fileSize: maxBytes, files: 1 } });

accountRoutes.get("/me", controller.getCurrentCustomer);
accountRoutes.post("/register", controller.register);
accountRoutes.post("/login", controller.login);
accountRoutes.post("/logout", controller.logout);
accountRoutes.patch("/profile", requireCustomer, controller.updateProfile);
// Lich su mua hang cua member
accountRoutes.get("/purchases", requireCustomer, controller.listPurchases);
// Hoa don / chi tiet mot don cua chinh khach dang dang nhap.
accountRoutes.get("/orders/:id", requireCustomer, controller.getOwnOrder);
accountRoutes.post("/avatar", requireCustomer, upload(3 * 1024 * 1024).single("avatar"), controller.uploadAvatar);
accountRoutes.delete("/avatar", requireCustomer, controller.removeAvatar);
// ---- Dang nhap Google: Google goi lai qua /api cua frontend (frontend chuyen tiep sang day) ----
accountRoutes.get("/google/start", controller.startGoogleLogin);
accountRoutes.get("/google/callback", controller.finishGoogleLogin);
// ---- Xac minh email/SMS sau dang ky ----
accountRoutes.post("/verification/check", controller.checkVerificationCode);
accountRoutes.post("/verification/resend", controller.resendVerificationCode);
accountRoutes.post("/password/forgot", controller.requestPasswordReset);
accountRoutes.post("/password/verify", controller.verifyPasswordResetCode);
accountRoutes.post("/password/reset", controller.resetPassword);
accountRoutes.get("/student-verification", requireCustomer, controller.getStudentVerification);
accountRoutes.post("/student-verification", requireCustomer, upload(5 * 1024 * 1024).single("document"), controller.requestStudentDiscount);
