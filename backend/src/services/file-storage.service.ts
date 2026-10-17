import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, get, put } from "@vercel/blob";
import { env } from "../config/env";
import { badRequest } from "../utils/http";

// Kho tep dung chung (thay Cloudflare R2). Giu nguyen "key" cua R2 cu
// (vd "abc.jpg", "avatar-...jpg", "hr-...jpg", "tasks/...pdf", "student-verifications/...pdf")
// nen tep chep tu R2 sang van khop voi CSDL.
// - STORAGE_DRIVER=local: luu trong thu muc UPLOAD_DIR (chay tren may).
// - STORAGE_DRIVER=blob: luu tren Vercel Blob o che do private; moi tep deu di qua backend
//   nen backend kiem duoc quyen xem (ho so nhan su, giay to sinh vien...).

export const PUBLIC_IMAGE_PREFIX = "/api/product-images/";
const KEY_PATTERN = /^[a-zA-Z0-9._-]+(?:\/[a-zA-Z0-9._-]+)*$/;

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/** Nhan dien loai anh bang byte dau tep, khong tin Content-Type cua trinh duyet. */
export function detectImageType(bytes: Uint8Array) {
  if (bytes.length < 12) return "";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  const header = String.fromCharCode(...bytes.slice(0, 12));
  if (header.startsWith("GIF87a") || header.startsWith("GIF89a")) return "image/gif";
  if (header.startsWith("RIFF") && header.slice(8, 12) === "WEBP") return "image/webp";
  if (header.slice(4, 8) === "ftyp" && /^(avif|avis|mif1|msf1)$/.test(header.slice(8, 12))) return "image/avif";
  return "";
}

export function isPdf(bytes: Uint8Array) {
  return Buffer.from(bytes.slice(0, 5)).toString("latin1") === "%PDF-";
}

export function isValidKey(key: string) {
  return KEY_PATTERN.test(key) && !key.split("/").includes("..");
}

/** Anh cong khai (san pham, anh dai dien): key phang, khong phai ho so nhan su. */
export function isPublicImageKey(key: string) {
  return /^[a-zA-Z0-9._-]+$/.test(key) && !key.startsWith("hr-");
}

export function publicImageKey(url: string) {
  if (!url.startsWith(PUBLIC_IMAGE_PREFIX)) return "";
  const key = url.slice(PUBLIC_IMAGE_PREFIX.length);
  return isPublicImageKey(key) ? key : "";
}

export async function putFile(key: string, bytes: Uint8Array, contentType: string) {
  if (!isValidKey(key)) throw badRequest("Tên tệp không hợp lệ.");
  if (env.storageDriver === "blob") {
    await put(key, Buffer.from(bytes), {
      access: "private",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
      token: env.blobToken || undefined,
    });
    return;
  }
  const file = localPath(key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
  await writeFile(`${file}.type`, contentType);
}

export async function getFile(key: string): Promise<{ bytes: Buffer; contentType: string } | undefined> {
  if (!isValidKey(key)) return undefined;
  try {
    if (env.storageDriver === "blob") {
      const result = await get(key, { access: "private", token: env.blobToken || undefined });
      if (!result || result.statusCode !== 200 || !result.stream) return undefined;
      const bytes = Buffer.from(await new Response(result.stream).arrayBuffer());
      return { bytes, contentType: result.blob.contentType || "application/octet-stream" };
    }
    const file = localPath(key);
    const bytes = await readFile(file);
    const contentType = await readFile(`${file}.type`, "utf8").catch(() => detectImageType(bytes) || "application/octet-stream");
    return { bytes, contentType };
  } catch {
    return undefined;
  }
}

export async function deleteFile(key: string) {
  if (!key || !isValidKey(key)) return;
  try {
    if (env.storageDriver === "blob") {
      await del(key, { token: env.blobToken || undefined });
    } else {
      await unlink(localPath(key));
      await unlink(`${localPath(key)}.type`).catch(() => undefined);
    }
  } catch {
    // Tep da mat san thi coi nhu da xoa.
  }
}

/** Luu anh cong khai, tra ve duong dan "/api/product-images/<key>" de ghi vao CSDL. */
export async function saveImage(bytes: Uint8Array, options: { prefix?: string; allowed?: string[]; label?: string } = {}) {
  const contentType = detectImageType(bytes);
  if (!contentType || !(options.allowed ?? Object.keys(IMAGE_EXTENSIONS)).includes(contentType)) {
    throw badRequest(`${options.label ?? "Tệp"} không phải ảnh hợp lệ.`);
  }
  const key = `${options.prefix ?? ""}${randomUUID()}.${IMAGE_EXTENSIONS[contentType]}`;
  await putFile(key, bytes, contentType);
  return `${PUBLIC_IMAGE_PREFIX}${key}`;
}

export async function deleteImage(url: string) {
  await deleteFile(publicImageKey(url));
}

export function imageExtension(contentType: string) {
  return IMAGE_EXTENSIONS[contentType] ?? "bin";
}

function localPath(key: string) {
  return path.join(path.resolve(env.uploadDir), ...key.split("/"));
}
