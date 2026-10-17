# Báo cáo rà soát bảo mật Infinity Store

Ngày rà soát: 17/10/2026 (thay bản 11/09/2026, viết cho phiên bản Cloudflare Worker/D1 cũ).

## Phạm vi

- `backend/`: Express 5 + PostgreSQL (Drizzle). Gồm mọi route `/api/*`, middleware phân quyền, giới hạn tần suất,
  kiểm tra đầu vào, webhook Casso và lớp gọi sang máy chủ khuôn mặt.
- `frontend/`: Next.js 16. Gồm chuyển tiếp `/api/*` sang backend và header bảo mật.
- `python-ai/`: máy chủ nhận diện khuôn mặt FastAPI + DeepFace.
- Dependency npm của backend và frontend.
- Toàn bộ lịch sử Git, quét tìm khóa API, token, private key.

## Đã có và đã kiểm tra

### 1. Đăng nhập và phân quyền

- Phiên khách (`huy_customer`) và phiên nhân viên (`admin`) là cookie `httpOnly`, `SameSite=Lax`, `Secure` khi chạy production.
- Mật khẩu băm PBKDF2-SHA256, 120.000 vòng, muối ngẫu nhiên 16 byte, so sánh bằng `timingSafeEqual`.
- Mỗi route quản trị khai rõ nhóm vai trò được gọi (`requireAdmin(...)` trong `backend/src/routes/`). Thiếu phiên trả 401, sai vai trò trả 403.
  Bảng quyền đầy đủ của từng endpoint nằm ở trang Swagger `/api/docs`.
- Quản lý chi nhánh chỉ thao tác nhân viên cùng chi nhánh (`canManageEmployee`). Giám đốc thao tác tất cả.

### 2. Giới hạn tần suất (`backend/src/middlewares/security.ts`)

- Đăng nhập, đăng ký, Google OAuth, quên/đặt lại mật khẩu, mã OTP và đăng nhập quản trị: 5 lần mỗi IP mỗi route trong 15 phút.
- API thường: 180 lần đọc / 60 lần ghi mỗi phút. Webhook Casso: 120 lần/phút.
- Vượt giới hạn trả 429 kèm `Retry-After`.
- Chỉ `/api/face/detect` được miễn: camera gọi nhiều lần mỗi giây để vẽ khung mặt, và chỉ Giám đốc/Quản lý gọi được.
- IP khách: backend chỉ tin `x-client-ip` khi đi kèm `x-internal-key` trùng `INTERNAL_API_SECRET` (frontend gửi).
  Production thiếu khóa này thì backend không khởi động. `trust proxy` chỉ tin 1 lớp proxy.

### 3. Kiểm tra đầu vào

- Request ghi đến từ tên miền khác bị chặn bằng `Origin` / `Sec-Fetch-Site` (chống CSRF). Riêng webhook Casso được miễn vì xác thực bằng secret riêng.
- JSON: tối đa 1 MB (ảnh khuôn mặt 5 MB), lồng tối đa 8 tầng, tối đa 200 trường. Khóa `__proto__`, `constructor`, `prototype` bị từ chối.
- Ảnh tải lên được nhận dạng bằng chữ ký nhị phân JPEG/PNG/WebP, không tin MIME do trình duyệt gửi.
  Tệp công việc tải xuống kèm `Content-Security-Policy: default-src 'none'`.
- Webhook Casso so header `secure-token` bằng `timingSafeEqual`. Giao dịch trùng mã được bỏ qua.

### 4. Bí mật và cấu hình

- Không còn mật khẩu hay khóa mặc định trong source. `OWNER_PASSWORD`, `HR_DATA_KEY`, `INTERNAL_API_SECRET`, `CASSO_WEBHOOK_SECRET`,
  Google, Twilio, `FACE_API_KEY` đều đọc từ biến môi trường. Mẫu nằm trong `backend/.env.example`, `frontend/.env.example`.
