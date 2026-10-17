import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/src/services/admin-auth";
import { getAdminUsers, getBranches, getAdminConversations, getReportingOrders, getManagedProducts, getProductViewStats } from "@/src/services/data";

import { buildBusinessAnalytics } from "@/src/lib/admin/business-analytics";
import { formatMoney, orderTotalNumber, productPriceNumber, statusLabel } from "@/src/lib/admin/format";
import { DASHBOARD_PAGE } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const currentUser = await requireAdminPage("/admin");
  if (currentUser.role === "manager") redirect("/manager");
  if (currentUser.role !== "owner") redirect("/staff");
  const [products, orders, viewStats, branches, staff, conversations] = await Promise.all([
    getManagedProducts(),
    getReportingOrders().catch(() => []),
    getProductViewStats(),
    getBranches().catch(() => []),
    getAdminUsers().catch(() => []),
    getAdminConversations().catch(() => []),
  ]);
  const analyticsOrders = orders;
  const analyticsBranches = branches;
  const analyticsStaff = staff;
  const branchScopeId = "";
  const analytics = buildBusinessAnalytics({ orders: analyticsOrders, products, branches: analyticsBranches, staff: analyticsStaff, conversations, periodDays: 30, branchScopeId });
  const visibleOrders = orders;
  const processing = visibleOrders.filter((order) => ["pending", "confirmed", "processing", "shipping"].includes(order.status)).length;
  const lowStock = products.filter((product) => (product.stock ?? 0) <= 3).length;
  const topProducts = [...products].sort((a, b) => productPriceNumber(b) - productPriceNumber(a)).slice(0, 5);
  const chartSeed = buildChart(visibleOrders, products);
  const chartTotal = chartSeed.reduce((sum, item) => sum + item.value, 0);
  const canViewReports = currentUser.role === "owner" || currentUser.role === "manager";

  return (
    <>
      <div className="admin-topline admin-dashboard-heading">
        <div><span>{DASHBOARD_PAGE.eyebrow}</span><h1>{DASHBOARD_PAGE.greeting}{currentUser.name}</h1><p className="admin-subtitle">{fullDate()} · {currentUser.branch || DASHBOARD_PAGE.allBranches}</p></div>
        <div className="admin-actions-row">{canViewReports && <Link className="admin-button" href="/admin/reports">{DASHBOARD_PAGE.viewReports}</Link>}{(currentUser.role === "owner" || currentUser.role === "manager") && <Link className="admin-button admin-button-primary" href="/admin/products/new">{DASHBOARD_PAGE.addProduct}</Link>}</div>
      </div>

      <section className="admin-executive-kpis">
        <ExecutiveMetric icon="↗" label={DASHBOARD_PAGE.revenue30d} value={money(analytics.revenue)} note={DASHBOARD_PAGE.deliveredOrders(analytics.deliveredCount)} tone="blue" />
        <ExecutiveMetric icon="▤" label={DASHBOARD_PAGE.ordersInPeriod} value={String(analytics.orderCount)} note={DASHBOARD_PAGE.processingOrders(analytics.activeOrders)} tone="violet" />
        <ExecutiveMetric icon="◎" label={DASHBOARD_PAGE.completionRate} value={`${analytics.completionRate}%`} note={DASHBOARD_PAGE.averageValue(money(analytics.averageOrder))} tone="green" />
        <ExecutiveMetric icon="◌" label={DASHBOARD_PAGE.viewersToday} value={viewStats.todayVisitors.toLocaleString("vi-VN")} note={DASHBOARD_PAGE.totalViews(viewStats.totalViews.toLocaleString("vi-VN"))} tone="orange" />
      </section>

      <section className="admin-operational-strip">
        <article><i className="is-blue">▤</i><span><small>{DASHBOARD_PAGE.ordersToHandle}</small><strong>{processing}</strong></span><Link href="/admin/orders">{DASHBOARD_PAGE.check}</Link></article>
        <article><i className="is-orange">△</i><span><small>{DASHBOARD_PAGE.lowStock}</small><strong>{lowStock}</strong></span><Link href="/admin/products?stock=low">Xem kho →</Link></article>
        <article><i className="is-green">✦</i><span><small>{DASHBOARD_PAGE.waitingChats}</small><strong>{conversations.filter((item) => item.status === "waiting").length}</strong></span><Link href="/admin/live-chat">{DASHBOARD_PAGE.openInbox}</Link></article>
        <article><i className="is-violet">⌘</i><span><small>{DASHBOARD_PAGE.activeBranches}</small><strong>{branches.filter((item) => item.active).length}/{branches.length}</strong></span>{currentUser.role === "owner" ? <Link href="/admin/branches">{DASHBOARD_PAGE.manage}</Link> : <small>{currentUser.branch}</small>}</article>
      </section>

      <section className="admin-card admin-quick-actions admin-business-actions">
        <div><span>{DASHBOARD_PAGE.quickAccess}</span><strong>{DASHBOARD_PAGE.commonTasks}</strong></div>
        <nav>
          <Link href="/admin/tasks">{DASHBOARD_PAGE.tasksAndReports}</Link>
          <Link href="/admin/orders">{DASHBOARD_PAGE.handleOrders}</Link>
          <Link href="/admin/student-verifications">{DASHBOARD_PAGE.reviewStudents}</Link>
          {(currentUser.role === "owner" || currentUser.role === "manager" || currentUser.role === "consultant") && <Link href="/admin/live-chat">{DASHBOARD_PAGE.consultCustomers}</Link>}
          {(currentUser.role === "owner" || currentUser.role === "manager" || currentUser.role === "sales") && <Link href="/admin/products">{DASHBOARD_PAGE.manageProducts}</Link>}
          {currentUser.role === "owner" && <Link href="/admin/staff">{DASHBOARD_PAGE.manageHr}</Link>}
          {canViewReports && <Link href="/admin/reports">{DASHBOARD_PAGE.businessAnalytics}</Link>}
        </nav>
      </section>

      <section className="admin-dashboard-grid admin-business-grid">
        <article className="admin-card admin-revenue-panel">
          <div className="admin-card-head"><div><span>Doanh thu</span><h2>{DASHBOARD_PAGE.revenue7d}</h2></div>{canViewReports && <Link href="/admin/reports?period=7">{DASHBOARD_PAGE.details}</Link>}</div>
          <div className="admin-chart-summary"><span>{DASHBOARD_PAGE.deliveredRevenue}</span><strong>{money(chartTotal)}</strong></div>
          <div className="admin-chart admin-blue-chart">
            {chartSeed.map((item) => <div key={item.label} style={{ height: `${Math.max(8, item.percent)}%` }}><span>{money(item.value)}</span><small>{item.label}</small></div>)}
          </div>
        </article>

        <article className="admin-card admin-recent-orders">
          <div className="admin-card-head"><div><span>{DASHBOARD_PAGE.orders}</span><h2>{DASHBOARD_PAGE.latestOrders}</h2></div><Link href="/admin/orders">{DASHBOARD_PAGE.viewAll}</Link></div>
          <div className="admin-list">
            {visibleOrders.slice(0, 6).map((order) => <Link href={`/admin/orders/${order.id}`} key={order.id}><strong>{order.customerName}</strong><span>{order.productName} · {order.branchName || DASHBOARD_PAGE.noBranch}</span><em className={`admin-badge status-${order.status}`}>{statusLabel(order.status)}</em></Link>)}
            {!visibleOrders.length && <p className="admin-empty-state">{DASHBOARD_PAGE.noOrders}</p>}
          </div>
        </article>

        {canViewReports && <article className="admin-card admin-span-2 admin-dashboard-branches">
          <div className="admin-card-head"><div><span>{DASHBOARD_PAGE.branchPerformance}</span><h2>{DASHBOARD_PAGE.branchPerformance30d}</h2></div><Link href="/admin/reports">{DASHBOARD_PAGE.fullReport}</Link></div>
          <div>{analytics.branchRows.slice(0, 5).map((branch, index) => <article key={branch.id}><b>{String(index + 1).padStart(2, "0")}</b><span><strong>{branch.name}</strong><small>{branch.orders} {DASHBOARD_PAGE.ordersDot}{branch.completionRate}{DASHBOARD_PAGE.percentDone}</small></span><div><strong>{money(branch.revenue)}</strong><i><em style={{ width: `${branch.revenueShare}%` }} /></i></div></article>)}{!analytics.branchRows.length && <p className="admin-empty-state">{DASHBOARD_PAGE.noBranchData}</p>}</div>
        </article>}

        {canViewReports && <article className="admin-card admin-dashboard-people">
          <div className="admin-card-head"><div><span>{DASHBOARD_PAGE.staffEyebrow}</span><h2>{DASHBOARD_PAGE.topStaff}</h2></div><Link href="/admin/reports">{DASHBOARD_PAGE.viewPerformance}</Link></div>
          <div>{analytics.employeeRows.slice(0, 5).map((employee) => <article key={employee.id}><b>{employee.name.slice(0, 1).toUpperCase()}</b><span><strong>{employee.name}</strong><small>{employee.branch} · {employee.delivered}/{employee.orders} {DASHBOARD_PAGE.ordersCompleted}</small></span><em>{employee.score}</em></article>)}</div>
        </article>}

        <article className={`admin-card ${canViewReports ? "" : "admin-span-2"}`}>
          <div className="admin-card-head"><div><span>{DASHBOARD_PAGE.catalogEyebrow}</span><h2>{DASHBOARD_PAGE.highValueProducts}</h2></div><Link href="/admin/products">{DASHBOARD_PAGE.catalogEyebrow}</Link></div>
          <div className="admin-top-products">
            {topProducts.map((product) => <Link href={`/admin/products/${product.id}`} key={product.id}><Image src={product.image} alt="" width={52} height={52} unoptimized /><div><strong>{product.name}</strong><span>{product.stock ?? 0} {DASHBOARD_PAGE.productsInStock}</span></div><em>{product.salePrice || product.sellingPrice || product.price}</em></Link>)}
          </div>
        </article>

        <article className="admin-card admin-span-2">
          <div className="admin-card-head"><div><span>{DASHBOARD_PAGE.customerInterest}</span><h2>{DASHBOARD_PAGE.popularProducts}</h2></div><strong>{viewStats.uniqueVisitors.toLocaleString("vi-VN")} {DASHBOARD_PAGE.uniqueVisitors}</strong></div>
          <div className="admin-view-ranking">{viewStats.products.map((item, index) => <Link href={`/san-pham/${item.slug}`} key={item.slug}><b>{String(index + 1).padStart(2, "0")}</b><div><strong>{item.name}</strong><span>{item.visitors.toLocaleString("vi-VN")} {DASHBOARD_PAGE.visitorsViewed}</span></div><em>{item.views.toLocaleString("vi-VN")} {DASHBOARD_PAGE.views}</em></Link>)}{!viewStats.products.length && <p className="admin-empty-state">{DASHBOARD_PAGE.noViewData}</p>}</div>
        </article>
      </section>
    </>
  );
}

function ExecutiveMetric({ icon, label, value, note, tone }: { icon: string; label: string; value: string; note: string; tone: string }) {
  return <article><i className={`tone-${tone}`}>{icon}</i><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

function buildChart(orders: Awaited<ReturnType<typeof getReportingOrders>>, products: Awaited<ReturnType<typeof getManagedProducts>>) {
  const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (6 - index)); return { label: date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }), key: date.toLocaleDateString("vi-VN"), value: 0 }; });
  for (const order of orders.filter((item) => item.status === "delivered")) { const day = days.find((item) => item.key === new Date(order.createdAt).toLocaleDateString("vi-VN")); if (day) day.value += orderTotalNumber(order, products); }
  const max = Math.max(1, ...days.map((item) => item.value));
  return days.map((item) => ({ ...item, percent: Math.round(item.value / max * 100) }));
}

function money(value: number) { return value ? formatMoney(value) : DASHBOARD_PAGE.zeroMoney; }
function fullDate() { return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date()); }
