import { Router } from "express";
import { requireAdmin } from "../middlewares/auth";
import * as controller from "../controllers/passkey.controller";

export const passkeyRoutes = Router();

// Giam doc khong cham cong.
passkeyRoutes.use(requireAdmin("manager", "sales", "consultant", "warranty", "repair", "inventory"));
passkeyRoutes.get("/", controller.listPasskeys);
passkeyRoutes.delete("/", controller.revokePasskeys);
passkeyRoutes.post("/options", controller.createPasskeyOptions);
passkeyRoutes.post("/verify", controller.verifyPasskey);
