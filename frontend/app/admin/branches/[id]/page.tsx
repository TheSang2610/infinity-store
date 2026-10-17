import Link from "next/link";
import { notFound } from "next/navigation";
import { canManageEmployee, requireHrManagerPage } from "@/src/services/admin-auth";
import { getAdminUsers, getBranchById } from "@/src/services/data";

import { createStaffAction } from "@/src/actions/admin/staff";
import { updateBranchAction } from "@/src/actions/admin/branches";
import { roleLabel } from "@/src/constants/shared/roles";
import { BRANCH_DETAIL_PAGE } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";

export default async function BranchPeoplePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; status?: string }> }) {
  const [{ id }, query, actor] = await Promise.all([params, searchParams, requireHrManagerPage("/admin/branches")]);
  const branch = await getBranchById(id).catch(() => undefined);
  if (!branch || (actor.role === "manager" && actor.branchId !== branch.id)) notFound();
  const employees = (await getAdminUsers().catch(() => [])).filter((employee) => employee.branchId === branch.id && canManageEmployee(actor, employee));
  const isServiceBranch = branch.code.toUpperCase().startsWith("BH") || branch.name.toLocaleUpperCase("vi-VN").includes("BẢO HÀNH");

  return <>
    <div className="admin-topline"><div><span>{branch.code} · {branch.active ? BRANCH_DETAIL_PAGE.active : BRANCH_DETAIL_PAGE.paused}</span><h1>{branch.name}</h1><p className="admin-subtitle">{branch.address} · {branch.hours}</p></div><Link className="admin-button" href={actor.role === "owner" ? "/admin/branches" : "/manager"}>{BRANCH_DETAIL_PAGE.back}</Link></div>
    {query.status === "created" && <p className="admin-alert success">{BRANCH_DETAIL_PAGE.staffAddedPrefix}{branch.name}.</p>}
    {query.status === "updated" && <p className="admin-alert success">{BRANCH_DETAIL_PAGE.branchUpdatedPrefix}{branch.name}.</p>}
    {query.error && <p className="admin-alert error">{query.error}</p>}
    {!branch.active && <p className="admin-alert error">{BRANCH_DETAIL_PAGE.pausedNote}</p>}

    <section className="admin-branch-summary"><article><span>{BRANCH_DETAIL_PAGE.totalStaff}</span><strong>{employees.length}</strong></article><article><span>{BRANCH_DETAIL_PAGE.working}</span><strong>{employees.filter((item) => item.active).length}</strong></article><article><span>{BRANCH_DETAIL_PAGE.subordinates}</span><strong>{employees.filter((item) => item.role !== "manager").length}</strong></article></section>

    {actor.role === "owner" && <section className="admin-card admin-branch-edit">
      <div className="admin-card-head"><div><span>{BRANCH_DETAIL_PAGE.infoEyebrow}</span><h2>{BRANCH_DETAIL_PAGE.infoTitle}</h2></div><small>{BRANCH_DETAIL_PAGE.infoText}</small></div>
      <form action={updateBranchAction} className="admin-branch-edit-form">
        <input type="hidden" name="id" value={branch.id}/>
        <label className="admin-field"><span>{BRANCH_DETAIL_PAGE.code}</span><input name="code" required minLength={2} maxLength={20} defaultValue={branch.code}/></label>
        <label className="admin-field"><span>{BRANCH_DETAIL_PAGE.name}</span><input name="name" required minLength={2} maxLength={100} defaultValue={branch.name}/></label>
        <label className="admin-field admin-branch-edit-address"><span>{BRANCH_DETAIL_PAGE.address}</span><input name="address" required minLength={5} maxLength={180} defaultValue={branch.address}/></label>
        <label className="admin-field"><span>{BRANCH_DETAIL_PAGE.phone}</span><input name="phone" inputMode="tel" maxLength={15} defaultValue={branch.phone}/></label>
        <label className="admin-field"><span>{BRANCH_DETAIL_PAGE.hours}</span><input name="hours" maxLength={30} defaultValue={branch.hours}/></label>
        <button className="admin-button admin-button-primary" type="submit">{BRANCH_DETAIL_PAGE.save}</button>
      </form>
    </section>}

    <section className="admin-card admin-staff-create" id="branch-staff">
      <div className="admin-card-head"><div><span>{BRANCH_DETAIL_PAGE.createAtBranch}</span><h2>{BRANCH_DETAIL_PAGE.addStaff}</h2></div><small>{actor.role === "manager" ? BRANCH_DETAIL_PAGE.managerScope : BRANCH_DETAIL_PAGE.ownerScope}</small></div>
      <form action={createStaffAction} className="admin-staff-form">
        <input type="hidden" name="branchId" value={branch.id}/><input type="hidden" name="returnTo" value={`/admin/branches/${branch.id}`}/>
        <label className="admin-field"><span>{BRANCH_DETAIL_PAGE.fullName}</span><input name="name" required placeholder={BRANCH_DETAIL_PAGE.namePlaceholder}/></label>
        <label className="admin-field"><span>{BRANCH_DETAIL_PAGE.username}</span><input name="username" required minLength={4} placeholder="nhanvien.chinhanh" autoComplete="off"/></label>
        <label className="admin-field"><span>{BRANCH_DETAIL_PAGE.initialPassword}</span><input name="password" type="password" required minLength={8} autoComplete="new-password"/></label>
        <label className="admin-field"><span>{BRANCH_DETAIL_PAGE.role}</span><select name="role" defaultValue={isServiceBranch ? "warranty" : "sales"}>{!isServiceBranch && <option value="sales">{BRANCH_DETAIL_PAGE.roleSales}</option>}{!isServiceBranch && <option value="consultant">{BRANCH_DETAIL_PAGE.roleConsultant}</option>}<option value="inventory">{BRANCH_DETAIL_PAGE.roleInventoryLong}</option>{isServiceBranch && <option value="warranty">{BRANCH_DETAIL_PAGE.roleWarranty}</option>}{isServiceBranch && <option value="repair">{BRANCH_DETAIL_PAGE.roleRepair}</option>}{actor.role === "owner" && <option value="manager">{BRANCH_DETAIL_PAGE.roleManager}</option>}</select></label>
        <label className="admin-field"><span>{BRANCH_DETAIL_PAGE.branch}</span><input value={branch.name} disabled/></label>
        <button className="admin-button admin-button-primary" type="submit" disabled={!branch.active}>{BRANCH_DETAIL_PAGE.createAccount}</button>
      </form>
    </section>

    <section className="admin-card admin-staff-list"><div className="admin-card-head"><div><span>{employees.length} {BRANCH_DETAIL_PAGE.accountsSuffix}</span><h2>{BRANCH_DETAIL_PAGE.staffAtBranch}</h2></div><Link className="admin-button" href="/admin/hr">{BRANCH_DETAIL_PAGE.openHr}</Link></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{BRANCH_DETAIL_PAGE.employee}</th><th>{BRANCH_DETAIL_PAGE.account}</th><th>{BRANCH_DETAIL_PAGE.role}</th><th>{BRANCH_DETAIL_PAGE.status}</th><th>{BRANCH_DETAIL_PAGE.createdAt}</th><th>{BRANCH_DETAIL_PAGE.profile}</th></tr></thead><tbody>{employees.map((employee) => <tr key={employee.id}><td><strong>{employee.name}</strong></td><td>@{employee.username}</td><td>{roleLabel(employee.role)}</td><td><span className={`admin-badge ${employee.active ? "status-active" : "status-inactive"}`}>{employee.active ? BRANCH_DETAIL_PAGE.active : BRANCH_DETAIL_PAGE.locked}</span></td><td>{new Date(employee.createdAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</td><td><Link className="admin-table-link" href={`/admin/hr/${employee.id}`}>{BRANCH_DETAIL_PAGE.update}</Link></td></tr>)}</tbody></table>{!employees.length && <div className="admin-empty-state">{BRANCH_DETAIL_PAGE.noStaff}</div>}</div></section>
  </>;
}
