import Image from "next/image";
import Link from "next/link";
import { requireHrManagerPage } from "@/src/services/admin-auth";
import { getEmployeeDirectory } from "@/src/services/data";
import { roleLabel } from "@/src/constants/shared/roles";
import { HR_PAGE } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";

type HrQuery = { error?: string; keyword?: string; role?: string; branch?: string; status?: string };

export default async function HrPage({ searchParams }: { searchParams: Promise<HrQuery> }) {
  const [user, allEmployees, query] = await Promise.all([requireHrManagerPage("/admin/hr"), getEmployeeDirectory().catch(() => []), searchParams]);
  const scopeEmployees = user.role === "owner" ? allEmployees : allEmployees.filter((item) => item.branchId === user.branchId || (!item.branchId && item.branch === user.branch));
  const allowedRoles = user.role === "owner" ? ["manager", "sales", "consultant", "inventory", "warranty", "repair"] : ["sales", "consultant", "inventory", "warranty", "repair"];
  const selectedRole = allowedRoles.includes(query.role || "") ? query.role! : "";
  const selectedStatus = ["active", "inactive", "incomplete"].includes(query.status || "") ? query.status! : "";
  const selectedBranch = user.role === "owner" && scopeEmployees.some((item) => item.branchId === query.branch) ? query.branch || "" : "";
  const keyword = (query.keyword || "").trim().toLocaleLowerCase("vi-VN").slice(0, 80);
  const branches = uniqueBranches(scopeEmployees);
  const employees = scopeEmployees.filter((item) => {
    if (selectedRole && item.role !== selectedRole) return false;
    if (selectedBranch && item.branchId !== selectedBranch) return false;
    if (selectedStatus === "active" && !item.active) return false;
    if (selectedStatus === "inactive" && item.active) return false;
    if (selectedStatus === "incomplete" && item.profileScore === 100) return false;
    if (keyword && !`${item.name} ${item.username}`.toLocaleLowerCase("vi-VN").includes(keyword)) return false;
    return true;
  }).sort((left, right) => roleOrder(left.role) - roleOrder(right.role) || left.name.localeCompare(right.name, "vi"));
  const todayWorking = employees.filter((item) => item.todayStatus === "present" || item.todayStatus === "late").length;
  const completeProfiles = employees.filter((item) => item.profileScore === 100).length;

  return (
    <>
      <div className="admin-topline admin-hr-heading">
        <div><span>{HR_PAGE.eyebrow}</span><h1>{HR_PAGE.title}</h1><p className="admin-subtitle">{user.role === "owner" ? HR_PAGE.ownerText : HR_PAGE.managerText(user.branch)}</p></div>
        <div className="admin-actions-row"><Link className="admin-button" href="/admin/hr/cards">{HR_PAGE.createCard}</Link><Link className="admin-button" href="/admin/attendance">{HR_PAGE.attendance}</Link>{user.role === "owner" && <Link className="admin-button admin-button-primary" href="/admin/staff">{HR_PAGE.createAccount}</Link>}</div>
      </div>
      {query.error && <p className="admin-alert error">{query.error}</p>}

      <form className="admin-report-filters admin-hr-filters">
        <label className="admin-hr-search"><span>{HR_PAGE.searchLabel}</span><input name="keyword" defaultValue={query.keyword || ""} placeholder={HR_PAGE.searchPlaceholder} /></label>
        <label><span>{HR_PAGE.roleGroup}</span><select name="role" defaultValue={selectedRole}><option value="">{HR_PAGE.allRoles}</option>{user.role === "owner" && <option value="manager">{HR_PAGE.roleManager}</option>}<option value="sales">{HR_PAGE.roleSales}</option><option value="inventory">{HR_PAGE.roleInventory}</option><option value="warranty">{HR_PAGE.roleWarranty}</option><option value="repair">{HR_PAGE.roleRepair}</option><option value="consultant">{HR_PAGE.roleConsultant}</option></select></label>
        {user.role === "owner" ? <label><span>{HR_PAGE.branch}</span><select name="branch" defaultValue={selectedBranch}><option value="">{HR_PAGE.allBranches}</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label> : <label><span>{HR_PAGE.scope}</span><input value={user.branch} disabled /></label>}
        <label><span>{HR_PAGE.profileStatus}</span><select name="status" defaultValue={selectedStatus}><option value="">{HR_PAGE.allStatuses}</option><option value="active">{HR_PAGE.working}</option><option value="inactive">{HR_PAGE.locked}</option><option value="incomplete">{HR_PAGE.incomplete}</option></select></label>
        <button className="admin-button admin-button-primary" type="submit">{HR_PAGE.filter}</button>
        <Link className="admin-button" href="/admin/hr">{HR_PAGE.reset}</Link>
      </form>

      <section className="admin-report-kpis admin-hr-kpis">
        <HrMetric icon="♧" label={HR_PAGE.totalStaff} value={String(employees.length)} note={HR_PAGE.activeCount(employees.filter((item) => item.active).length)} />
        <HrMetric icon="✓" label={HR_PAGE.presentToday} value={String(todayWorking)} note={HR_PAGE.lateCount(employees.filter((item) => item.todayStatus === "late").length)} />
        <HrMetric icon="▣" label={HR_PAGE.completeProfiles} value={`${completeProfiles}/${employees.length}`} note={HR_PAGE.incompleteCount(employees.filter((item) => item.profileScore < 100).length)} />
        <HrMetric icon="⌘" label={HR_PAGE.hasBankAccount} value={String(employees.filter((item) => item.bankAccountNumber).length)} note={HR_PAGE.encrypted} />
      </section>

      <section className="admin-card admin-hr-directory">
        <div className="admin-card-head"><div><span>{HR_PAGE.showingPrefix}{employees.length}/{scopeEmployees.length} {HR_PAGE.staffSuffix}</span><h2>{HR_PAGE.listTitle}</h2></div><small>{HR_PAGE.maskedNote}</small></div>
        <div className="admin-table-wrap">
          <table className="admin-table admin-hr-table">
            <thead><tr><th>{HR_PAGE.employee}</th><th>{HR_PAGE.role}</th><th>{HR_PAGE.branch}</th><th>{HR_PAGE.joinedAt}</th><th>CCCD</th><th>{HR_PAGE.bankAccount}</th><th>{HR_PAGE.attendanceToday}</th><th>{HR_PAGE.profile}</th><th>{HR_PAGE.actions}</th></tr></thead>
            <tbody>{employees.map((employee) => <tr key={employee.adminUserId}>
              <td><div className="admin-hr-person">{employee.photoKey ? <Image src={`/api/admin/hr-photo/${employee.adminUserId}`} alt="" width={42} height={42} unoptimized /> : <b>{employee.name.slice(0, 1).toUpperCase()}</b>}<span><strong>{employee.name}</strong><small>@{employee.username} · {employee.active ? HR_PAGE.working : HR_PAGE.locked}</small></span></div></td>
              <td>{roleLabel(employee.role)}</td>
              <td title={employee.branch || HR_PAGE.noBranch}>{employee.branch || HR_PAGE.noBranch}</td>
              <td>{formatDate(employee.joinedDate)}</td>
              <td><span className="admin-sensitive-value">{employee.citizenIdMasked}</span></td>
              <td><strong>{employee.bankName || HR_PAGE.notUpdated}</strong><span>{employee.bankAccountMasked}</span></td>
              <td><span className={`admin-badge hr-attendance-${employee.todayStatus || "none"}`}>{attendanceLabel(employee.todayStatus)}</span>{employee.todayCheckIn && <span>{HR_PAGE.checkedInAt}{employee.todayCheckIn}</span>}</td>
              <td><div className="admin-profile-progress"><span><i style={{ width: `${employee.profileScore}%` }} /></span><b>{employee.profileScore}%</b></div></td>
              <td><div className="admin-hr-row-actions"><Link className="admin-table-link" href={`/admin/hr/${employee.adminUserId}`}>{HR_PAGE.openProfile}</Link><Link className="admin-table-link" href={`/admin/hr/cards?employee=${employee.adminUserId}`}>{HR_PAGE.makeCard}</Link></div></td>
            </tr>)}</tbody>
          </table>
          {!employees.length && <div className="admin-empty-state">{HR_PAGE.empty}</div>}
        </div>
      </section>
    </>
  );
}

function HrMetric({ icon, label, value, note }: { icon: string; label: string; value: string; note: string }) { return <article><i>{icon}</i><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>; }
function formatDate(value: string) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN") : HR_PAGE.notUpdated; }
function attendanceLabel(value: string) { if (value === "present") return HR_PAGE.present; if (value === "late") return HR_PAGE.late; if (value === "leave") return HR_PAGE.leave; if (value === "absent") return HR_PAGE.absent; return HR_PAGE.notCheckedIn; }
function uniqueBranches(employees: Array<{ branchId: string; branch: string }>) {
  const branches = new Map<string, string>();
  employees.forEach((employee) => { if (employee.branchId && employee.branch) branches.set(employee.branchId, employee.branch); });
  return [...branches].map(([id, name]) => ({ id, name })).sort((left, right) => left.name.localeCompare(right.name, "vi"));
}
function roleOrder(role: string) { return role === "manager" ? 0 : role === "sales" ? 1 : role === "consultant" ? 2 : role === "inventory" ? 3 : role === "warranty" ? 4 : role === "repair" ? 5 : 6; }
