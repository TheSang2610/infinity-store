import { Router } from "express";
import * as controller from "../controllers/store-settings.controller";
import { OWNER_ONLY, requireAdmin } from "../middlewares/auth";

export const storeSettingsRoutes = Router();
export const adminStoreSettingsRoutes = Router();

storeSettingsRoutes.get("/", controller.getPublicSettings);

// Chi Giam doc sua thong tin cua hang (tai khoan nhan tien nam o day).
adminStoreSettingsRoutes.use(requireAdmin(...OWNER_ONLY));
adminStoreSettingsRoutes.get("/", controller.getSettings);
adminStoreSettingsRoutes.put("/", controller.saveSettings);
