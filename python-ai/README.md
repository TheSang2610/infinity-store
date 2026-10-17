# Infinity Company Face Server

Server Python độc lập dùng DeepFace để đăng ký và đối chiếu khuôn mặt nhân viên (chấm công). Ảnh gửi lên chỉ được xử lý trong bộ nhớ; hệ thống lưu vector DeepFace trong `data/faces.sqlite3`, không lưu ảnh gốc.

Trình duyệt không gọi thẳng server này: frontend → backend (`/api/face/*`, kiểm tra quyền) → server khuôn mặt (kèm `X-API-Key`).

## Cài lần đầu

Cần Python 3.10–3.13 (DeepFace/TensorFlow chưa hỗ trợ 3.14). Trên Windows:

```powershell
cd python-ai
py -3.12 -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
```

TensorFlow chiếm khoảng 1,5–2 GB. Muốn bộ nhớ đệm pip không nằm trên ổ C thì đặt `PIP_CACHE_DIR` sang ổ khác trước khi cài.
Model `Facenet512` (~100 MB) tự tải ở lần đối chiếu đầu tiên, lưu vào `python-ai/.deepface/` (đổi bằng `DEEPFACE_HOME`).

## Cấu hình

Server đọc các biến `FACE_*` từ `backend/.env`, dùng chung với backend:

```env
FACE_API_URL=http://127.0.0.1:8001   # backend dùng để gọi sang
FACE_API_KEY=<chuỗi ngẫu nhiên dài>   # backend và server khuôn mặt phải giống nhau
```

Chưa đặt hai biến này thì trang chấm công báo tạm tắt.

## Chạy

Không cần bật tay: khi `FACE_API_URL` trỏ về máy này (`127.0.0.1`/`localhost`) và đã có `.venv`, backend tự bật server
khuôn mặt lúc có người mở trang chấm công / đăng ký khuôn mặt (mất ~10 giây lần đầu, trang tự thử lại trong lúc chờ).
Không có yêu cầu nào trong `FACE_IDLE_MINUTES` phút (mặc định 15, `0` = không tắt) thì server tự thoát để trả RAM.
Tắt tự bật bằng `FACE_AUTOSTART=false` (production mặc định tắt).
Backend kiểm tra `/health` trước khi gọi sang, nhưng một lần kiểm tra thành công được nhớ 15 giây, để lúc camera gửi ảnh liên tục
không phải hỏi lại mỗi khung hình (và không lỡ bật thêm một server thứ hai khi server đang bận).

Muốn bật tay (vd để xem log):

```powershell
cd python-ai
.venv\Scripts\python -m uvicorn face_server:app --host 127.0.0.1 --port 8001
```

Kiểm tra: `http://127.0.0.1:8001/health`.

## Quy tắc

- Mỗi tài khoản chỉ giữ một khuôn mặt: đăng ký lại sẽ thay mẫu cũ.
- Một khuôn mặt chỉ gắn với một tài khoản: đăng ký khuôn mặt đã thuộc tài khoản khác bị từ chối (409, báo tên tài khoản đó),
  để không ai chấm công hộ người khác. Muốn chuyển, xóa khuôn mặt ở tài khoản cũ trước.
  Khi kiểm tra trùng, mẫu của tài khoản khác bị hỏng (không đối chiếu được) sẽ được bỏ qua thay vì làm hỏng cả lần đăng ký.
- Giới hạn tần suất: backend giới hạn số lần gọi chấm công, đăng ký và xác minh khuôn mặt như mọi API khác;
  chỉ `/api/face/detect` (khung xem trước camera, gọi nhiều lần mỗi giây) được miễn.

## API

- `POST /enroll`: đăng ký/cập nhật khuôn mặt theo `employee_id`.
- `POST /verify`: đối chiếu khuôn mặt với nhân viên đã đăng ký.
- `POST /detect`: dò nhanh vị trí khuôn mặt cho khung xem trước camera.
- `GET /employees`: danh sách mã nhân viên đã có mẫu khuôn mặt.
- `DELETE /employees/{employee_id}`: xóa dữ liệu khuôn mặt.
- `GET /health`: kiểm tra trạng thái server (không cần khóa).

Các API khác `/health` yêu cầu header `X-API-Key` trùng `FACE_API_KEY`. Payload ảnh:

```json
{
  "employee_id": "employee-id",
  "image_base64": "data:image/jpeg;base64,..."
}
```

Tài liệu Swagger tắt mặc định; đặt `FACE_ENABLE_DOCS=true` để mở `http://127.0.0.1:8001/docs`.

Hệ thống chấp nhận mắt kính trong suốt; không dùng kính râm hoặc kính phản quang che mắt.

Mặc định dùng model `Facenet512`, detector `opencv` và khoảng cách `cosine`. Có thể cấu hình bằng `FACE_MODEL_NAME`, `FACE_DETECTOR_BACKEND`, `FACE_DISTANCE_METRIC` và `FACE_MATCH_THRESHOLD`. Khi đổi model, nhân viên cần đăng ký khuôn mặt lại.

Lưu ý: đối chiếu một ảnh không thay thế kiểm tra sống (liveness). Khi dùng chấm công thật, cần kết hợp đăng nhập nhân viên, HTTPS, giới hạn vị trí/thiết bị và kiểm tra liveness; không được tự động ghi nhận ngày công chỉ dựa trên kết quả từ camera.
