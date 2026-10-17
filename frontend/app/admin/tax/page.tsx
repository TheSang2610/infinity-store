import Link from "next/link";
import { requireOwnerPage } from "@/src/services/admin-auth";
import { orderTotalNumber } from "@/src/lib/admin/format";
import { getReportingOrders } from "@/src/services/data";
import type { ManagedOrder } from "@/src/types";
import { TAX_PAGE } from "@/src/constants/admin/pages";
import { formatVnd } from "@/src/lib/format";

export const dynamic = "force-dynamic";

export default async function TaxReportPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireOwnerPage("/admin/tax");
  const query = await searchParams;
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(query.month || "") ? query.month! : currentMonth();
  const orders = (await getReportingOrders().catch(() => [])).filter((order) => monthFor(order.createdAt) === month && order.paymentStatus !== "not_required" && !["cancelled", "returned"].includes(order.status));
  const collected = orders.filter((order) => order.paymentStatus === "paid" || order.status === "delivered");
  const rows = collected.map((order) => ({ order, ...taxFor(order) }));
  const revenue = rows.reduce((sum, row) => sum + row.orderTotal, 0);
  const collectedVat = rows.reduce((sum, row) => sum + row.vat, 0);
  const declaredVat = rows.filter((row) => row.order.invoiceStatus === "issued").reduce((sum, row) => sum + row.vat, 0);
  const pendingRows = rows.filter((row) => row.order.invoiceStatus !== "issued");

  return <>
    <div className="admin-topline"><div><span>{TAX_PAGE.eyebrow}</span><h1>{TAX_PAGE.title}</h1><p className="admin-subtitle">{TAX_PAGE.text}</p></div></div>
    <form className="admin-report-filters"><label><span>{TAX_PAGE.period}</span><input type="month" name="month" defaultValue={month}/></label><button className="admin-button admin-button-primary">{TAX_PAGE.generate}</button></form>
    <section className="admin-report-kpis"><Metric label={TAX_PAGE.collectedRevenue} value={formatVnd(revenue)} note={TAX_PAGE.eligibleOrders(rows.length)}/><Metric label={TAX_PAGE.estimatedVat} value={formatVnd(collectedVat)} note={TAX_PAGE.vatNote}/><Metric label={TAX_PAGE.issuedVat} value={formatVnd(declaredVat)} note={TAX_PAGE.invoicesCount(rows.filter((row) => row.order.invoiceStatus === "issued").length)}/><Metric label={TAX_PAGE.toReview} value={formatVnd(Math.max(0, collectedVat - declaredVat))} note={TAX_PAGE.pendingInvoices(pendingRows.length)}/></section>
    <p className="admin-ledger-note"><strong>{TAX_PAGE.noteLabel}</strong> {TAX_PAGE.noteText}</p>
    <section className="admin-card admin-report-table-card"><div className="admin-card-head"><div><span>{monthLabel(month)} · {rows.length} {TAX_PAGE.transactions}</span><h2>{TAX_PAGE.outputTaxTitle}</h2></div><small>{TAX_PAGE.outputTaxText}</small></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{TAX_PAGE.order}</th><th>{TAX_PAGE.collectedAt}</th><th>{TAX_PAGE.branch}</th><th>Doanh thu</th><th>{TAX_PAGE.taxRate}</th><th>{TAX_PAGE.preVat}</th><th>{TAX_PAGE.vatEstimate}</th><th>{TAX_PAGE.invoice}</th><th>{TAX_PAGE.review}</th></tr></thead><tbody>{rows.map(({ order, orderTotal, taxable, vat }) => <tr key={order.id}><td><strong>{order.orderCode}</strong><span>{order.customerName}</span></td><td>{new Date(order.createdAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</td><td>{order.branchName || TAX_PAGE.unassigned}</td><td><strong>{formatVnd(orderTotal)}</strong></td><td>{order.invoiceTaxRate}% {order.invoiceTaxIncluded ? TAX_PAGE.vatIncluded : TAX_PAGE.vatExcluded}</td><td>{formatVnd(taxable)}</td><td><strong>{formatVnd(vat)}</strong></td><td><span className={`admin-badge ${order.invoiceStatus === "issued" ? "status-active" : "status-inactive"}`}>{invoiceLabel(order.invoiceStatus)}</span></td><td><Link className="admin-table-link" href={`/admin/orders/${order.id}`}>{TAX_PAGE.openOrder}</Link></td></tr>)}</tbody></table>{!rows.length && <div className="admin-empty-state">{TAX_PAGE.empty}</div>}</div></section>
  </>;
}

function taxFor(order: ManagedOrder) { const orderTotal = orderTotalNumber(order); const rate = Math.max(0, order.invoiceTaxRate); const taxable = rate > 0 && order.invoiceTaxIncluded ? Math.round(orderTotal / (1 + rate / 100)) : orderTotal; const vat = rate > 0 ? order.invoiceTaxIncluded ? orderTotal - taxable : Math.round(taxable * rate / 100) : 0; return { orderTotal, taxable, vat }; }
function Metric({ label, value, note }: { label: string; value: string; note: string }) { return <article><i>％</i><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>; }
function monthFor(timestamp: number) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit" }).format(new Date(timestamp)); }
function currentMonth() { return monthFor(Date.now()); }
function monthLabel(value: string) { const [year, month] = value.split("-"); return TAX_PAGE.monthLabel(Number(month), year); }
function invoiceLabel(value: string) { if (value === "issued") return TAX_PAGE.invoiceIssued; if (value === "draft") return TAX_PAGE.invoiceDraft; if (value === "cancelled") return TAX_PAGE.invoiceCancelled; return TAX_PAGE.invoiceNotCreated; }
