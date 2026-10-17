"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api } from "@/src/services/api";
import { formValue, runAction } from "@/src/services/action-result";
import { SETTINGS_TEXT } from "@/src/constants/admin/settings-page";

/** "Ten | gia tri" moi dong -> danh sach cap. */
function pairLines(text: string) {
  return text.split("\n")
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter(([first, second]) => first && second)
    .map(([first, second]) => [first, second] as const);
}

export async function saveStoreSettingsAction(formData: FormData) {
  const field = (key: string) => formValue(formData, key);
  const settings = {
    storeName: field("storeName"),
    companyName: field("companyName"),
    businessLicense: field("businessLicense"),
    officeAddress: field("officeAddress"),
    email: field("email"),
    hotline: field("hotline"),
    hotlineHours: field("hotlineHours"),
    supportHotline: field("supportHotline"),
    supportHours: field("supportHours"),
    complaintHotline: field("complaintHotline"),
    complaintHours: field("complaintHours"),
    consultPhone: field("consultPhone"),
    zaloPhone: field("zaloPhone"),
    showrooms: pairLines(field("showrooms")).map(([name, address]) => ({ name, address })),
    socialLinks: pairLines(field("socialLinks")).map(([label, url]) => ({ label, url })),
    bank: { code: field("bankCode"), name: field("bankName"), accountNumber: field("bankAccountNumber"), accountName: field("bankAccountName") },
    momo: { phone: field("momoPhone"), accountName: field("momoAccountName") },
    invoiceSeller: { name: field("sellerName"), taxCode: field("sellerTaxCode"), address: field("sellerAddress"), phone: field("sellerPhone") },
  };
  const target = await runAction(() => api("/admin/settings", { method: "PUT", body: { settings } }), {
    success: "/admin/settings?status=saved", failure: "/admin/settings", fallback: SETTINGS_TEXT.failure,
  });
  // Footer, gio hang, hoa don... deu doc thong tin nay tu layout goc.
  revalidatePath("/", "layout");
  redirect(target);
}
