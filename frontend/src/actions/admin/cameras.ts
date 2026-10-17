"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api } from "@/src/services/api";
import { formValue, runAction } from "@/src/services/action-result";

export async function createCameraAction(formData: FormData) {
  const body = {
    branchId: formValue(formData, "branchId"),
    name: formValue(formData, "name"),
    location: formValue(formData, "location"),
    streamUrl: formValue(formData, "streamUrl"),
    streamType: formValue(formData, "streamType"),
  };
  redirect(await runAction(() => api("/admin/cameras", { method: "POST", body }), {
    success: "/admin/cameras?status=camera-created", failure: "/admin/cameras", fallback: "Không thể thêm camera.", revalidate: ["/admin/cameras"],
  }));
}

export async function toggleCameraAction(formData: FormData) {
  await api(`/admin/cameras/${encodeURIComponent(formValue(formData, "id"))}/active`, {
    method: "PATCH", body: { active: formValue(formData, "active") === "true" },
  });
  revalidatePath("/admin/cameras");
}

export async function grantCameraAction(formData: FormData) {
  const body = { adminUserId: formValue(formData, "adminUserId"), branchId: formValue(formData, "branchId") };
  redirect(await runAction(() => api("/admin/camera-permissions", { method: "POST", body }), {
    success: "/admin/cameras?status=permission-created", failure: "/admin/cameras", fallback: "Không thể cấp quyền.", revalidate: ["/admin/cameras"],
  }));
}

export async function revokeCameraAction(formData: FormData) {
  await api(`/admin/camera-permissions/${encodeURIComponent(formValue(formData, "id"))}`, { method: "DELETE" });
  revalidatePath("/admin/cameras");
}
