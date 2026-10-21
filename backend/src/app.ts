import cookieParser from "cookie-parser";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { apiSpec } from "./docs/openapi";

/** Phai trung phien ban swagger-ui-dist dang cai (test docs.test.ts kiem). */
export const SWAGGER_UI_CDN = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.33.3";
import { env } from "./config/env";
import { loadCustomer } from "./middlewares/auth";
import { errorHandler, notFoundHandler } from "./middlewares/errors";
import { rateLimit, safeJsonBody, sameOriginWrites, securityHeaders } from "./middlewares/security";
import { apiRoutes } from "./routes";

// Trinh duyet khong goi thang backend: frontend Next.js chuyen /api/* sang day
// (cung ten mien), nen cookie dang nhap la cookie cung trang va khong can CORS.
export function createApp() {
  // Thieu khoa noi bo thi moi request tu may chu Next bi tinh chung mot IP: vai chuc luot xem/phut
  // la cham gioi han tan suat va ca cua hang loi 429. Production bat buoc phai co.
  if (env.isProduction && !env.internalApiSecret) {
    throw new Error("Thiếu INTERNAL_API_SECRET (phải giống hệt giá trị trong frontend).");
  }
  const app = express();
  app.disable("x-powered-by");
  // Giong LMS: chi tin 1 lop proxy (Vercel/Nginx) truoc backend; X-Forwarded-For khach tu dat khong lam doi req.ip.
  app.set("trust proxy", 1);
  app.use(securityHeaders);
  // Anh khuon mat gui dang base64 (toi da ~4 MB); API khac chi can 1 MB.
  app.use("/api/face", express.json({ limit: "5mb" }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Tai lieu API (giong LMS). Dat TRUOC chuoi middleware /api ben duoi: trang tai lieu
  // khong can dem gioi han tan suat hay doc phien khach cho moi tep CSS/JS cua Swagger UI.
  //   /api/docs       giao dien Swagger UI, bam thu duoc tung endpoint
  //   /api/docs.json  ban dac ta tho, nap thang vao Postman hay bo sinh client
  app.get("/api/docs.json", (_req, res) => {
    res.json(apiSpec);
  });
  // Khac LMS: trang nay thuong mo qua frontend, ma Next.js tu bo dau "/" cuoi ("/api/docs/" -> "/api/docs")
  // con swaggerUi.serve lai tu them vao -> chuyen huong vong tron. Nen tu tra HTML cho ca hai dang.
  // CSS/JS cua Swagger UI lay tu CDN: ham tren Vercel chi dong goi ma, khong dong goi tep tinh trong
  // node_modules/swagger-ui-dist. Rieng swagger-ui-init.js (chua ban dac ta) van do backend tra.
  const docsHtml = swaggerUi
    .generateHTML(apiSpec, {
      customSiteTitle: "Infinity Store API",
      // Gui kem cookie phien khi bam Try it out, neu khong moi lan thu deu 401.
      swaggerOptions: { withCredentials: true, persistAuthorization: true },
    })
    .replace(/(href|src)="\.\/swagger-ui-init\.js"/g, '$1="/api/docs/swagger-ui-init.js"')
    .replace(/(href|src)="\.\//g, `$1="${SWAGGER_UI_CDN}/`);
  app.get(["/api/docs", "/api/docs/", "/api/docs/index.html"], (_req, res) => {
    res.type("html").send(docsHtml);
  });
  // CSS/JS cua Swagger UI va swagger-ui-init.js (chua ban dac ta, do generateHTML o tren nap).
  app.use("/api/docs", swaggerUi.serve);

  app.use("/api", rateLimit, sameOriginWrites, safeJsonBody, loadCustomer, apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

export default createApp();
