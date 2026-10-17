"use server";

import { redirect } from "next/navigation";
import { api } from "@/src/services/api";
import { formValue, runAction } from "@/src/services/action-result";

export async function savePayrollAction(formData: FormData) {
  const month = formValue(formData, "payrollMonth");
  const query = `month=${encodeURIComponent(month)}&branch=${encodeURIComponent(formValue(formData, "branch"))}`;
  const body = {
    adminUserId: formValue(formData, "adminUserId"),
    payrollMonth: month,
    bonusAmount: formValue(formData, "bonusAmount"),
    socialInsuranceAmount: formValue(formData, "socialInsuranceAmount"),
    personalIncomeTaxAmount: formValue(formData, "personalIncomeTaxAmount"),
    workDays: formValue(formData, "workDays"),
    status: formValue(formData, "status"),
    note: formValue(formData, "note"),
  };
  redirect(await runAction(() => api("/admin/payroll", { method: "PUT", body }), {
    success: `/admin/payroll?${query}&status=saved`, failure: `/admin/payroll?${query}`, fallback: "Không thể lưu kiểm kê lương.", revalidate: ["/admin/payroll"],
  }));
}
