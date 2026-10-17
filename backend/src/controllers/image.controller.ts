import type { Request, Response } from "express";
import { badRequest, notFound } from "../utils/http";
import { getFile, isPublicImageKey } from "../services/file-storage.service";

export async function getProductImage(req: Request, res: Response) {
  const key = String(req.params.key);
  if (!isPublicImageKey(key)) throw badRequest("Tên ảnh không hợp lệ.");
  const file = await getFile(key);
  if (!file || !file.contentType.startsWith("image/")) throw notFound("Không tìm thấy ảnh.");
  res.set({ "Content-Type": file.contentType, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" });
  res.send(file.bytes);
}
