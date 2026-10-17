import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { HttpError } from "../utils/http";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ ok: false, message: "Không tìm thấy API." });
}

// Express 5 tu chuyen loi cua ham async ve day, khong can boc try/catch tung route.
export function errorHandler(error: unknown, _req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) return next(error);
  if (error instanceof HttpError) {
    res.status(error.status).json({ ok: false, message: error.message });
    return;
  }
  if (error instanceof MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE" ? "Tệp tải lên vượt quá dung lượng cho phép." : "Tệp tải lên không hợp lệ.";
    res.status(400).json({ ok: false, message });
    return;
  }
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ ok: false, message: "Dữ liệu gửi lên không đúng định dạng JSON." });
    return;
  }
  console.error(error);
  res.status(500).json({ ok: false, message: "Máy chủ gặp lỗi, vui lòng thử lại sau." });
}
