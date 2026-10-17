import { requireOwnerPage } from "@/src/services/admin-auth";
import { getAdminUsers, getBranches } from "@/src/services/data";
import { createStaffAction, toggleStaffAction } from "@/src/actions/admin/staff";

import Link from "next/link";
import { roleLabel } from "@/src/constants/shared/roles";
import { STAFF_PAGE } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  await requireOwnerPage("/admin/staff");
  const query = await searchParams;
  const [users,branches] = await Promise.all([getAdminUsers().catch(() => []),getBranches(false).catch(()=>[])]);

  return (
    <>
      <div className="admin-topline">
        <div><span>{STAFF_PAGE.eyebrow}</span><h1>{STAFF_PAGE.title}</h1><p className="admin-subtitle">{STAFF_PAGE.text}</p></div>
        <Link className="admin-button" href="/admin/hr">{STAFF_PAGE.hrProfiles}</Link>
      </div>

      {query.status === "created" && <p className="admin-alert success">{STAFF_PAGE.created}</p>}
      {query.status === "updated" && <p className="admin-alert success">{STAFF_PAGE.statusUpdated}</p>}
      {query.error && <p className="admin-alert error">{query.error}</p>}
      {!branches.length && <p className="admin-alert error">{STAFF_PAGE.needPrefix}<Link href="/admin/branches"><strong>{STAFF_PAGE.createBranch}</strong></Link> {STAFF_PAGE.beforeAddingStaff}</p>}

      <section className="admin-branch-summary admin-staff-summary">
        <article><span>{STAFF_PAGE.active}</span><strong>{users.filter((user) => user.active).length}</strong></article>
        <article><span>{STAFF_PAGE.roleManager}</span><strong>{users.filter((user) => user.role === "manager" && user.active).length}</strong></article>
        <article><span>{STAFF_PAGE.roleSales}</span><strong>{users.filter((user) => user.role === "sales" && user.active).length}</strong></article>
        <article><span>{STAFF_PAGE.roleConsultant}</span><strong>{users.filter((user) => user.role === "consultant" && user.active).length}</strong></article>
        <article><span>{STAFF_PAGE.roleWarranty}</span><strong>{users.filter((user) => user.role === "warranty" && user.active).length}</strong></article>
        <article><span>{STAFF_PAGE.roleRepair}</span><strong>{users.filter((user) => user.role === "repair" && user.active).length}</strong></article>
        <article><span>{STAFF_PAGE.roleInventory}</span><strong>{users.filter((user) => user.role === "inventory" && user.active).length}</strong></article>
      </section>

      <section className="admin-card admin-staff-create">
        <div className="admin-card-head"><div><span>{STAFF_PAGE.newAccount}</span><h2>{STAFF_PAGE.grantAccess}</h2></div></div>
        <form action={createStaffAction} className="admin-staff-form">
          <input type="hidden" name="returnTo" value="/admin/staff" />
          <label className="admin-field"><span>{STAFF_PAGE.fullName}</span><input name="name" required placeholder={STAFF_PAGE.namePlaceholder} /></label>
          <label className="admin-field"><span>{STAFF_PAGE.username}</span><input name="username" required minLength={4} placeholder="nhanvien.quan1" autoComplete="off" /></label>
          <label className="admin-field"><span>{STAFF_PAGE.initialPassword}</span><input name="password" type="password" required minLength={8} autoComplete="new-password" /></label>
          <label className="admin-field"><span>{STAFF_PAGE.role}</span><select name="role" defaultValue="sales"><option value="sales">{STAFF_PAGE.roleSales}</option><option value="consultant">{STAFF_PAGE.roleConsultant}</option><option value="inventory">{STAFF_PAGE.roleInventoryLong}</option><option value="warranty">{STAFF_PAGE.roleWarranty}</option><option value="repair">{STAFF_PAGE.roleRepair}</option><option value="manager">{STAFF_PAGE.roleManager}</option></select></label>
          <label className="admin-field"><span>{STAFF_PAGE.branch}</span><select name="branchId" required defaultValue=""><option value="" disabled>{STAFF_PAGE.chooseBranch}</option>{branches.map(branch=><option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
          <button className="admin-button admin-button-primary" type="submit" disabled={!branches.length}>{STAFF_PAGE.createAccount}</button>
        </form>
        <p className="admin-form-note">{STAFF_PAGE.serviceBranchNote}</p>
      </section>

      <section className="admin-card admin-staff-list">
        <div className="admin-card-head"><div><span>{users.length} {STAFF_PAGE.accountsSuffix}</span><h2>{STAFF_PAGE.staffList}</h2></div></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>{STAFF_PAGE.employee}</th><th>{STAFF_PAGE.username}</th><th>{STAFF_PAGE.role}</th><th>{STAFF_PAGE.branch}</th><th>{STAFF_PAGE.createdAt}</th><th>{STAFF_PAGE.status}</th><th>{STAFF_PAGE.profile}</th><th>{STAFF_PAGE.actions}</th></tr></thead>
            <tbody>{users.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.name}</strong></td><td>{user.username}</td>
                <td>{roleLabel(user.role)}</td>
                <td>{branches.find(branch=>branch.id===user.branchId)?.name||user.branch||STAFF_PAGE.noBranch}</td>
                <td>{new Date(user.createdAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</td>
                <td><span className={`admin-badge ${user.active ? "status-active" : "status-inactive"}`}>{user.active ? STAFF_PAGE.active : STAFF_PAGE.locked}</span></td>
                <td><Link className="admin-table-link" href={`/admin/hr/${user.id}`}>{STAFF_PAGE.update}</Link></td>
                <td><form action={toggleStaffAction}><input type="hidden" name="id" value={user.id} /><input type="hidden" name="active" value={String(!user.active)} /><button className={`admin-button ${user.active ? "admin-button-danger" : "admin-button-muted"}`} type="submit">{user.active ? STAFF_PAGE.lock : STAFF_PAGE.unlock}</button></form></td>
              </tr>
            ))}</tbody>
          </table>
          {!users.length && <div className="admin-empty-state">{STAFF_PAGE.empty}</div>}
        </div>
      </section>
    </>
  );
}
