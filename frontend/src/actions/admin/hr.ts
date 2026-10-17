"use server";

import { redirect } from "next/navigation";
import { api } from "@/src/services/api";
import { formValue, runAction } from "@/src/services/action-result";

/** Form ho so gom ca anh nhan su (multipart) nen chuyen nguyen FormData sang backend. */
export async function saveEmployeeProfileAction(formData: FormData) {
  const adminUserId = formValue(formData, "adminUserId");
  const page = `/admin/hr/${encodeURIComponent(adminUserId)}`;
  redirect(await runAction(() => api(`/admin/hr/employees/${encodeURIComponent(adminUserId)}`, { method: "PUT", body: formData }), {
    success: `${page}?status=profile-saved`, failure: page, fallback: "Không thể lưu hồ sơ nhân sự.", revalidate: ["/admin/hr", page],
  }));
}

export async function saveAttendanceAction(formData: FormData) {
  const adminUserId = formValue(formData, "adminUserId");
  const page = `/admin/hr/${encodeURIComponent(adminUserId)}`;
  const body = {
    adminUserId,
    workDate: formValue(formData, "workDate"),
    checkIn: formValue(formData, "checkIn"),
    checkOut: formValue(formData, "checkOut"),
    status: formValue(formData, "attendanceStatus"),
    note: formValue(formData, "note"),
  };
  redirect(await runAction(() => api("/admin/attendance", { method: "PUT", body }), {
    success: `${page}?status=attendance-saved`, failure: page, fallback: "Không thể lưu chấm công.", revalidate: ["/admin/hr", "/admin/attendance", page],
  }));
}
