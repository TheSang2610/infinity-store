/**
 * Bang ke toan bo endpoint cua API, viet o dang gon roi banh ra thanh OpenAPI (giong LMS).
 *
 * Vi sao khong dung swagger-jsdoc: no bat rai chu thich YAML vao tung file route, moi endpoint
 * muoi may dong. O day moi endpoint la MOT dong; them route moi thi them mot dong, va ham
 * expanded() lo phan lap lai: doi ":id" thanh "{id}", khai tham so duong dan, gan o khoa,
 * them cac ma loi theo muc quyen. Test src/test/docs.test.ts bao loi neu co route chua khai.
 *
 * Cot quyen (khop voi requireCustomer / requireAdmin(...) trong routes/):
 *   ""     cong khai
 *   "kh"   khach hang da dang nhap (cookie huy_customer)
 *   "nv"   moi nhan vien (cookie admin)
 *   "bh"   nhan vien sua san pham: moi vai tro tru Kho (CATALOG_EDITORS)
 *   "ql"   Giam doc hoac Quan ly (MANAGERS)
 *   "kho"  Giam doc, Quan ly, Kho (INVENTORY_STAFF)
 *   "gd"   chi Giam doc (OWNER_ONLY)
 *   "cc"   nhan vien cham cong: moi vai tro tru Giam doc
 *   "tv"   Giam doc, Quan ly, Tu van (tra loi chat truc tiep)
 *   "wh"   webhook ngan hang, xac thuc bang header secure-token
 */

type Access = "" | "kh" | "nv" | "bh" | "ql" | "kho" | "gd" | "cc" | "tv" | "wh";

export const ACCESS: Record<Access, string> = {
  "": "Công khai",
  kh: "Khách hàng đã đăng nhập",
  nv: "Mọi nhân viên",
  bh: "Nhân viên sửa sản phẩm (mọi vai trò trừ Kho)",
  ql: "Giám đốc hoặc Quản lý",
  kho: "Giám đốc, Quản lý hoặc Kho",
  gd: "Chỉ Giám đốc",
  cc: "Nhân viên chấm công (mọi vai trò trừ Giám đốc)",
  tv: "Giám đốc, Quản lý hoặc Tư vấn",
  wh: "Webhook ngân hàng (header secure-token)",
};

type Body = string | Record<string, string>;
type Options = {
  tag: string;
  /** ten schema tra ve; boc trong mang => danh sach */
  tra?: string | [string];
  /** schema hoac object { truong: kieu } mo ta than yeu cau; kieu "file" => tep */
  than?: Body;
  /** than la multipart/form-data */
  file?: boolean;
  /** tham so query */
  q?: string[];
  /** doan luu y hien duoi tom tat */
  ghiChu?: string;
};
type Row = [method: "get" | "post" | "put" | "patch" | "delete", path: string, access: Access, summary: string, options: Options];

const T = {
  sp: "Sản phẩm",
  dh: "Đặt hàng & bảo hành",
  tt: "Thanh toán",
  tk: "Tài khoản khách",
  chat: "Tư vấn & chat",
  ql: "Quản trị: phiên & báo cáo",
  qsp: "Quản trị: sản phẩm",
  qdh: "Quản trị: đơn hàng",
  qkd: "Quản trị: khách hàng & mã giảm giá",
  qns: "Quản trị: nhân sự & chi nhánh",
  qvh: "Quản trị: vận hành",
  cc: "Chấm công",
};

export const TAGS = [
  { name: T.sp, description: "Danh sách, chi tiết, tồn kho theo chi nhánh" },
  { name: T.dh, description: "Đặt hàng, đặt trước, tra cứu bảo hành, mã giảm giá" },
  { name: T.tt, description: "Mã QR chuyển khoản và webhook ngân hàng" },
  { name: T.tk, description: "Đăng ký, đăng nhập, hồ sơ, lịch sử mua của khách" },
  { name: T.chat, description: "Chatbot gợi ý sản phẩm và chat trực tiếp với cửa hàng" },
  { name: T.ql, description: "Đăng nhập trang quản lý, số liệu dashboard" },
  { name: T.qsp, description: "Thêm, sửa, ẩn, xóa sản phẩm" },
  { name: T.qdh, description: "Xử lý đơn, thanh toán, hóa đơn" },
  { name: T.qkd, description: "Chỉ Giám đốc" },
  { name: T.qns, description: "Tài khoản nhân viên, hồ sơ, chi nhánh, lương" },
  { name: T.qvh, description: "Công việc, camera, kho, xác minh sinh viên, cài đặt cửa hàng" },
  { name: T.cc, description: "Chấm công khuôn mặt (qua máy chủ DeepFace) và passkey" },
];

