"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api } from "@/src/services/api";
import { errorMessage, formValue } from "@/src/services/action-result";

export async function createStaffAction(formData: FormData) {
  const returnTo = safeReturnTo(formValue(formData, "returnTo"));
  let target = `${returnTo}?status=created`;
  try {
    const result = await api<{ branchId: string }>("/admin/staff", {
      method: "POST",
      body: {
        username: formValue(formData, "username"),
        name: formValue(formData, "name"),
        password: formValue(formData, "password"),
        role: formValue(formData, "role"),
        branchId: formValue(formData, "branchId"),
      },
    });
    revalidatePath("/admin/staff");
    if (result.branchId) revalidatePath(`/admin/branches/${result.branchId}`);
  } catch (error) {
    target = `${returnTo}?error=${encodeURIComponent(errorMessage(error, "Không thể tạo tài khoản."))}`;
  }
  redirect(target);
}

export async function toggleStaffAction(formData: FormData) {
  const id = formValue(formData, "id");
  if (!id) redirect("/admin/staff?error=Không tìm thấy tài khoản nhân viên.");
  let target = "/admin/staff?status=updated";
  try {
    await api(`/admin/staff/${encodeURIComponent(id)}/active`, { method: "PATCH", body: { active: formValue(formData, "active") === "true" } });
    revalidatePath("/admin/staff");
  } catch (error) {
    target = `/admin/staff?error=${encodeURIComponent(errorMessage(error, "Không thể cập nhật tài khoản."))}`;
  }
  redirect(target);
}

function safeReturnTo(value: string) {
  if (value === "/admin/staff") return value;
  if (/^\/admin\/branches\/[a-zA-Z0-9-]+$/.test(value)) return value;
  return "/admin/staff";
}
