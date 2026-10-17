import { Router } from "express";
import * as controller from "../controllers/chatbot.controller";

export const chatbotRoutes = Router();

// GET /api/chatbot/product?slug= - tu van mot san pham (gia, chi nhanh con hang)
chatbotRoutes.get("/product", controller.getProductSummary);
// POST /api/chatbot/recommend - goi y san pham theo nhu cau
chatbotRoutes.post("/recommend", controller.recommend);
