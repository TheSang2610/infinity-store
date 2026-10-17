"use server";

import { redirect } from "next/navigation";
import { api } from "@/src/services/api";
import { formValue, runAction } from "@/src/services/action-result";

export async function reviewStudentVerificationAction(formData: FormData) {
  const id = formValue(formData, "id");
  const decision = formValue(formData, "decision");
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(id) || (decision !== "approved" && decision !== "rejected")) {
    redirect("/admin/student-verifications?error=Yêu cầu xét duyệt không hợp lệ.");
  }
  const body = { decision, note: formValue(formData, "note") };
  redirect(await runAction(() => api(`/admin/student-verifications/${encodeURIComponent(id)}/review`, { method: "POST", body }), {
    success: `/admin/student-verifications?status=${decision}`,
    failure: "/admin/student-verifications",
    fallback: "Không thể cập nhật hồ sơ.",
    revalidate: ["/admin/student-verifications", "/member"],
  }));
}
