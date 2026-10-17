"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api } from "@/src/services/api";
import { formValue, runAction } from "@/src/services/action-result";

export async function saveVoucherAction(formData: FormData) {
  const body = {
    id: formValue(formData, "id"),
    code: formValue(formData, "code"),
    type: formValue(formData, "type"),
    value: formValue(formData, "value"),
    minOrder: formValue(formData, "minOrder"),
    maxDiscount: formValue(formData, "maxDiscount"),
    usageLimit: formValue(formData, "usageLimit"),
    startsAt: vietnamDate(formValue(formData, "startsAt")),
    expiresAt: vietnamDate(formValue(formData, "expiresAt"), true),
    active: formData.get("active") === "on",
  };
  redirect(await runAction(() => api("/admin/vouchers", { method: "POST", body }), {
    success: "/admin/vouchers?status=saved", failure: "/admin/vouchers", fallback: "Không thể lưu voucher.", revalidate: ["/admin/vouchers"],
  }));
}

export async function toggleVoucherAction(formData: FormData) {
  await api(`/admin/vouchers/${encodeURIComponent(formValue(formData, "id"))}/active`, {
    method: "PATCH", body: { active: formValue(formData, "active") === "true" },
  });
  revalidatePath("/admin/vouchers");
}

export async function deleteVoucherAction(formData: FormData) {
  await api(`/admin/vouchers/${encodeURIComponent(formValue(formData, "id"))}`, { method: "DELETE" });
  revalidatePath("/admin/vouchers");
}

/** Ngay "2026-10-14" theo gio Viet Nam -> mili-giay; bo trong thi 0 (khong gioi han). */
function vietnamDate(raw: string, endOfDay = false) {
  if (!raw) return 0;
  const time = new Date(`${raw}T${endOfDay ? "23:59:59.999" : "00:00:00"}+07:00`).getTime();
  return Number.isFinite(time) ? time : 0;
}
