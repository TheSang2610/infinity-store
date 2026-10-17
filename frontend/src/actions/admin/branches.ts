"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api } from "@/src/services/api";
import { formValue, runAction } from "@/src/services/action-result";

const branchBody = (formData: FormData) => ({
  code: formValue(formData, "code"),
  name: formValue(formData, "name"),
  address: formValue(formData, "address"),
  phone: formValue(formData, "phone"),
  hours: formValue(formData, "hours"),
});

export async function createBranchAction(formData: FormData) {
  redirect(await runAction(() => api("/admin/branches", { method: "POST", body: branchBody(formData) }), {
    success: "/admin/branches?status=created", failure: "/admin/branches", fallback: "Không thể tạo chi nhánh.", revalidate: ["/admin/branches"],
  }));
}

export async function toggleBranchAction(formData: FormData) {
  await api(`/admin/branches/${encodeURIComponent(formValue(formData, "id"))}/active`, {
    method: "PATCH", body: { active: formValue(formData, "active") === "true" },
  });
  revalidatePath("/admin/branches");
  redirect("/admin/branches?status=updated");
}

export async function updateBranchAction(formData: FormData) {
  const id = formValue(formData, "id");
  const page = `/admin/branches/${encodeURIComponent(id)}`;
  redirect(await runAction(() => api(page, { method: "PUT", body: branchBody(formData) }), {
    success: `${page}?status=updated`, failure: page, fallback: "Không thể cập nhật chi nhánh.",
    revalidate: ["/admin/branches", page, "/admin/orders", "/admin/staff"],
  }));
}