export const BANG: Row[] = [
  // ------------------------------ San pham ------------------------------
  ["get", "/api/products", "", "Danh sách sản phẩm", {
    tag: T.sp, tra: ["Product"], q: ["category", "view"],
    ghiChu: "`category` lọc theo nhóm (iphone, ipad, macbook…). `view=summary` chỉ trả slug, tên, giá… (dùng cho chatbot).",
  }],
  ["get", "/api/products/:slug", "", "Chi tiết sản phẩm", { tag: T.sp, tra: "Product" }],
  ["get", "/api/products/:slug/availability", "", "Chi nhánh còn hàng", { tag: T.sp }],
  ["post", "/api/product-views", "", "Ghi một lượt xem sản phẩm", {
    tag: T.sp, than: { productSlug: "string", visitorId: "string" },
  }],
  ["get", "/api/product-images/:key", "", "Ảnh sản phẩm đã tải lên", { tag: T.sp, ghiChu: "Trả thẳng tệp ảnh." }],
  ["get", "/api/settings", "", "Thông tin cửa hàng công khai", {
    tag: T.sp, ghiChu: "Hotline, showroom, tài khoản nhận tiền… hiển thị ở trang khách.",
  }],

  // ------------------------------ Dat hang ------------------------------
  ["post", "/api/orders", "", "Đặt hàng", {
    tag: T.dh, than: "OrderInput", tra: "OrderResult",
    ghiChu: "Khách chưa đăng nhập vẫn đặt được. Giá tính lại ở máy chủ từ CSDL, không tin giá trình duyệt gửi lên.",
  }],
  ["get", "/api/orders/status", "", "Trạng thái thanh toán của đơn", {
    tag: T.dh, q: ["orderCode"], ghiChu: "Trang thanh toán gọi định kỳ để biết tiền đã về chưa. `orderCode` dạng HA + 10 ký tự.",
  }],
  ["post", "/api/preorders", "", "Đăng ký đặt trước", {
    tag: T.dh, than: { productId: "string", customerName: "string", phone: "string", email: "string?", branchId: "string?", configuration: "string?", contactTime: "string?", note: "string?" },
    ghiChu: "Không thu cọc; cửa hàng gọi lại tư vấn.",
  }],
  ["post", "/api/warranty", "", "Tra cứu bảo hành", { tag: T.dh, than: { orderCode: "string", phone: "string" } }],
  ["get", "/api/branches", "", "Chi nhánh đang hoạt động", { tag: T.dh }],
  ["post", "/api/vouchers/validate", "", "Kiểm tra mã giảm giá", {
    tag: T.dh, than: { code: "string", subtotal: "integer" }, ghiChu: "Trả số tiền được giảm hoặc lý do mã không dùng được.",
  }],

  // ------------------------------ Thanh toan ------------------------------
  ["get", "/api/payment-qr", "", "Ảnh QR VietQR (SVG)", {
    tag: T.tt, q: ["orderCode", "expiresAt", "product", "storage", "ram", "voucher", "quantity"],
    ghiChu: "Cho một đơn (`orderCode` + `expiresAt`) hoặc một sản phẩm đang xem. Trả ảnh SVG.",
  }],
  ["get", "/api/momo-qr", "", "Ảnh QR chuyển tiền MoMo", { tag: T.tt, q: ["orderCode", "expiresAt"] }],
  ["post", "/api/payments/casso", "wh", "Webhook Casso báo tiền về", {
    tag: T.tt, than: "CassoWebhook",
    ghiChu: "Casso gọi khi tài khoản nhận tiền. Phải kèm header `secure-token` trùng `CASSO_WEBHOOK_SECRET`, sai trả 401. "
      + "Hệ thống tìm mã đơn (HA + 10 ký tự) trong nội dung chuyển khoản; giao dịch trùng mã được bỏ qua.",
  }],

  // ------------------------------ Tai khoan khach ------------------------------
  ["get", "/api/account/me", "", "Khách đang đăng nhập", { tag: T.tk, tra: "Customer", ghiChu: "Chưa đăng nhập thì trả `customer: null`." }],
  ["post", "/api/account/register", "", "Đăng ký", {
    tag: T.tk, than: { username: "string", name: "string", email: "string?", phone: "string?", password: "string" },
    ghiChu: "Gửi mã xác minh qua email/SMS; xác minh xong mới đăng nhập được. Giới hạn 5 lần/15 phút mỗi IP.",
  }],
  ["post", "/api/account/login", "", "Đăng nhập", {
    tag: T.tk, than: { identifier: "string", password: "string" }, tra: "Customer",
    ghiChu: "`identifier` là tên đăng nhập, email hoặc số điện thoại. Đặt cookie httpOnly `huy_customer`. Giới hạn 5 lần/15 phút.",
  }],
  ["post", "/api/account/logout", "", "Đăng xuất", { tag: T.tk }],
  ["patch", "/api/account/profile", "kh", "Cập nhật hồ sơ", { tag: T.tk, than: { name: "string", phone: "string" }, tra: "Customer" }],
  ["get", "/api/account/purchases", "kh", "Lịch sử mua hàng", { tag: T.tk }],
  ["get", "/api/account/orders/:id", "kh", "Hóa đơn của một đơn", { tag: T.tk, ghiChu: "Chỉ xem được đơn của chính mình." }],
  ["post", "/api/account/avatar", "kh", "Đổi ảnh đại diện", { tag: T.tk, file: true, than: { avatar: "file" }, ghiChu: "Tối đa 3 MB." }],
  ["delete", "/api/account/avatar", "kh", "Xóa ảnh đại diện", { tag: T.tk }],
  ["get", "/api/account/google/start", "", "Bắt đầu đăng nhập Google", { tag: T.tk, q: ["returnTo"], ghiChu: "Chuyển hướng sang Google." }],
  ["get", "/api/account/google/callback", "", "Google gọi lại sau khi đăng nhập", { tag: T.tk, q: ["code", "state"] }],
  ["post", "/api/account/verification/check", "", "Nhập mã xác minh sau đăng ký", { tag: T.tk, than: { code: "string" } }],
  ["post", "/api/account/verification/resend", "", "Gửi lại mã xác minh", { tag: T.tk }],
  ["post", "/api/account/password/forgot", "", "Quên mật khẩu: gửi mã", { tag: T.tk, than: { identifier: "string" } }],
  ["post", "/api/account/password/verify", "", "Quên mật khẩu: kiểm tra mã", { tag: T.tk, than: { code: "string" } }],
  ["post", "/api/account/password/reset", "", "Quên mật khẩu: đặt mật khẩu mới", { tag: T.tk, than: { password: "string", confirmPassword: "string" } }],
  ["get", "/api/account/student-verification", "kh", "Trạng thái xác minh sinh viên", { tag: T.tk }],
  ["post", "/api/account/student-verification", "kh", "Gửi giấy tờ xin ưu đãi sinh viên", {
    tag: T.tk, file: true, than: { document: "file", school: "string", studentCode: "string", graduationYear: "string" }, ghiChu: "Tệp tối đa 5 MB; nhân viên duyệt ở trang quản trị.",
  }],

  // ------------------------------ Tu van & chat ------------------------------
  ["get", "/api/chatbot/product", "", "Chatbot: thông tin một sản phẩm", { tag: T.chat, q: ["slug"] }],
  ["post", "/api/chatbot/recommend", "", "Chatbot: gợi ý sản phẩm", {
    tag: T.chat, than: { category: "string?", purpose: "string?", brand: "string?", min: "integer?", max: "integer?", anchor: "string?", exclude: "string?" },
  }],
  ["post", "/api/live-chat", "", "Chat trực tiếp: mở cuộc chat / gửi tin", {
    tag: T.chat, than: { action: "string?", name: "string?", phone: "string?", branchId: "string?", conversationId: "string?", token: "string?", text: "string?" },
    ghiChu: "`action: \"start\"` kèm name, phone, branchId để mở cuộc chat (trả conversationId + token). Gửi tin thì kèm conversationId, token, text.",
  }],
  ["get", "/api/live-chat", "", "Chat trực tiếp: lấy tin mới", { tag: T.chat, q: ["conversationId", "token", "after", "branches"] }],
  ["get", "/api/admin/live-chat", "tv", "Cửa hàng: danh sách / tin của cuộc chat", { tag: T.chat, q: ["conversationId"] }],
  ["post", "/api/admin/live-chat", "tv", "Cửa hàng: trả lời hoặc đổi trạng thái chat", {
    tag: T.chat, than: { conversationId: "string", text: "string?", action: "string?", status: "string?" },
  }],

  // ------------------------------ Quan tri: phien & bao cao ------------------------------
  ["post", "/api/admin/session", "", "Đăng nhập trang quản lý", {
    tag: T.ql, than: { username: "string", password: "string" }, tra: "AdminUser",
    ghiChu: "Đặt cookie httpOnly `admin`. Giới hạn 5 lần/15 phút mỗi IP.",
  }],
  ["delete", "/api/admin/session", "", "Đăng xuất trang quản lý", { tag: T.ql }],
  ["get", "/api/admin/me", "nv", "Nhân viên đang đăng nhập", { tag: T.ql, tra: "AdminUser" }],
  ["get", "/api/admin/reports/orders", "nv", "Đơn hàng cho dashboard / báo cáo", { tag: T.ql }],
  ["get", "/api/admin/reports/product-views", "ql", "Thống kê lượt xem sản phẩm", { tag: T.ql }],

  // ------------------------------ Quan tri: san pham ------------------------------
  ["get", "/api/admin/products", "nv", "Danh sách sản phẩm (cả sản phẩm ẩn)", { tag: T.qsp, tra: ["Product"] }],
  ["get", "/api/admin/products/:id", "nv", "Chi tiết sản phẩm để sửa", { tag: T.qsp, tra: "Product" }],
  ["post", "/api/admin/products", "bh", "Thêm hoặc sửa sản phẩm", {
    tag: T.qsp, file: true, than: { id: "string?", name: "string", category: "string", imageFiles: "file" },
    ghiChu: "Form multipart: các trường chữ + `imageFiles[]` + `variantImage_<id>`. Có `id` là sửa, không có là thêm mới.",
  }],
  ["patch", "/api/admin/products/:id/active", "bh", "Ẩn / hiện sản phẩm", { tag: T.qsp, than: { active: "boolean" } }],
  ["post", "/api/admin/products/delete", "bh", "Xóa nhiều sản phẩm", { tag: T.qsp, than: { ids: "string[]" } }],

  // ------------------------------ Quan tri: don hang ------------------------------
  ["get", "/api/admin/orders", "nv", "Danh sách đơn hàng", { tag: T.qdh }],
  ["get", "/api/admin/orders/:id", "nv", "Chi tiết đơn hàng", { tag: T.qdh }],
  ["patch", "/api/admin/orders/:id/status", "nv", "Đổi trạng thái đơn", { tag: T.qdh, than: { status: "string" } }],
  ["patch", "/api/admin/orders/:id/payment-status", "nv", "Đổi trạng thái thanh toán", { tag: T.qdh, than: { paymentStatus: "string" } }],
  ["patch", "/api/admin/orders/:id/assignment", "ql", "Giao đơn cho chi nhánh / nhân viên", {
    tag: T.qdh, than: { branchId: "string?", adminUserId: "string?" }, ghiChu: "Quản lý chỉ giao trong chi nhánh của mình.",
  }],
  ["put", "/api/admin/orders/:id/invoice", "nv", "Lưu thông tin hóa đơn", {
    tag: T.qdh, than: { invoiceTaxRate: "number", invoiceTaxIncluded: "boolean", warrantyMonths: "integer" },
  }],

  // ------------------------------ Quan tri: khach hang & ma giam gia ------------------------------
  ["get", "/api/admin/customers", "gd", "Danh sách khách hàng", { tag: T.qkd, ghiChu: "Có email, số điện thoại nên chỉ Giám đốc xem." }],
  ["get", "/api/admin/vouchers", "gd", "Danh sách mã giảm giá", { tag: T.qkd }],
  ["post", "/api/admin/vouchers", "gd", "Thêm hoặc sửa mã giảm giá", {
    tag: T.qkd, than: { id: "string?", code: "string", type: "string", value: "integer", minOrder: "integer", maxDiscount: "integer", usageLimit: "integer", startsAt: "integer", expiresAt: "integer", active: "boolean" },
  }],
  ["patch", "/api/admin/vouchers/:id/active", "gd", "Bật / tắt mã giảm giá", { tag: T.qkd, than: { active: "boolean" } }],
  ["delete", "/api/admin/vouchers/:id", "gd", "Xóa mã giảm giá", { tag: T.qkd }],

  // ------------------------------ Quan tri: nhan su & chi nhanh ------------------------------
  ["get", "/api/admin/staff", "nv", "Danh sách nhân viên", { tag: T.qns, tra: ["AdminUser"] }],
  ["post", "/api/admin/staff", "ql", "Tạo tài khoản nhân viên", {
    tag: T.qns, than: { username: "string", name: "string", password: "string", role: "string", branchId: "string?" },
    ghiChu: "Quản lý chỉ tạo nhân viên trong chi nhánh của mình.",
  }],
  ["patch", "/api/admin/staff/:id/active", "gd", "Khóa / mở tài khoản nhân viên", { tag: T.qns, than: { active: "boolean" } }],
  ["get", "/api/admin/hr/employees", "ql", "Hồ sơ nhân sự", { tag: T.qns }],
  ["get", "/api/admin/hr/employees/:id", "nv", "Hồ sơ một nhân viên", { tag: T.qns }],
  ["put", "/api/admin/hr/employees/:id", "ql", "Cập nhật hồ sơ nhân viên", { tag: T.qns, file: true, than: { photo: "file" }, ghiChu: "Ảnh tối đa 5 MB; các trường chữ gửi kèm trong form." }],
  ["get", "/api/admin/hr/employees/:id/photo", "nv", "Ảnh hồ sơ nhân viên", { tag: T.qns }],
  ["get", "/api/admin/hr-photo/:id", "nv", "Ảnh hồ sơ nhân viên (đường dẫn cũ)", { tag: T.qns }],
  ["get", "/api/admin/attendance", "ql", "Bảng chấm công", {
    tag: T.qns, q: ["date", "month"], ghiChu: "Quản lý chỉ thấy nhân viên chi nhánh mình.",
  }],
  ["put", "/api/admin/attendance", "ql", "Sửa một ngày công", {
    tag: T.qns, than: { adminUserId: "string", workDate: "string", checkIn: "string", checkOut: "string", status: "string", note: "string?" },
  }],
  ["get", "/api/admin/payroll", "gd", "Bảng lương tháng", { tag: T.qns, q: ["month"] }],
  ["put", "/api/admin/payroll", "gd", "Lưu lương một nhân viên", { tag: T.qns, than: { adminUserId: "string", payrollMonth: "string", workDays: "integer", bonusAmount: "integer", socialInsuranceAmount: "integer", personalIncomeTaxAmount: "integer", status: "string", note: "string?" } }],
  ["get", "/api/admin/payroll/me", "nv", "Phiếu lương của tôi", { tag: T.qns, q: ["month"] }],
  ["get", "/api/admin/branches", "nv", "Danh sách chi nhánh", { tag: T.qns, q: ["active"] }],
  ["get", "/api/admin/branches/:id", "nv", "Chi tiết chi nhánh", { tag: T.qns }],
  ["post", "/api/admin/branches", "gd", "Thêm chi nhánh", { tag: T.qns, than: "BranchInput" }],
  ["put", "/api/admin/branches/:id", "gd", "Sửa chi nhánh", { tag: T.qns, than: "BranchInput" }],
  ["patch", "/api/admin/branches/:id/active", "gd", "Mở / đóng chi nhánh", { tag: T.qns, than: { active: "boolean" } }],

  // ------------------------------ Quan tri: van hanh ------------------------------
  ["get", "/api/admin/tasks", "nv", "Danh sách công việc", { tag: T.qvh }],
  ["post", "/api/admin/tasks", "ql", "Giao việc", { tag: T.qvh, file: true, than: { title: "string", assignedTo: "string", attachment: "file" } }],
  ["post", "/api/admin/tasks/:id/reports", "nv", "Báo cáo tiến độ công việc", { tag: T.qvh, file: true, than: { reportAttachment: "file" } }],
  ["post", "/api/admin/tasks/:id/complete", "ql", "Đánh dấu hoàn thành", { tag: T.qvh }],
  ["get", "/api/admin/task-files/:kind/:id", "nv", "Tải tệp đính kèm công việc", { tag: T.qvh }],
  ["get", "/api/admin/cameras", "nv", "Danh sách camera", { tag: T.qvh }],
  ["post", "/api/admin/cameras", "gd", "Thêm camera", { tag: T.qvh }],
  ["patch", "/api/admin/cameras/:id/active", "gd", "Bật / tắt camera", { tag: T.qvh, than: { active: "boolean" } }],
  ["post", "/api/admin/camera-permissions", "gd", "Cấp quyền xem camera", { tag: T.qvh }],
  ["delete", "/api/admin/camera-permissions/:id", "gd", "Thu hồi quyền xem camera", { tag: T.qvh }],
  ["get", "/api/admin/inventory", "kho", "Tồn kho theo chi nhánh", { tag: T.qvh }],
  ["post", "/api/admin/inventory/adjust", "kho", "Điều chỉnh tồn kho", { tag: T.qvh }],
  ["get", "/api/admin/student-verifications", "nv", "Yêu cầu xác minh sinh viên", { tag: T.qvh }],
  ["post", "/api/admin/student-verifications/:id/review", "nv", "Duyệt / từ chối xác minh sinh viên", { tag: T.qvh }],
  ["get", "/api/admin/student-verifications/:id/document", "nv", "Xem giấy tờ sinh viên", { tag: T.qvh }],
  ["get", "/api/admin/settings", "gd", "Cài đặt cửa hàng", { tag: T.qvh }],
  ["put", "/api/admin/settings", "gd", "Lưu cài đặt cửa hàng", { tag: T.qvh, ghiChu: "Hotline, showroom, tài khoản nhận tiền, MoMo, bên bán trên hóa đơn." }],

  // ------------------------------ Cham cong ------------------------------
  ["get", "/api/face/attendance", "cc", "Trạng thái chấm công hôm nay", { tag: T.cc }],
  ["post", "/api/face/attendance", "cc", "Chấm công bằng khuôn mặt", {
    tag: T.cc, than: { image_base64: "string" }, ghiChu: "Ảnh base64 tối đa ~4 MB. Máy chủ khuôn mặt chưa bật thì trả 503.",
  }],
  ["get", "/api/face/employees", "ql", "Nhân viên đã đăng ký khuôn mặt", { tag: T.cc }],
  ["delete", "/api/face/employees/:employeeId", "ql", "Xóa khuôn mặt của nhân viên", { tag: T.cc }],
  ["post", "/api/face/detect", "ql", "Dò khuôn mặt cho khung xem trước", {
    tag: T.cc, than: { image_base64: "string" }, ghiChu: "Camera gọi nhiều lần mỗi giây nên không bị giới hạn tần suất.",
  }],
  ["post", "/api/face/enroll", "ql", "Đăng ký khuôn mặt cho nhân viên", { tag: T.cc, than: { employee_id: "string", image_base64: "string" } }],
  ["post", "/api/face/verify", "ql", "Thử đối chiếu khuôn mặt", { tag: T.cc, than: { employee_id: "string", image_base64: "string" } }],
  ["get", "/api/admin/attendance/passkey", "cc", "Passkey đã đăng ký", { tag: T.cc }],
  ["delete", "/api/admin/attendance/passkey", "cc", "Xóa passkey", { tag: T.cc }],
  ["post", "/api/admin/attendance/passkey/options", "cc", "Passkey: lấy tham số đăng ký / xác thực", { tag: T.cc }],
  ["post", "/api/admin/attendance/passkey/verify", "cc", "Passkey: xác minh và chấm công", { tag: T.cc }],
];

