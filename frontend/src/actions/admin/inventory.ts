"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireInventoryAction } from "@/src/services/admin-auth";
import { api } from "@/src/services/api";
import { errorMessage, formValue } from "@/src/services/action-result";

export async function adjustInventoryAction(formData: FormData) {
  const actor = await requireInventoryAction();
  // Giam doc chon chi nhanh tren URL; nguoi khac luon o chi nhanh cua minh.
  const branchQuery = actor.role === "owner" && formValue(formData, "branchId") ? `branch=${encodeURIComponent(formValue(formData, "branchId"))}&` : "";
  let target: string;
  try {
    const result = await api<{ operation: string }>("/admin/inventory/adjust", {
      method: "POST",
      body: {
        branchId: formValue(formData, "branchId"),
        productId: formValue(formData, "productId"),
        operation: formValue(formData, "operation"),
        quantity: Number(formValue(formData, "quantity")),
        note: formValue(formData, "note"),
      },
    });
    target = `/admin/inventory?${branchQuery}status=${result.operation}`;
  } catch (error) {
    target = `/admin/inventory?${branchQuery}error=${encodeURIComponent(errorMessage(error, "Không thể điều chỉnh tồn kho."))}`;
  }
  revalidatePath("/admin/inventory");
  redirect(target);
}
