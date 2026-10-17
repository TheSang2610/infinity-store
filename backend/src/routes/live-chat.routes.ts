import { Router } from "express";
import { requireAdmin } from "../middlewares/auth";
import * as controller from "../controllers/live-chat.controller";

export const liveChatRoutes = Router();
export const adminLiveChatRoutes = Router();

liveChatRoutes.post("/", controller.handleCustomerAction);
liveChatRoutes.get("/", controller.getCustomerConversation);
adminLiveChatRoutes.use(requireAdmin("owner", "manager", "consultant"));
adminLiveChatRoutes.get("/", controller.getAdminInbox);
adminLiveChatRoutes.post("/", controller.handleAdminAction);