- `.env`, `.env.*`, khóa riêng, CSDL cục bộ, dữ liệu khuôn mặt (`python-ai/data/`) đều nằm trong `.gitignore`.
- Quét toàn bộ lịch sử Git (17/10/2026): không tìm thấy khóa API, token hay private key. Chưa từng commit `.env`.
- Dữ liệu mẫu `backend/seed/store-settings.json`: tài khoản nhận tiền (BIDV), ví MoMo và số tư vấn/Zalo là thông tin
  nhận tiền công khai của chủ dự án, được đưa vào có chủ ý. Mã doanh nghiệp, hotline, địa chỉ là giá trị demo.
  Thông tin cửa hàng khi chạy thật sửa trong trang quản trị (Cài đặt cửa hàng) và lưu trong CSDL.

## Đã khắc phục trong đợt rà soát 17/10/2026

| Mức | Vấn đề | Đã sửa |
|---|---|---|
| Nghiêm trọng | `next@16.3.4` dính lỗ hổng chạy mã từ xa qua `next/og` (GHSA-vcvr-r3jv-pc5j) và lộ nội dung Draft Mode | Nâng `next` và `eslint-config-next` lên 16.4.2. Build, typecheck, test, lint đều đạt. |
| Cao | `multer@2.0.2`: tải tệp lên có thể làm sập máy chủ (GHSA-xf7r-hgr6-v32p, GHSA-v52c-386h-88mc) | Nâng lên 2.4.0. |
| Thấp | `@simplewebauthn/server@13.3.0`: kiểm tra chứng thư passkey chưa đủ chặt | Nâng lên 13.3.3. |
| Cao | `GET /api/admin/customers` mở cho mọi nhân viên (bản cũ chỉ Giám đốc). Lộ tên, email, số điện thoại khách | Chỉ Giám đốc. |
| Cao | `GET /api/admin/vouchers` mở cho mọi nhân viên, lộ toàn bộ mã giảm giá | Chỉ Giám đốc. |
| Trung bình | Quản lý xem được chấm công mọi chi nhánh | Lọc theo `canManageEmployee`. |
| Trung bình | Webhook Casso có thể bắt nhầm mã đơn khi ngân hàng dính liền chữ, làm đơn thật vẫn "chưa thanh toán" | Chỉ nhận đúng định dạng mã (HA + 10 ký tự hex) và phải là đơn có thật. |
| Trung bình | Chấm công / đăng ký / xác minh khuôn mặt không bị giới hạn số lần, có thể thử ảnh liên tục cho tới khi khớp | Áp giới hạn thường; chỉ còn `/detect` được miễn. |
| Thấp | Máy chủ khuôn mặt có thể bị bật trùng khi đang bận; một mẫu khuôn mặt hỏng chặn đăng ký của mọi người | Nhớ kết quả kiểm tra `/health` 15 giây; bỏ qua mẫu hỏng khi kiểm tra trùng. |

Sau khi sửa, `npm audit --omit=dev` báo **0 lỗ hổng** ở cả backend và frontend.

Trước khi công khai mã nguồn, đã thay toàn bộ thông tin thật trong dữ liệu mẫu (tài khoản ngân hàng, số MoMo, mã doanh nghiệp,
hotline, địa chỉ) bằng giá trị demo, bỏ tệp hướng dẫn cũ có email cá nhân, và tạo lại kho GitHub chỉ với bản đã làm sạch
để lịch sử commit không còn giữ dữ liệu cũ.

## Rủi ro còn lại

