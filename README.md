# Infinity Store

Cửa hàng điện thoại, laptop, máy ảnh kèm hệ thống quản lý chi nhánh, nhân sự, kho và chăm sóc khách hàng.

| Thư mục | Nội dung | Công nghệ |
|---|---|---|
| `frontend/` | Giao diện cửa hàng và trang quản trị | Next.js 16 (App Router), React 19, TypeScript |
| `backend/` | REST API, toàn bộ nghiệp vụ và CSDL | Express 5, TypeScript, Drizzle ORM, PostgreSQL |
| `python-ai/` | Máy chủ nhận diện khuôn mặt (tùy chọn) | FastAPI + DeepFace |
| `docs/` | Thiết kế CSDL, tài liệu | |

Backend chia lớp giống dự án LMS (`backend/src/`):
`routes/` (đường dẫn + phân quyền) → `controllers/` (đọc request, trả response) → `services/` (nghiệp vụ)
→ `repositories/` (truy vấn Drizzle). Ngoài ra có `middlewares/`, `utils/`, `constants/`, `types/`, `db/` (schema, migrate, seed).

Frontend cũng theo LMS: `app/` chỉ còn route (trang khách trong nhóm `app/(portal)/`, URL không đổi;
`app/admin`, `app/staff`, `app/manager` cho nội bộ). Phần còn lại nằm trong `frontend/src/`:
- `components/{common,layout,features/{portal,admin}}`
- `constants/{shared,portal,admin}`: **mọi chữ hiển thị**. Sửa câu chữ thì sửa ở đây, không sửa trong component.
- `services/` (gọi backend, đăng nhập), `actions/` (server action), `hooks/`, `lib/`, `types/`, `styles/{base,storefront,admin}`.

Trình duyệt chỉ gọi `/api/*` của frontend; `next.config.ts` chuyển tiếp sang backend, nên cookie đăng nhập là cookie cùng tên miền và không cần CORS.

## Chạy trên máy

```bash
# Backend (cổng 4000)
cd backend
cp .env.example .env          # sửa DATABASE_URL, OWNER_PASSWORD...
npm install
npm run db:migrate            # tạo bảng
npm run db:seed               # nạp sản phẩm mẫu, thông tin cửa hàng (backend/seed/) + tài khoản Giám đốc
npm run dev

# Frontend (cổng 3000)
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Chưa cài PostgreSQL thì đặt `DATABASE_URL=pglite:./.pglite` (PostgreSQL chạy ngay trong Node, chỉ để thử).

## Tài liệu API (Swagger)

Chạy backend + frontend rồi mở **http://localhost:3000/api/docs** (qua frontend để nút *Try it out* gửi được request ghi;
mở thẳng cổng 4000 thì chỉ xem và thử được request GET). Bản đặc tả thô: `/api/docs.json` (nạp vào Postman được).

Mỗi endpoint khai bằng một dòng trong `backend/src/docs/paths.ts`. Thêm route mới thì thêm một dòng ở đó;
quên thì test `src/test/docs.test.ts` báo lỗi.

## Chuyển dữ liệu từ Cloudflare D1 cũ

```bash
cd backend
npm run db:import-d1 -- <file .sqlite hoặc .sql> [--files-from <thư mục tệp tải từ R2>]
```

Sau khi nhập dữ liệu cũ, chạy thêm **một lần** để đưa nội dung sản phẩm trước đây viết cứng trong code
(ảnh theo màu, thông số, link giới thiệu, thứ tự hiển thị) vào CSDL. Lệnh đầu chỉ kiểm tra và in chỗ lệch, chưa ghi:

```bash
npx tsx --env-file=.env scripts/legacy-catalog/bake-catalog.ts          # kiểm tra
npx tsx --env-file=.env scripts/legacy-catalog/bake-catalog.ts --write --force   # ghi
npm run db:seed                                                          # thêm thông tin cửa hàng nếu chưa có
```

Lệch còn lại là cố ý: biến thể iPad xếp theo dung lượng tăng dần. Chuyển xong trên CSDL thật thì xóa
`backend/scripts/legacy-catalog/`; từ đó sản phẩm và thông tin cửa hàng chỉ sửa trong trang quản trị
(Quản trị > Cài đặt cửa hàng: hotline, showroom, tài khoản nhận tiền, MoMo, bên bán trên hóa đơn).

Chạy lại nhiều lần không nhân đôi dữ liệu. Cần đặt `HR_DATA_KEY` giống bản cũ để đọc hồ sơ nhân sự đã mã hóa.

## Kiểm tra

```bash
cd backend && npm test && npm run typecheck
cd frontend && npm test && npm run typecheck && npm run lint
```

## Deploy (Vercel)

Hai project Vercel: một trỏ Root Directory vào `backend/`, một vào `frontend/`.
Backend cần PostgreSQL (Neon) và Vercel Blob (`STORAGE_DRIVER=blob`); frontend cần `BACKEND_URL` trỏ về backend.
Danh sách biến môi trường: `backend/.env.example`, `frontend/.env.example`.

**Tự host (không qua Vercel):** frontend lấy IP người dùng từ `X-Real-IP` / `X-Forwarded-For` để backend giới hạn số lần
đăng nhập. Proxy đứng trước frontend (vd Nginx) phải **ghi đè** hai header này, nếu không người dùng tự đặt IP giả
và lách được giới hạn đăng nhập. Vercel đã tự ghi đè nên không cần làm gì thêm.
