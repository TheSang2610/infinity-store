import { Router } from "express";
import { accountRoutes } from "./account.routes";
import { adminRoutes } from "./admin.routes";
import { chatbotRoutes } from "./chatbot.routes";
import { faceRoutes } from "./face.routes";
import { imageRoutes } from "./image.routes";
import { adminLiveChatRoutes, liveChatRoutes } from "./live-chat.routes";
import { operationsRoutes } from "./operations.routes";
import { orderRoutes } from "./order.routes";
import { passkeyRoutes } from "./passkey.routes";
import { paymentRoutes } from "./payment.routes";
import { productRoutes } from "./product.routes";
import { adminStoreSettingsRoutes, storeSettingsRoutes } from "./store-settings.routes";
import { voucherRoutes } from "./voucher.routes";

/** Tat ca API, gan duoi "/api" trong app.ts. Duong dan giu nguyen nhu ban cu (frontend dang goi). */
export const apiRoutes = Router();

// ---- Cua hang (khach) ----
apiRoutes.use("/", productRoutes);
apiRoutes.use("/", orderRoutes);
apiRoutes.use("/", paymentRoutes);
apiRoutes.use("/vouchers", voucherRoutes);
apiRoutes.use("/product-images", imageRoutes);
apiRoutes.use("/account", accountRoutes);
apiRoutes.use("/chatbot", chatbotRoutes);
apiRoutes.use("/live-chat", liveChatRoutes);
apiRoutes.use("/settings", storeSettingsRoutes);

// ---- Quan tri ----
apiRoutes.use("/admin/live-chat", adminLiveChatRoutes);
apiRoutes.use("/admin/attendance/passkey", passkeyRoutes);
apiRoutes.use("/admin/settings", adminStoreSettingsRoutes);
apiRoutes.use("/admin", adminRoutes);
apiRoutes.use("/admin", operationsRoutes);

// Cham cong khuon mat: chuyen tiep sang may chu DeepFace (FACE_API_URL); chua co thi bao tam tat.
apiRoutes.use("/face", faceRoutes);
