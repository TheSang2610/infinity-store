import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { portalPathForRole, requireAdminPage } from "@/src/services/admin-auth";
import { LEGACY_ADMIN } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: LEGACY_ADMIN.metaTitle,
  robots: { index: false, follow: false },
};

export default async function ProductManagementEntry() {
  const user = await requireAdminPage();
  redirect(portalPathForRole(user.role));
}
