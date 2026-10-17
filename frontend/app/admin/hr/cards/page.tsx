import Image from "next/image";
import Link from "next/link";
import { requireHrManagerPage } from "@/src/services/admin-auth";
import { getEmployeeDirectory } from "@/src/services/data";
import EmployeeCardPreview from "@/src/components/features/admin/hr/EmployeeCardPreview";
import { roleShortLabel } from "@/src/constants/shared/roles";
import { HR_CARDS_PAGE } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";

export default async function EmployeeCardsPage({ searchParams }: { searchParams: Promise<{ employee?: string; keyword?: string }> }) {
  const [user, allEmployees, query] = await Promise.all([requireHrManagerPage("/admin/hr/cards"), getEmployeeDirectory().catch(() => []), searchParams]);
  const scoped = (user.role === "owner" ? allEmployees : allEmployees.filter((item) => item.branchId === user.branchId || (!item.branchId && item.branch === user.branch)))
    .filter((item) => item.active)
    .sort((left, right) => roleOrder(left.role) - roleOrder(right.role) || left.name.localeCompare(right.name, "vi"));
  const keyword = (query.keyword || "").trim().toLocaleLowerCase("vi-VN").slice(0, 80);
  const employees = keyword ? scoped.filter((item) => `${item.name} ${item.username} ${item.branch}`.toLocaleLowerCase("vi-VN").includes(keyword)) : scoped;
  const selected = scoped.find((item) => item.adminUserId === query.employee) || employees[0] || scoped[0];

  return <>
    <div className="admin-topline employee-cards-heading"><div><span>{HR_CARDS_PAGE.eyebrow}</span><h1>{HR_CARDS_PAGE.title}</h1><p className="admin-subtitle">{user.role === "owner" ? HR_CARDS_PAGE.text : HR_CARDS_PAGE.managerText(user.branch)}</p></div><Link className="admin-button" href="/admin/hr">{HR_CARDS_PAGE.backToHr}</Link></div>
    <section className="employee-cards-layout">
      <aside className="admin-card employee-card-directory">
        <div><span>{scoped.length} {HR_CARDS_PAGE.activeStaff}</span><h2>{HR_CARDS_PAGE.chooseEmployee}</h2></div>
        <form><label><span aria-hidden="true">⌕</span><input name="keyword" defaultValue={query.keyword || ""} placeholder={HR_CARDS_PAGE.searchPlaceholder} /></label><button type="submit">{HR_CARDS_PAGE.search}</button></form>
        <nav>{employees.map((employee) => <Link key={employee.adminUserId} href={`/admin/hr/cards?employee=${encodeURIComponent(employee.adminUserId)}${query.keyword ? `&keyword=${encodeURIComponent(query.keyword)}` : ""}`} className={selected?.adminUserId === employee.adminUserId ? "is-active" : ""}>
          <span className="employee-card-list-avatar">{employee.photoKey ? <Image src={`/api/admin/hr-photo/${employee.adminUserId}`} alt="" width={42} height={42} unoptimized /> : employee.name.slice(0, 1).toUpperCase()}</span>
          <span><strong>{employee.name}</strong><small>{roleShortLabel(employee.role)} · {employee.branch}</small></span><b>›</b>
        </Link>)}</nav>
        {!employees.length && <p className="admin-empty-state">{HR_CARDS_PAGE.noMatch}</p>}
      </aside>
      <section className="admin-card employee-card-studio">
        <div className="employee-card-studio-title"><div><span>{HR_CARDS_PAGE.previewTitle}</span><h2>{selected ? HR_CARDS_PAGE.cardOf(selected.name) : HR_CARDS_PAGE.noEmployee}</h2></div><small>{HR_CARDS_PAGE.localNote}</small></div>
        {selected ? <EmployeeCardPreview employee={selected} /> : <div className="admin-empty-state">{HR_CARDS_PAGE.empty}</div>}
      </section>
    </section>
  </>;
}

function roleOrder(role: string) { return role === "manager" ? 0 : role === "sales" ? 1 : role === "consultant" ? 2 : role === "inventory" ? 3 : role === "warranty" ? 4 : role === "repair" ? 5 : 6; }
