"use server";

import { redirect } from "next/navigation";
import { api } from "@/src/services/api";
import { formValue, runAction } from "@/src/services/action-result";

const TASK_PAGES = ["/admin/tasks", "/manager", "/staff"];

/** Form giao viec co tep dinh kem (multipart) nen chuyen nguyen FormData sang backend. */
export async function createTaskAction(formData: FormData) {
  redirect(await runAction(() => api("/admin/tasks", { method: "POST", body: formData }), {
    success: "/admin/tasks?status=created", failure: "/admin/tasks", fallback: "Không thể tạo công việc.", revalidate: TASK_PAGES,
  }));
}

export async function reportTaskAction(formData: FormData) {
  const taskId = formValue(formData, "taskId");
  redirect(await runAction(() => api(`/admin/tasks/${encodeURIComponent(taskId)}/reports`, { method: "POST", body: formData }), {
    success: "/admin/tasks?status=reported", failure: "/admin/tasks", fallback: "Không thể gửi báo cáo.", revalidate: TASK_PAGES,
  }));
}

export async function completeTaskAction(formData: FormData) {
  const taskId = formValue(formData, "taskId");
  redirect(await runAction(() => api(`/admin/tasks/${encodeURIComponent(taskId)}/complete`, { method: "POST" }), {
    success: "/admin/tasks?status=completed", failure: "/admin/tasks", fallback: "Bạn không có quyền duyệt công việc này.", revalidate: TASK_PAGES,
  }));
}