| Mức | Vấn đề | Hướng xử lý |
|---|---|---|
| Trung bình | Tự host không qua Vercel: frontend lấy IP khách từ `X-Real-IP` / `X-Forwarded-For`, người dùng tự đặt được nếu proxy không ghi đè. Hậu quả là lách được giới hạn 5 lần đăng nhập. | Trên Vercel không bị. Tự host thì Nginx (hoặc proxy khác) phải ghi đè hai header này. Đã ghi trong README. |
| Trung bình | Bộ đếm giới hạn tần suất nằm trong bộ nhớ từng máy chủ. Trên Vercel mỗi instance đếm riêng nên giới hạn thực tế lỏng hơn con số cấu hình. | Đủ chặn spam cơ bản. Cần chặt hơn thì chuyển bộ đếm sang PostgreSQL hoặc Redis. |
| Trung bình | PBKDF2 120.000 vòng, hash chưa ghi phiên bản. | Thêm tiền tố phiên bản vào hash, băm lại với số vòng cao hơn sau mỗi lần đăng nhập thành công. |
| Trung bình | Vector khuôn mặt trong `python-ai/data/faces.sqlite3` chưa mã hóa ở cấp tệp. | Chỉ cho máy chủ khuôn mặt nghe ở `127.0.0.1` hoặc mạng nội bộ, giới hạn quyền đọc thư mục, mã hóa ổ đĩa và bản sao lưu. |
| Trung bình | Đối chiếu một ảnh không phải kiểm tra người thật (liveness): đưa ảnh chụp lên camera vẫn có thể khớp. | Không tự ghi ngày công chỉ dựa trên camera. Kết hợp đăng nhập nhân viên, passkey, giới hạn thiết bị/vị trí. |
| Thấp | Tệp công việc (Office/PDF/ZIP) mới kiểm tra dung lượng và MIME. | Thêm quét mã độc trước khi cho tải xuống nếu nhận tệp từ nguồn không tin cậy. |
| Thấp | Chưa có Content-Security-Policy cho toàn bộ giao diện. | Đã có `nosniff`, chống iframe, HSTS, Referrer-Policy, Permissions-Policy. CSP cần làm theo nonce vì Next.js sinh script nội tuyến. |
| Thấp | Công cụ phát triển còn lỗ hổng: `drizzle-kit` kéo esbuild cũ (4 moderate, backend), `braces` (5 high, frontend). | Chỉ chạy lúc phát triển, không vào bản chạy thật. Không mở máy dev ra Internet. |

## Việc bắt buộc trước khi đưa lên production

1. Đặt giá trị mạnh và khác nhau cho `OWNER_PASSWORD`, `HR_DATA_KEY`, `INTERNAL_API_SECRET`, `CASSO_WEBHOOK_SECRET`, `FACE_API_KEY`.
   `INTERNAL_API_SECRET` phải giống hệt ở backend và frontend.
2. Giữ máy chủ khuôn mặt sau backend; không công khai cổng 8001.
3. Tự host thì cấu hình proxy ghi đè `X-Real-IP` / `X-Forwarded-For` (xem mục Rủi ro).
4. Đổi `HR_DATA_KEY` là mất khả năng đọc hồ sơ nhân sự đã mã hóa: giữ đúng khóa của bản đang chạy.

## Xác minh đã chạy (17/10/2026)

- Backend: `npm run typecheck` đạt; `npm test` 38/38 đạt (gồm 5 test đối chiếu tài liệu Swagger với route thật).
- Frontend: `npm run typecheck` đạt; `npm test` 49 đạt, 0 lỗi (31 test bỏ qua sẵn); `npm run lint` 0 lỗi, 6 cảnh báo; `npm run build` đạt với Next 16.4.2.
- `npm audit --omit=dev`: 0 lỗ hổng ở backend và frontend.
- Trên trình duyệt: trang `/api/docs` mở qua frontend; gửi thử request ghi qua frontend được backend xử lý bình thường.
- Python (`python-ai/`): `pip-audit` trên bộ thư viện đang cài, đúng phiên bản trong `requirements.txt`
  (FastAPI 0.141.1, Starlette 1.6.0, Uvicorn 0.35.0, DeepFace 0.0.100, TensorFlow 2.21.0, NumPy 2.2.6, OpenCV 4.12.0.88,
  Pillow 12.3.0): **không có lỗ hổng đã biết**. `face_server.py` biên dịch đạt.
- Quét mã nguồn công khai: không còn tài khoản, số điện thoại, email hay họ tên của người khác ngoài chủ dự án.
