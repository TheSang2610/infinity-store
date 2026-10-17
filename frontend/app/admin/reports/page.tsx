import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/src/services/admin-auth";
import { getAdminUsers, getBranches, getAdminConversations, getReportingOrders, getManagedProducts } from "@/src/services/data";

import { buildBusinessAnalytics } from "@/src/lib/admin/business-analytics";
import { formatMoney } from "@/src/lib/admin/format";
import ReportPrintButton from "@/src/components/features/admin/reports/ReportPrintButton";
import { roleLabel } from "@/src/constants/shared/roles";
import { REPORTS_PAGE } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ period?: string; branch?: string }> }) {
  const user = await requireAdminPage("/admin/reports");
  if (user.role !== "owner" && user.role !== "manager") redirect("/admin?error=report-access");
  const query = await searchParams;
  const period = [7, 30, 90, 365].includes(Number(query.period)) ? Number(query.period) : 30;
  const [orders, products, branches, staff, conversations] = await Promise.all([
    getReportingOrders().catch(() => []),
    getManagedProducts(),
    getBranches().catch(() => []),
    getAdminUsers().catch(() => []),
    getAdminConversations(user.role === "manager" ? user.branchId : "").catch(() => []),
  ]);
  const requestedBranch = user.role === "manager" ? user.branchId : query.branch || "";
  const branchScopeId = branches.some((item) => item.id === requestedBranch) ? requestedBranch : "";
  const analytics = buildBusinessAnalytics({ orders, products, branches, staff, conversations, periodDays: period, branchScopeId });
  const maxBranchRevenue = Math.max(1, ...analytics.branchRows.map((item) => item.revenue));

  return (
    <>
      <div className="admin-topline admin-report-heading">
        <div><span>{REPORTS_PAGE.eyebrow}</span><h1>{REPORTS_PAGE.title}</h1><p className="admin-subtitle">{REPORTS_PAGE.text}</p></div>
        <div className="admin-actions-row"><ReportPrintButton /></div>
      </div>

      <form className="admin-report-filters">
        <label><span>{REPORTS_PAGE.period}</span><select name="period" defaultValue={String(period)}><option value="7">{REPORTS_PAGE.last7Days}</option><option value="30">{REPORTS_PAGE.last30Days}</option><option value="90">{REPORTS_PAGE.last90Days}</option><option value="365">{REPORTS_PAGE.last12Months}</option></select></label>
        {user.role === "owner" && <label><span>{REPORTS_PAGE.branchScope}</span><select name="branch" defaultValue={branchScopeId}><option value="">{REPORTS_PAGE.allBranches}</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>}
        <button className="admin-button admin-button-primary" type="submit">{REPORTS_PAGE.apply}</button>
      </form>

      <section className="admin-report-kpis">
        <ReportMetric icon="↗" label={REPORTS_PAGE.revenue} value={money(analytics.revenue)} note={REPORTS_PAGE.deliveredOrders(analytics.deliveredCount)} />
        <ReportMetric icon="▤" label={REPORTS_PAGE.totalOrders} value={String(analytics.orderCount)} note={REPORTS_PAGE.processingOrders(analytics.activeOrders)} />
        <ReportMetric icon="◎" label={REPORTS_PAGE.completionRate} value={`${analytics.completionRate}%`} note={REPORTS_PAGE.cancelledOrders(analytics.cancelled)} />
        <ReportMetric icon="◈" label={REPORTS_PAGE.averageOrder} value={money(analytics.averageOrder)} note={REPORTS_PAGE.unassignedOrdersNote(analytics.unassignedOrders)} />
      </section>

      <section className="admin-report-grid">
        <article className="admin-card admin-report-branch-chart">
          <div className="admin-card-head"><div><span>{REPORTS_PAGE.branchEyebrow}</span><h2>{REPORTS_PAGE.revenueBreakdown}</h2></div><small>{period} {REPORTS_PAGE.lastDays}</small></div>
          <div>{analytics.branchRows.map((branch) => <div className="admin-branch-bar" key={branch.id}><header><span><strong>{branch.name}</strong><small>{branch.orders} {REPORTS_PAGE.ordersDot}{branch.completionRate}{REPORTS_PAGE.percentDone}</small></span><b>{money(branch.revenue)}</b></header><div><i style={{ width: `${Math.max(branch.revenue ? 4 : 0, branch.revenue / maxBranchRevenue * 100)}%` }} /></div></div>)}{!analytics.branchRows.length && <p className="admin-empty-state">{REPORTS_PAGE.noBranchData}</p>}</div>
        </article>

        <article className="admin-card admin-report-attention">
          <div className="admin-card-head"><div><span>{REPORTS_PAGE.operationsEyebrow}</span><h2>{REPORTS_PAGE.attention}</h2></div></div>
          <Link href="/admin/orders"><i className="tone-orange">!</i><span><strong>{analytics.activeOrders} {REPORTS_PAGE.ordersProcessing}</strong><small>{REPORTS_PAGE.processingHint}</small></span><b>→</b></Link>
          <Link href="/admin/orders"><i className="tone-blue">⌁</i><span><strong>{analytics.unassignedOrders} {REPORTS_PAGE.unassignedOrders}</strong><small>{REPORTS_PAGE.unassignedHint}</small></span><b>→</b></Link>
          <Link href={user.role === "owner" ? "/admin/staff" : "/admin/reports#employee-performance"}><i className="tone-green">✓</i><span><strong>{analytics.employeeRows.filter((item) => item.active).length} {REPORTS_PAGE.activeStaff}</strong><small>{REPORTS_PAGE.activeStaffHint}</small></span><b>→</b></Link>
        </article>
      </section>

      <section className="admin-card admin-report-table-card">
        <div className="admin-card-head"><div><span>Branch P&amp;L</span><h2>{REPORTS_PAGE.revenueByBranch}</h2></div></div>
        <div className="admin-table-wrap"><table className="admin-table admin-report-table"><thead><tr><th>{REPORTS_PAGE.branchEyebrow}</th><th>{REPORTS_PAGE.orders}</th><th>{REPORTS_PAGE.delivered}</th><th>{REPORTS_PAGE.processing}</th><th>Doanh thu</th><th>{REPORTS_PAGE.averageOrderShort}</th><th>{REPORTS_PAGE.share}</th><th>{REPORTS_PAGE.completed}</th></tr></thead><tbody>{analytics.branchRows.map((branch) => <tr key={branch.id}><td><strong>{branch.name}</strong><span>{branch.code}</span></td><td>{branch.orders}</td><td>{branch.delivered}</td><td>{branch.open}</td><td><strong>{money(branch.revenue)}</strong></td><td>{money(branch.averageOrder)}</td><td>{branch.revenueShare}%</td><td><span className={`admin-performance-rate ${branch.completionRate >= 70 ? "is-good" : branch.completionRate >= 40 ? "is-medium" : ""}`}>{branch.completionRate}%</span></td></tr>)}</tbody></table></div>
      </section>

      <section className="admin-card admin-report-table-card" id="employee-performance">
        <div className="admin-card-head"><div><span>{REPORTS_PAGE.performanceEyebrow}</span><h2>{REPORTS_PAGE.staffPerformance}</h2></div><small>{REPORTS_PAGE.scoreFormula}</small></div>
        <div className="admin-table-wrap"><table className="admin-table admin-report-table"><thead><tr><th>{REPORTS_PAGE.employee}</th><th>{REPORTS_PAGE.branchEyebrow}</th><th>{REPORTS_PAGE.role}</th><th>{REPORTS_PAGE.assignedOrders}</th><th>{REPORTS_PAGE.delivered}</th><th>{REPORTS_PAGE.processing}</th><th>Doanh thu</th><th>{REPORTS_PAGE.chatsHandled}</th><th>{REPORTS_PAGE.performance}</th></tr></thead><tbody>{analytics.employeeRows.map((employee, index) => <tr key={employee.id}><td><div className="admin-employee-cell"><b>{index + 1}</b><span><strong>{employee.name}</strong><small>{employee.active ? REPORTS_PAGE.active : REPORTS_PAGE.locked}</small></span></div></td><td>{employee.branch}</td><td>{roleLabel(employee.role)}</td><td>{employee.orders}</td><td>{employee.delivered}</td><td>{employee.open}</td><td><strong>{money(employee.revenue)}</strong></td><td>{employee.closedChats}/{employee.chats}</td><td><span className={`admin-score ${employee.score >= 70 ? "is-good" : employee.score >= 40 ? "is-medium" : ""}`}>{employee.score}</span></td></tr>)}</tbody></table>{!analytics.employeeRows.length && <div className="admin-empty-state">{REPORTS_PAGE.noStaff}</div>}</div>
      </section>
    </>
  );
}

function ReportMetric({ icon, label, value, note }: { icon: string; label: string; value: string; note: string }) {
  return <article><i>{icon}</i><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

function money(value: number) { return value ? formatMoney(value) : REPORTS_PAGE.zeroMoney; }
