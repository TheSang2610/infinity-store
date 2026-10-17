import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/src/services/admin-auth";
import { getManagedOrders, getManagedProducts } from "@/src/services/data";

import { formatDate, formatMoney, orderTotalNumber, statusLabel } from "@/src/lib/admin/format";
import { ORDERS_PAGE } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; paymentStatus?: string; paymentMethod?: string; branch?: string; from?: string; to?: string }>;
}) {
  const [query, user] = await Promise.all([searchParams, requireAdminPage("/admin/orders")]);
  if (user.role === "consultant") redirect("/admin");
  const [allOrders, products] = await Promise.all([getManagedOrders().catch(() => []), getManagedProducts()]);
  const orders = user.role === "owner" ? allOrders : user.role === "manager" ? allOrders.filter((item) => item.branchId === user.branchId) : allOrders.filter((item) => item.assignedAdminId === user.id);
  const visible = filterOrders(orders, query);
  const paymentMethods = [...new Set(orders.map((order) => order.paymentMethod).filter(Boolean))];
  const branchOptions = [...new Map(orders.filter((order) => order.branchId).map((order) => [order.branchId, order.branchName])).entries()];

  return (
    <>
      <div className="admin-topline">
        <div><span>{ORDERS_PAGE.eyebrow}</span><h1>{ORDERS_PAGE.title}</h1></div>
      </div>
      <form className="admin-toolbar">
        <input name="q" defaultValue={query.q} placeholder={ORDERS_PAGE.searchPlaceholder} />
        <select name="status" defaultValue={query.status ?? ""}><option value="">{ORDERS_PAGE.allStatuses}</option>{["pending", "confirmed", "processing", "shipping", "delivered", "cancelled", "returned"].map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select>
        <select name="paymentStatus" defaultValue={query.paymentStatus ?? ""}><option value="">{ORDERS_PAGE.payment}</option>{["not_required", "unpaid", "paid", "refunded", "failed"].map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select>
        <select name="paymentMethod" defaultValue={query.paymentMethod ?? ""}><option value="">{ORDERS_PAGE.method}</option>{paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}</select>
        {user.role === "owner" && <select name="branch" defaultValue={query.branch ?? ""}><option value="">{ORDERS_PAGE.allBranches}</option><option value="unassigned">{ORDERS_PAGE.unassigned}</option>{branchOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>}
        <input type="date" name="from" defaultValue={query.from} />
        <input type="date" name="to" defaultValue={query.to} />
        <button className="admin-button" type="submit">{ORDERS_PAGE.filter}</button>
      </form>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>{ORDERS_PAGE.orderCode}</th><th>{ORDERS_PAGE.customer}</th><th>{ORDERS_PAGE.product}</th><th>{ORDERS_PAGE.branchAssignee}</th><th>{ORDERS_PAGE.total}</th><th>{ORDERS_PAGE.payment}</th><th>{ORDERS_PAGE.paymentStatus}</th><th>{ORDERS_PAGE.orderStatus}</th><th>{ORDERS_PAGE.invoice}</th><th>{ORDERS_PAGE.createdAt}</th><th>{ORDERS_PAGE.actions}</th></tr></thead>
          <tbody>
            {visible.map((order) => (
              <tr key={order.id}>
                <td><strong>{order.orderCode}</strong><span>#{order.id.slice(0, 8)}</span></td>
                <td><strong>{order.customerName}</strong><span>{order.phone}</span></td>
                <td>{order.items.length > 1 ? ORDERS_PAGE.lineCount(order.items.length) : order.productName}<span>{order.note.includes("[ĐẶT TRƯỚC") ? ORDERS_PAGE.preorderNoDeposit : order.deliveryMethod === "Đến cửa hàng xem máy" ? ORDERS_PAGE.storeVisitRequest : `${ORDERS_PAGE.quantityProducts(order.quantity)}${order.voucherCode ? ` · Voucher ${order.voucherCode}` : ""}`}</span></td>
                <td><strong>{order.branchName || ORDERS_PAGE.unassigned}</strong><span>{order.assignedAdminName || ORDERS_PAGE.noStaff}</span></td>
                <td>{formatMoney(orderTotalNumber(order, products))}</td>
                <td>{order.paymentMethod || ORDERS_PAGE.notSelected}{order.financeCompany && <span>{order.financeCompany} · {order.installmentTerm} {ORDERS_PAGE.months}</span>}</td>
                <td><span className={`admin-badge status-${order.paymentStatus}`}>{statusLabel(order.paymentStatus)}</span></td>
                <td><span className={`admin-badge status-${order.status}`}>{statusLabel(order.status)}</span></td>
                <td><span className={`admin-badge invoice-${order.invoiceStatus}`}>{invoiceStatusLabel(order.invoiceStatus)}</span></td>
                <td>{formatDate(order.createdAt)}</td>
                <td><Link className="admin-table-link" href={`/admin/orders/${order.id}`}>{ORDERS_PAGE.details}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && <div className="admin-empty-state">{ORDERS_PAGE.empty}</div>}
      </div>
    </>
  );
}

function invoiceStatusLabel(status: string) {
  if (status === "draft") return ORDERS_PAGE.invoiceDraft;
  if (status === "ready") return ORDERS_PAGE.invoiceReady;
  if (status === "issued") return ORDERS_PAGE.invoiceIssued;
  if (status === "cancelled") return ORDERS_PAGE.invoiceCancelled;
  return ORDERS_PAGE.invoiceNotCreated;
}

function filterOrders(orders: Awaited<ReturnType<typeof getManagedOrders>>, query: { q?: string; status?: string; paymentStatus?: string; paymentMethod?: string; branch?: string; from?: string; to?: string }) {
  const q = query.q?.trim().toLowerCase();
  return orders.filter((order) => {
    const matchesSearch = !q || [order.id, order.orderCode, order.customerName, order.phone].some((value) => value.toLowerCase().includes(q));
    const matchesStatus = !query.status || order.status === query.status;
    const matchesPaymentStatus = !query.paymentStatus || order.paymentStatus === query.paymentStatus;
    const matchesPayment = !query.paymentMethod || order.paymentMethod === query.paymentMethod;
    const matchesBranch = !query.branch || (query.branch === "unassigned" ? !order.branchId : order.branchId === query.branch);
    const created = new Date(order.createdAt).getTime();
    const from = query.from ? new Date(query.from).getTime() : 0;
    const to = query.to ? new Date(query.to).getTime() + 86_399_999 : Number.POSITIVE_INFINITY;
    return matchesSearch && matchesStatus && matchesPaymentStatus && matchesPayment && matchesBranch && created >= from && created <= to;
  });
}
