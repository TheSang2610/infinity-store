import { webcrypto } from "node:crypto";
import { env } from "../config/env";

// Ma hoa du lieu nhan su (CCCD, dia chi, tai khoan ngan hang) bang AES-GCM.
// Giu dung dinh dang "v1.<iv>.<du lieu>" va cach suy khoa cua ban Cloudflare
// (SHA-256 cua "hr:v1:" + HR_DATA_KEY) de du lieu chuyen sang van giai ma duoc.

const subtle = webcrypto.subtle;
let keyPromise: Promise<webcrypto.CryptoKey> | undefined;

function encryptionKey() {
  if (!keyPromise) {
    const secret = env.hrDataKey;
    if (!secret) throw new Error("HR_DATA_KEY chưa được cấu hình trên máy chủ.");
    keyPromise = subtle.digest("SHA-256", new TextEncoder().encode(`hr:v1:${secret}`))
      .then((digest) => subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]))
      .catch((error) => {
        keyPromise = undefined;
        throw error;
      });
  }
  return keyPromise;
}

export async function encryptHr(value: string) {
  if (!value) return "";
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const encrypted = await subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(), new TextEncoder().encode(value));
  return `v1.${Buffer.from(iv).toString("base64")}.${Buffer.from(encrypted).toString("base64")}`;
}

/** Sai khoa hoac du lieu hong thi tra chuoi rong (giong ban cu), khong lam sap trang. */
export async function decryptHr(value: string) {
  if (!value) return "";
  if (!value.startsWith("v1.")) return value;
  try {
    const [, iv, payload] = value.split(".");
    const decrypted = await subtle.decrypt(
      { name: "AES-GCM", iv: Buffer.from(iv, "base64") },
      await encryptionKey(),
      Buffer.from(payload, "base64"),
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return "";
  }
}

/** Chi dung trong test: doi khoa giua cac lan chay. */
export function resetHrKeyCache() {
  keyPromise = undefined;
}
