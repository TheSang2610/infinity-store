import { Router } from "express";
import { requireAdmin } from "../middlewares/auth";
import * as controller from "../controllers/face.controller";

export const faceRoutes = Router();

/** Nhan vien tu cham cong (Giam doc khong cham cong). */
const employeeOnly = requireAdmin("manager", "sales", "consultant", "warranty", "repair", "inventory");

/** Dang ky / thu khuon mat: Giam doc va quan ly chi nhanh. */
const faceManager = requireAdmin("owner", "manager");


faceRoutes.get("/attendance", employeeOnly, controller.getAttendanceRegistration);
faceRoutes.post("/attendance", employeeOnly, controller.checkInWithFace);
faceRoutes.get("/employees", faceManager, controller.listEnrolledEmployees);
faceRoutes.delete("/employees/:employeeId", faceManager, controller.removeEnrolledEmployee);
faceRoutes.post("/detect", faceManager, controller.detectFace);
faceRoutes.post("/enroll", faceManager, controller.enrollFace);
faceRoutes.post("/verify", faceManager, controller.verifyFace);
