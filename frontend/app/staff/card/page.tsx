import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/src/services/admin-auth";
import BusinessPortalShell from "@/src/components/layout/BusinessPortalShell";
import EmployeeCardPreview from "@/src/components/features/admin/hr/EmployeeCardPreview";
import { getEmployeeProfile } from "@/src/services/data";
import { STAFF_CARD_PAGE } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";

export default async function MyEmployeeCardPage() {
  const user = await requireAdminPage("/staff/card");
  if (user.role === "owner") redirect("/admin/hr/cards");
  const employee = await getEmployeeProfile(user.id);
  if (!employee) redirect(`${user.role === "manager" ? "/manager" : "/staff"}?error=${encodeURIComponent(STAFF_CARD_PAGE.noProfileError)}`);
  return <BusinessPortalShell user={user}>
    <div className="admin-topline"><div><span>{STAFF_CARD_PAGE.eyebrow}</span><h1>{STAFF_CARD_PAGE.title}</h1><p className="admin-subtitle">{STAFF_CARD_PAGE.text}</p></div><div className="admin-actions-row">{user.role === "manager" && <Link className="admin-button admin-button-primary" href={`/admin/hr/${user.id}`}>{STAFF_CARD_PAGE.updateProfile}</Link>}<Link className="admin-button" href={user.role === "manager" ? "/manager" : "/staff"}>{STAFF_CARD_PAGE.backToWork}</Link></div></div>
    <p className="admin-alert my-card-readonly">{STAFF_CARD_PAGE.permissionNote}</p>
    <section className="admin-card my-employee-card"><EmployeeCardPreview employee={employee} /></section>
  </BusinessPortalShell>;
}