// ---------------------------------------------------------------- banh ra OpenAPI

type Json = Record<string, unknown>;

function fieldSchema(kind: string): Json {
  const optional = kind.endsWith("?");
  const base = optional ? kind.slice(0, -1) : kind;
  if (base === "file") return { type: "string", format: "binary" };
  if (base.endsWith("[]")) return { type: "array", items: { type: base.slice(0, -2) } };
  return { type: base };
}

function bodySchema(than: Body): Json {
  if (typeof than === "string") return { $ref: `#/components/schemas/${than}` };
  const properties: Json = {};
  const required: string[] = [];
  for (const [name, kind] of Object.entries(than)) {
    properties[name] = fieldSchema(kind);
    if (!kind.endsWith("?")) required.push(name);
  }
  return { type: "object", properties, ...(required.length ? { required } : {}) };
}

function returns(options: Options): Json {
  if (!options.tra) return { description: "Thành công" };
  const schema = Array.isArray(options.tra)
    ? { type: "array", items: { $ref: `#/components/schemas/${options.tra[0]}` } }
    : { $ref: `#/components/schemas/${options.tra}` };
  return { description: "Thành công", content: { "application/json": { schema } } };
}

const err = (description: string): Json => ({
  description,
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
});

const SECURITY: Record<Access, Json[]> = {
  "": [],
  kh: [{ customerCookie: [] }],
  wh: [{ cassoToken: [] }],
  nv: [{ adminCookie: [] }],
  bh: [{ adminCookie: [] }],
  ql: [{ adminCookie: [] }],
  kho: [{ adminCookie: [] }],
  gd: [{ adminCookie: [] }],
  cc: [{ adminCookie: [] }],
  tv: [{ adminCookie: [] }],
};

