"""Infinity Company face verification service.

Run locally (see README.md):
    .venv\\Scripts\\python -m uvicorn face_server:app --host 127.0.0.1 --port 8001

The service never stores uploaded photos. It stores one DeepFace embedding per
employee in a local SQLite database.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import io
import json
import os
import shutil
import sqlite3
import sys
import tempfile
import time
from pathlib import Path
from threading import Lock, Thread

# Console Windows mac dinh cp1252/cp1258: DeepFace in duong dan (co dau tieng Viet) se lam server sap.
for stream in (sys.stdout, sys.stderr):
    if hasattr(stream, "reconfigure"):
        stream.reconfigure(encoding="utf-8", errors="replace")


APP_DIR = Path(__file__).resolve().parent
# FACE_API_KEY dung chung voi backend (backend/.env); .env o thu muc goc chi con de tuong thich ban cu.
ENV_PATHS = (APP_DIR.parent / "backend" / ".env", APP_DIR.parent / ".env")


def load_local_environment() -> None:
    """Share local FACE_* settings with the backend without extra dependencies."""
    for env_path in ENV_PATHS:
        if not env_path.is_file():
            continue
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            if key not in {"FACE_API_KEY", "FACE_DATA_DIR", "FACE_MODEL_NAME", "FACE_DETECTOR_BACKEND", "FACE_DISTANCE_METRIC", "FACE_MATCH_THRESHOLD", "FACE_MAX_IMAGE_BYTES", "FACE_ENABLE_DOCS", "FACE_ALLOWED_ORIGINS", "DEEPFACE_HOME"}:
                continue
            os.environ.setdefault(key, value.strip().strip('"').strip("'"))


load_local_environment()
# Model DeepFace (~100 MB) mac dinh tai vao thu muc nguoi dung tren o C; giu trong python-ai/ cho gon.
# Phai dat truoc khi import deepface.
os.environ.setdefault("DEEPFACE_HOME", str(APP_DIR))

import numpy as np  # noqa: E402
import cv2  # noqa: E402
from deepface import DeepFace  # noqa: E402
from fastapi import Depends, FastAPI, Header, HTTPException, Request, status  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402
from PIL import Image, ImageOps, UnidentifiedImageError  # noqa: E402
from deepface.models.face_detection import OpenCv as deepface_opencv  # noqa: E402

CASCADE_FILES = ("haarcascade_frontalface_default.xml", "haarcascade_frontalface_alt2.xml", "haarcascade_eye.xml")


def cascade_directory() -> str:
    """OpenCV tren Windows khong mo duoc file co duong dan ngoai ASCII (vd 'D:\\aQuản lý dự án...').
    Khi do chep cac file haarcascade can dung sang thu muc tam (ASCII) va doc tu day."""
    source = Path(cv2.data.haarcascades)
    if str(source).isascii():
        return str(source)
    target = Path(os.getenv("FACE_CASCADE_DIR", Path(tempfile.gettempdir()) / "infinity-face-cascades"))
    if not str(target).isascii():
        raise RuntimeError("FACE_CASCADE_DIR phải là đường dẫn không dấu (OpenCV không đọc được đường dẫn có dấu).")
    target.mkdir(parents=True, exist_ok=True)
    for name in CASCADE_FILES:
        destination = target / name
        if not destination.is_file() or destination.stat().st_size != (source / name).stat().st_size:
            shutil.copyfile(source / name, destination)
    return str(target)


CASCADE_DIR = cascade_directory()
# Detector "opencv" cua DeepFace tu tim file canh cv2.__file__; tro no sang thu muc doc duoc.
deepface_opencv.OpenCvClient._OpenCvClient__get_opencv_path = lambda self: CASCADE_DIR

DATA_DIR = Path(os.getenv("FACE_DATA_DIR", APP_DIR / "data")).resolve()
DATABASE_PATH = DATA_DIR / "faces.sqlite3"
MAX_IMAGE_BYTES = int(os.getenv("FACE_MAX_IMAGE_BYTES", str(8 * 1024 * 1024)))
MODEL_NAME = os.getenv("FACE_MODEL_NAME", "Facenet512")
DETECTOR_BACKEND = os.getenv("FACE_DETECTOR_BACKEND", "opencv")
DISTANCE_METRIC = os.getenv("FACE_DISTANCE_METRIC", "cosine")
MATCH_THRESHOLD = float(os.environ["FACE_MATCH_THRESHOLD"]) if os.getenv("FACE_MATCH_THRESHOLD") else None
API_KEY = os.getenv("FACE_API_KEY", "")
# Backend tu bat server nay thi truyen so phut; khong co yeu cau nao trong khoang do thi tu thoat de tra RAM.
IDLE_EXIT_MINUTES = float(os.getenv("FACE_IDLE_EXIT_MINUTES", "0") or 0)
LAST_REQUEST_AT = time.time()
DATABASE_LOCK = Lock()
RATE_LIMIT_LOCK = Lock()
RATE_LIMITS: dict[str, tuple[int, int]] = {}
FACE_CASCADES = tuple(
    cascade
    for cascade in (
        cv2.CascadeClassifier(os.path.join(CASCADE_DIR, "haarcascade_frontalface_default.xml")),
        cv2.CascadeClassifier(os.path.join(CASCADE_DIR, "haarcascade_frontalface_alt2.xml")),
    )
    if not cascade.empty()
)

app = FastAPI(
    title="Infinity Company Face Verification",
    version="1.0.0",
    docs_url="/docs" if os.getenv("FACE_ENABLE_DOCS", "false").lower() == "true" else None,
    redoc_url=None,
    openapi_url="/openapi.json" if os.getenv("FACE_ENABLE_DOCS", "false").lower() == "true" else None,
)

allowed_origins = [item.strip() for item in os.getenv("FACE_ALLOWED_ORIGINS", "http://localhost:3000").split(",") if item.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "X-API-Key"],
)


@app.middleware("http")
async def enforce_http_security(request: Request, call_next):
    """Bound request size and request frequency before expensive face processing."""
    global LAST_REQUEST_AT
    LAST_REQUEST_AT = time.time()
    now = int(time.time())
    client_host = request.client.host if request.client else "unknown"
    supplied_key = request.headers.get("x-api-key", "")
    has_valid_key = bool(API_KEY) and hmac.compare_digest(
        supplied_key.encode("utf-8"), API_KEY.encode("utf-8")
    )
    if request.url.path == "/health":
        limit, window_seconds, scope = 120, 60, "health"
    elif has_valid_key:
        # Chi backend co khoa, va moi nhan vien deu di qua backend (cung mot IP): khong gioi han,
        # neu khong camera cua vai nguoi cung luc se lam het luot cua ca cong ty.
        limit, window_seconds, scope = 0, 60, "api"
    else:
        limit, window_seconds, scope = 5, 15 * 60, "auth"
    window_start = now // window_seconds * window_seconds
    rate_key = f"{scope}:{client_host}:{window_start}"
    with RATE_LIMIT_LOCK:
        count, expires_at = RATE_LIMITS.get(rate_key, (0, window_start + window_seconds))
        count += 1
        RATE_LIMITS[rate_key] = (count, expires_at)
        if len(RATE_LIMITS) > 5_000:
            for key, (_, expiry) in list(RATE_LIMITS.items()):
                if expiry < now:
                    RATE_LIMITS.pop(key, None)
    if limit and count > limit:
        retry_after = max(1, window_start + window_seconds - now)
        return JSONResponse(
            {"detail": "Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau."},
            status_code=429,
            headers={"Retry-After": str(retry_after)},
        )

    content_length = request.headers.get("content-length")
    max_request_bytes = max(512 * 1024, int(MAX_IMAGE_BYTES * 1.5) + 16 * 1024)
    if content_length:
        try:
            if int(content_length) < 0:
                raise ValueError
            if int(content_length) > max_request_bytes:
                return JSONResponse({"detail": "Payload vượt quá dung lượng cho phép."}, status_code=413)
        except ValueError:
            return JSONResponse({"detail": "Content-Length không hợp lệ."}, status_code=400)

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Cache-Control"] = "no-store"
    return response


def require_api_key(x_api_key: str = Header(default="")) -> None:
    if not API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="FACE_API_KEY chưa được cấu hình trên máy chủ.",
        )
    if not hmac.compare_digest(x_api_key.encode("utf-8"), API_KEY.encode("utf-8")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="API key không hợp lệ.")


class FacePayload(BaseModel):
    employee_id: str = Field(min_length=1, max_length=100)
    image_base64: str = Field(min_length=100, max_length=int(MAX_IMAGE_BYTES * 4 / 3) + 4096)


class VerifyResponse(BaseModel):
    verified: bool
    employee_id: str
    confidence: float
    distance: float
    message: str
    facial_area: dict[str, int]


@app.on_event("startup")
def initialize_database() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with connect() as database:
        database.execute(
            """CREATE TABLE IF NOT EXISTS employee_faces (
                employee_id TEXT PRIMARY KEY,
                encoding_json TEXT NOT NULL,
                encoding_hash TEXT NOT NULL,
                model_name TEXT NOT NULL DEFAULT '',
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )"""
        )
        ensure_column(database, "employee_faces", "model_name", "TEXT NOT NULL DEFAULT ''")
    if IDLE_EXIT_MINUTES > 0:
        Thread(target=exit_when_idle, daemon=True).start()


def exit_when_idle() -> None:
    while True:
        time.sleep(30)
        if time.time() - LAST_REQUEST_AT > IDLE_EXIT_MINUTES * 60:
            print(f"Không có yêu cầu trong {IDLE_EXIT_MINUTES:g} phút, tắt máy chủ khuôn mặt.", flush=True)
            os._exit(0)


@app.get("/health")
def health() -> dict[str, object]:
    with connect() as database:
        count = int(database.execute("SELECT COUNT(*) FROM employee_faces").fetchone()[0])
    return {"ok": True, "service": "infinity-company-face", "enrolled_employees": count}


@app.get("/employees", dependencies=[Depends(require_api_key)])
def list_employee_faces() -> dict[str, object]:
    with connect() as database:
        rows = database.execute(
            "SELECT employee_id,model_name,created_at,updated_at FROM employee_faces ORDER BY updated_at DESC"
        ).fetchall()
    return {
        "ok": True,
        "employees": [
            {
                "employee_id": str(row[0]),
                "model_name": str(row[1]),
                "created_at": int(row[2]),
                "updated_at": int(row[3]),
            }
            for row in rows
        ],
    }


@app.post("/enroll", dependencies=[Depends(require_api_key)])
def enroll(payload: FacePayload) -> dict[str, object]:
    employee_id = clean_employee_id(payload.employee_id)
    encoding, facial_area = extract_single_face(payload.image_base64)
    encoded_json = json.dumps(encoding.tolist(), separators=(",", ":"))
    encoding_hash = hashlib.sha256(encoded_json.encode("utf-8")).hexdigest()
    now = int(time.time())
    with DATABASE_LOCK, connect() as database:
        # 1 nguoi - 1 tai khoan: khuon mat da gan voi tai khoan khac thi khong cho dang ky them (chong cham cong ho).
        duplicate_of = find_owner_of_face(database, encoding, exclude_employee_id=employee_id)
        if duplicate_of:
            return JSONResponse(
                {"detail": "Khuôn mặt này đã được đăng ký cho một tài khoản khác. Mỗi người chỉ được gắn khuôn mặt với một tài khoản.", "duplicate_of": duplicate_of},
                status_code=409,
            )
        database.execute(
            """INSERT INTO employee_faces (employee_id,encoding_json,encoding_hash,model_name,created_at,updated_at)
               VALUES (?,?,?,?,?,?)
               ON CONFLICT(employee_id) DO UPDATE SET
                 encoding_json=excluded.encoding_json,
                 encoding_hash=excluded.encoding_hash,
                 model_name=excluded.model_name,
                 updated_at=excluded.updated_at""",
            (employee_id, encoded_json, encoding_hash, MODEL_NAME, now, now),
        )
    return {"ok": True, "employee_id": employee_id, "message": "Đã thêm khuôn mặt.", "facial_area": facial_area}


@app.post("/verify", response_model=VerifyResponse, dependencies=[Depends(require_api_key)])
def verify(payload: FacePayload) -> VerifyResponse:
    employee_id = clean_employee_id(payload.employee_id)
    with connect() as database:
        row = database.execute(
            "SELECT encoding_json,model_name FROM employee_faces WHERE employee_id=? LIMIT 1",
            (employee_id,),
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Nhân viên chưa đăng ký khuôn mặt.")

    if row[1] != MODEL_NAME:
        raise HTTPException(status_code=409, detail="Dữ liệu khuôn mặt dùng model cũ. Vui lòng đăng ký lại.")

    candidate_encoding, candidate_area = extract_single_face(payload.image_base64)
    result = best_match(stored_encodings(row[0]), candidate_encoding)
    distance = float(result.get("distance", 1.0))
    verified = bool(result.get("verified", False))
    deepface_confidence = float(result.get("confidence", max(0.0, 1.0 - distance) * 100))
    confidence = max(0.0, min(1.0, deepface_confidence / 100))
    return VerifyResponse(
        verified=verified,
        employee_id=employee_id,
        confidence=round(confidence, 4),
        distance=round(distance, 4),
        message="Khuôn mặt khớp." if verified else "Khuôn mặt không khớp.",
        facial_area=candidate_area,
    )


@app.post("/detect", dependencies=[Depends(require_api_key)])
def detect(payload: FacePayload) -> dict[str, object]:
    clean_employee_id(payload.employee_id)
    raw = decode_image(payload.image_base64)
    try:
        with Image.open(io.BytesIO(raw)) as source:
            if source.format not in {"JPEG", "PNG", "WEBP"}:
                raise UnidentifiedImageError("Unsupported image format")
            if source.width * source.height > 16_000_000:
                raise ValueError("Image dimensions exceed the allowed limit")
            image = ImageOps.exif_transpose(source).convert("RGB")
            pixels = np.ascontiguousarray(np.asarray(image)[:, :, ::-1])
    except (UnidentifiedImageError, OSError, ValueError) as error:
        raise HTTPException(status_code=400, detail="Ảnh khuôn mặt không hợp lệ.") from error
    facial_area = detect_face_fast(pixels, image.width, image.height)
    if facial_area is None:
        raise HTTPException(status_code=422, detail="Chưa tìm thấy khuôn mặt trong camera.")
    return {"ok": True, "facial_area": facial_area}


@app.delete("/employees/{employee_id}", dependencies=[Depends(require_api_key)])
def delete_employee_face(employee_id: str) -> dict[str, object]:
    normalized_id = clean_employee_id(employee_id)
    with DATABASE_LOCK, connect() as database:
        result = database.execute("DELETE FROM employee_faces WHERE employee_id=?", (normalized_id,))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Không tìm thấy dữ liệu khuôn mặt.")
    return {"ok": True, "employee_id": normalized_id, "message": "Đã xóa dữ liệu khuôn mặt."}


def stored_encodings(encoding_json: str) -> list[list[float]]:
    stored = json.loads(encoding_json)
    if stored and isinstance(stored[0], list):
        return [list(map(float, encoding)) for encoding in stored]
    return [list(map(float, stored))]


def best_match(known_encodings: list[list[float]], candidate: np.ndarray) -> dict[str, object]:
    """Ket qua DeepFace.verify gan nhat giua anh moi va cac mau da luu cua mot nhan vien."""
    results: list[dict[str, object]] = []
    for known_encoding in known_encodings:
        try:
            results.append(
                DeepFace.verify(
                    img1_path=known_encoding,
                    img2_path=candidate.tolist(),
                    model_name=MODEL_NAME,
                    detector_backend="skip",
                    distance_metric=DISTANCE_METRIC,
                    enforce_detection=False,
                    align=False,
                    threshold=MATCH_THRESHOLD,
                    silent=True,
                )
            )
        except (TypeError, ValueError) as error:
            raise HTTPException(status_code=422, detail="Không thể đối chiếu khuôn mặt bằng DeepFace.") from error
    return min(results, key=lambda item: float(item.get("distance", 1.0)))


def find_owner_of_face(database: sqlite3.Connection, candidate: np.ndarray, exclude_employee_id: str) -> str | None:
    """Ma nhan vien khac da dang ky khuon mat nay (cung model), khong co thi None."""
    rows = database.execute(
        "SELECT employee_id,encoding_json FROM employee_faces WHERE employee_id<>? AND model_name=?",
        (exclude_employee_id, MODEL_NAME),
    ).fetchall()
    for other_id, encoding_json in rows:
        try:
            matched = best_match(stored_encodings(encoding_json), candidate).get("verified")
        except (HTTPException, ValueError, TypeError):
            # Mau hong cua nguoi khac khong duoc chan viec dang ky cua ca cong ty.
            continue
        if matched:
            return str(other_id)
    return None


def extract_single_face(image_base64: str) -> tuple[np.ndarray, dict[str, int]]:
    raw = decode_image(image_base64)
    try:
        with Image.open(io.BytesIO(raw)) as source:
            if source.format not in {"JPEG", "PNG", "WEBP"}:
                raise UnidentifiedImageError("Unsupported image format")
            if source.width * source.height > 16_000_000:
                raise ValueError("Image dimensions exceed the allowed limit")
            image = ImageOps.exif_transpose(source).convert("RGB")
            pixels = np.ascontiguousarray(np.asarray(image)[:, :, ::-1])
    except (UnidentifiedImageError, OSError, ValueError) as error:
        raise HTTPException(status_code=400, detail="Ảnh khuôn mặt không hợp lệ.") from error

    try:
        representations = DeepFace.represent(
            img_path=pixels,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=True,
            align=True,
            max_faces=5,
        )
    except (TypeError, ValueError) as error:
        raise HTTPException(status_code=422, detail="Không tìm thấy khuôn mặt hợp lệ trong ảnh.") from error
    # OpenCV can mistake clothing, logos or shoulders for extra faces. A real,
    # front-facing enrollment must include both eye landmarks. Keep that face
    # and reject only when more than one credible face remains.
    credible_faces = [item for item in representations if is_credible_face(item, image.width, image.height)]
    if not credible_faces:
        raise HTTPException(status_code=422, detail="Không nhận diện rõ khuôn mặt. Hãy giữ đủ sáng; có thể đeo mắt kính trong suốt.")
    if len(credible_faces) > 1:
        raise HTTPException(status_code=422, detail="Khung hình có nhiều khuôn mặt. Vui lòng chỉ để một người trước camera.")
    embedding = credible_faces[0].get("embedding")
    if not isinstance(embedding, list) or not embedding:
        raise HTTPException(status_code=422, detail="Không thể trích xuất đặc trưng khuôn mặt.")
    area = credible_faces[0]["facial_area"]
    facial_area = {
        "x": max(0, int(area.get("x", 0))),
        "y": max(0, int(area.get("y", 0))),
        "w": max(1, int(area.get("w", image.width))),
        "h": max(1, int(area.get("h", image.height))),
        "image_width": int(image.width),
        "image_height": int(image.height),
    }
    return np.asarray(embedding, dtype=np.float64), facial_area


def is_credible_face(item: dict[str, object], image_width: int, image_height: int) -> bool:
    """Accept clear faces behind normal glasses without trusting tiny false detections."""
    area = item.get("facial_area")
    if not isinstance(area, dict):
        return False
    width = max(0, int(area.get("w", 0)))
    height = max(0, int(area.get("h", 0)))
    area_ratio = (width * height) / max(1, image_width * image_height)
    has_both_eyes = area.get("left_eye") is not None and area.get("right_eye") is not None
    confidence = float(item.get("face_confidence", 0.0) or 0.0)
    return area_ratio >= 0.025 and (has_both_eyes or confidence >= 0.45 or area_ratio >= 0.10)


def detect_face_fast(pixels: np.ndarray, image_width: int, image_height: int) -> dict[str, int] | None:
    """Fast, tolerant preview detection; DeepFace remains the final authority."""
    preview = pixels
    max_dimension = max(image_width, image_height)
    resize_scale = min(1.0, 640.0 / max_dimension)
    if resize_scale < 1.0:
        preview = cv2.resize(
            pixels,
            (max(1, round(image_width * resize_scale)), max(1, round(image_height * resize_scale))),
            interpolation=cv2.INTER_AREA,
        )
    gray = cv2.cvtColor(preview, cv2.COLOR_BGR2GRAY)
    normalized = cv2.equalizeHist(gray)
    minimum_face = max(36, round(min(normalized.shape[:2]) * 0.12))
    candidates: list[tuple[int, int, int, int]] = []
    for cascade in FACE_CASCADES:
        detected = cascade.detectMultiScale(
            normalized,
            scaleFactor=1.05,
            minNeighbors=3,
            minSize=(minimum_face, minimum_face),
            flags=cv2.CASCADE_SCALE_IMAGE,
        )
        candidates.extend(tuple(map(int, face)) for face in detected)
        if candidates:
            break
    if not candidates:
        return None
    x, y, width, height = max(candidates, key=lambda area: area[2] * area[3])
    inverse_scale = 1.0 / resize_scale
    return {
        "x": max(0, round(x * inverse_scale)),
        "y": max(0, round(y * inverse_scale)),
        "w": max(1, round(width * inverse_scale)),
        "h": max(1, round(height * inverse_scale)),
        "image_width": int(image_width),
        "image_height": int(image_height),
    }


def decode_image(value: str) -> bytes:
    encoded = value.split(",", 1)[1] if value.startswith("data:") and "," in value else value
    try:
        raw = base64.b64decode(encoded, validate=True)
    except (ValueError, base64.binascii.Error) as error:
        raise HTTPException(status_code=400, detail="Dữ liệu ảnh base64 không hợp lệ.") from error
    if not raw or len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Ảnh trống hoặc vượt quá dung lượng cho phép.")
    return raw


def clean_employee_id(value: str) -> str:
    normalized = value.strip()
    if not normalized or len(normalized) > 100 or any(ord(char) < 32 for char in normalized):
        raise HTTPException(status_code=400, detail="Mã nhân viên không hợp lệ.")
    return normalized


def connect() -> sqlite3.Connection:
    database = sqlite3.connect(DATABASE_PATH, timeout=10)
    database.execute("PRAGMA journal_mode=WAL")
    database.execute("PRAGMA foreign_keys=ON")
    return database


def ensure_column(database: sqlite3.Connection, table: str, column: str, definition: str) -> None:
    columns = {str(row[1]) for row in database.execute(f"PRAGMA table_info({table})")}
    if column not in columns:
        database.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
