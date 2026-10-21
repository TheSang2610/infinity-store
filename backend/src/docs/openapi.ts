/**
 * Ban dac ta OpenAPI 3 cua Infinity Store API (giong LMS).
 *
 * Gan vao ung dung o app.ts:
 *   /api/docs       giao dien Swagger UI, bam thu duoc tung endpoint
 *   /api/docs.json  ban dac ta tho, nap thang vao Postman hay bo sinh client
 */
import { expanded, TAGS } from "./paths";
import { schemas } from "./schemas";

export const apiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Infinity Store API",
    version: "1.0.0",
    description: [
      "API của Infinity Store: cửa hàng điện thoại, laptop, máy ảnh và hệ thống quản lý chi nhánh,",
      "nhân sự, kho, chấm công.",
      "",
      "### Mở trang này qua frontend",
      "",
      "Trình duyệt chỉ gọi `/api/*` của frontend, Next.js chuyển tiếp sang backend. Mở",
      "**http://localhost:3000/api/docs** (không phải cổng 4000) thì nút *Try it out* gửi được",
      "request ghi (POST/PUT/PATCH/DELETE): backend chặn request ghi đến từ tên miền khác frontend.",
      "",
      "### Đăng nhập",
      "",
      "Có hai loại phiên, đều là **cookie httpOnly** (JavaScript không đọc được, trình duyệt tự gửi kèm):",
      "",
      "| Cookie | Lấy bằng | Dùng cho |",
      "|---|---|---|",
      "| `infinity_customer` | `POST /api/account/login` | Khách hàng: hồ sơ, lịch sử mua |",
      "| `admin` | `POST /api/admin/session` | Nhân viên: mọi đường `/api/admin/*`, `/api/face/*` |",
      "",
      "Thử trên trang này thì gọi đăng nhập trước, cookie được giữ cho các lệnh sau.",
      "",
      "### Vai trò nhân viên",
      "",
      "| Vai trò | Nghĩa |",
      "|---|---|",
      "| `owner` | Giám đốc: toàn quyền, xem khách hàng, mã giảm giá, lương |",
      "| `manager` | Quản lý: nhân viên và chấm công trong chi nhánh mình |",
      "| `sales`, `consultant`, `warranty`, `repair` | Bán hàng, tư vấn, bảo hành, sửa chữa |",
      "| `inventory` | Kho: chỉnh tồn kho, không sửa sản phẩm |",
      "",
      "Thiếu phiên nhận **401**, có phiên nhưng sai vai trò nhận **403**, gọi quá nhiều lần nhận **429**",
      "(đăng nhập / OTP: 5 lần mỗi 15 phút mỗi IP).",
    ].join("\n"),
    contact: { name: "Nguyễn Thế Sang", url: "https://github.com/TheSang2610" },
  },
  // Duong dan tuong doi: Try it out goi ve chinh trang dang mo (frontend chuyen tiep sang backend).
  servers: [{ url: "/", description: "Máy chủ đang mở trang này" }],
  tags: TAGS,
  components: {
    securitySchemes: {
      customerCookie: {
        type: "apiKey", in: "cookie", name: "infinity_customer",
        description: "Cookie httpOnly do POST /api/account/login đặt. Trình duyệt tự gửi kèm.",
      },
      adminCookie: {
        type: "apiKey", in: "cookie", name: "admin",
        description: "Cookie httpOnly do POST /api/admin/session đặt. Trình duyệt tự gửi kèm.",
      },
      cassoToken: {
        type: "apiKey", in: "header", name: "secure-token",
        description: "Khóa bí mật Casso gửi kèm webhook, phải trùng CASSO_WEBHOOK_SECRET.",
      },
    },
    schemas,
  },
  paths: expanded(),
};
