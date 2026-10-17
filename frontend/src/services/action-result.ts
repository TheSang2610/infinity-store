import "server-only";
import { revalidatePath } from "next/cache";

// Tien ich chung cho server action trang quan tri (khong phai "use server").

export function formValue(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

/**
 * Chay mot thao tac, tra ve duong dan de redirect: thanh cong -> `success`, loi -> `failure?error=...`.
 * redirect() phai goi NGOAI ham nay (Next dung loi dac biet de chuyen trang).
 */
export async function runAction(
  action: () => Promise<unknown>,
  options: { success: string; failure: string; fallback: string; revalidate?: string[] },
) {
  try {
    await action();
    for (const path of options.revalidate ?? []) revalidatePath(path);
    return options.success;
  } catch (error) {
    const separator = options.failure.includes("?") ? "&" : "?";
    return `${options.failure}${separator}error=${encodeURIComponent(errorMessage(error, options.fallback))}`;
  }
}