export function expanded() {
  const paths: Record<string, Json> = {};

  for (const [method, path, access, summary, options] of BANG) {
    const openApiPath = path.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
    const pathParams = [...path.matchAll(/:([A-Za-z0-9_]+)/g)].map((m) => m[1]);

    const parameters: Json[] = pathParams.map((name) => ({ name, in: "path", required: true, schema: { type: "string" } }));
    for (const q of options.q ?? []) parameters.push({ name: q, in: "query", required: false, schema: { type: "string" } });

    const responses: Json = { 200: returns(options) };
    if (options.than || options.q) responses[400] = err("Dữ liệu gửi lên thiếu hoặc không hợp lệ");
    if (access === "wh") responses[401] = err("Thiếu hoặc sai header secure-token");
    else if (access !== "") responses[401] = err("Chưa đăng nhập hoặc phiên đã hết hạn");
    if (!["", "kh", "nv", "wh"].includes(access)) responses[403] = err("Đăng nhập rồi nhưng vai trò không đủ quyền");
    if (pathParams.length) responses[404] = err("Không tìm thấy");
    if (method !== "get") responses[429] = err("Gọi quá nhiều lần, thử lại sau");

    const requestBody = options.than
      ? {
          required: true,
          content: { [options.file ? "multipart/form-data" : "application/json"]: { schema: bodySchema(options.than) } },
        }
      : undefined;

    paths[openApiPath] ??= {};
    paths[openApiPath][method] = {
      tags: [options.tag],
      summary,
      description: `**Quyền:** ${ACCESS[access]}${options.ghiChu ? `\n\n${options.ghiChu}` : ""}`,
      ...(parameters.length ? { parameters } : {}),
      ...(requestBody ? { requestBody } : {}),
      responses,
      security: SECURITY[access],
    };
  }

  return paths;
}
