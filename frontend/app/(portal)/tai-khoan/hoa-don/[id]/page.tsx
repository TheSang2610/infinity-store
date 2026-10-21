import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentCustomer } from "@/src/services/customer-auth";
import { getCustomerOrderById, getStoreSettings } from "@/src/services/data";
import DocumentStamp from "@/src/components/common/DocumentStamp";
import MemberPrintButton from "@/src/components/features/portal/account/MemberPrintButton";
import { MEMBER_INVOICE_PAGE } from "@/src/constants/portal/pages";
import { formatVnd } from "@/src/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: MEMBER_INVOICE_PAGE.metaTitle, robots: { index: false, follow: false } };

export default async function MemberInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const customer = await currentCustomer();
  if (!customer) redirect("/member");
  const { id } = await params;
  const [order, { invoiceSeller: seller }] = await Promise.all([getCustomerOrderById(id), getStoreSettings()]);
  if (!order) notFound();

  const items = order.items.length ? order.items : [{ productSlug: order.productSlug, productName: order.productName, ram: "", storage: order.storage, color: order.color, quantity: order.quantity, unitPrice: Number(order.total) / Math.max(1, order.quantity), image: "" }];
  const startDate = order.warrantyStartDate || order.invoiceDate;
  const endDate = warrantyEndDate(startDate, order.warrantyMonths);

  return <main className="member-invoice-page shell">
    <div className="member-invoice-toolbar"><Link href="/member">← Trang Member</Link><MemberPrintButton /></div>
    <article className="member-invoice-document">
      <header><div><span>INFINITY STORE</span><h1>{MEMBER_INVOICE_PAGE.title}</h1><p>{MEMBER_INVOICE_PAGE.subtitle}</p></div><dl><div><dt>{MEMBER_INVOICE_PAGE.orderCode}</dt><dd>{order.orderCode}</dd></div><div><dt>{MEMBER_INVOICE_PAGE.invoiceNumber}</dt><dd>{order.invoiceNumber || MEMBER_INVOICE_PAGE.notIssued}</dd></div><div><dt>{MEMBER_INVOICE_PAGE.date}</dt><dd>{formatDate(order.invoiceDate || new Date(order.createdAt).toISOString().slice(0, 10))}</dd></div></dl></header>
      {order.invoiceStatus === "not_created" && <p className="member-invoice-pending">{MEMBER_INVOICE_PAGE.notIssuedNote}</p>}
      <section className="member-invoice-parties"><div><span>{MEMBER_INVOICE_PAGE.seller}</span><strong>{order.invoiceSellerName || seller.name}</strong><p>{order.invoiceSellerAddress || seller.address}</p><p>{order.invoiceSellerPhone || seller.phone}</p></div><div><span>{MEMBER_INVOICE_PAGE.buyer}</span><strong>{order.invoiceCompanyName || order.invoiceBuyerName || order.customerName}</strong><p>{order.invoiceAddress || order.address || MEMBER_INVOICE_PAGE.storePickup}</p><p>{order.invoiceEmail || order.email}</p></div></section>
      <div className="member-invoice-table-wrap"><table><thead><tr><th>{MEMBER_INVOICE_PAGE.product}</th><th>SL</th><th>{MEMBER_INVOICE_PAGE.unitPrice}</th><th>{MEMBER_INVOICE_PAGE.lineTotal}</th></tr></thead><tbody>{items.map((item, index) => <tr key={`${item.productSlug}-${index}`}><td><strong>{item.productName}</strong><small>{[item.ram && `RAM ${item.ram}`, item.storage, item.color].filter(Boolean).join(" · ")}</small></td><td>{item.quantity}</td><td>{formatVnd(item.unitPrice)}</td><td>{formatVnd(item.unitPrice * item.quantity)}</td></tr>)}</tbody></table></div>
      <section className="member-invoice-total"><span>{MEMBER_INVOICE_PAGE.total}</span><strong>{formatVnd(Number(order.total))}</strong></section>
      {order.paymentStatus === "paid" && <div className="document-stamp-row member-invoice-stamp"><DocumentStamp kind="collected" date={formatDate(order.invoiceDate || new Date(order.createdAt).toISOString().slice(0, 10))} /></div>}
      <section className="member-invoice-warranty"><header><div><span>{MEMBER_INVOICE_PAGE.warrantyTitle}</span><h2>{startDate ? MEMBER_INVOICE_PAGE.warrantyActive : MEMBER_INVOICE_PAGE.warrantyPending}</h2></div><b>{order.warrantyMonths || 12} {MEMBER_INVOICE_PAGE.months}</b></header><div className="member-invoice-warranty-grid"><p><span>{MEMBER_INVOICE_PAGE.start}</span><strong>{formatDate(startDate) || MEMBER_INVOICE_PAGE.notUpdated}</strong></p><p><span>{MEMBER_INVOICE_PAGE.end}</span><strong>{formatDate(endDate) || MEMBER_INVOICE_PAGE.unknown}</strong></p><p><span>Serial / IMEI</span><strong>{order.warrantySerials || MEMBER_INVOICE_PAGE.notUpdated}</strong></p><p><span>{MEMBER_INVOICE_PAGE.serviceLocation}</span><strong>{order.branchName || "Infinity Store"}</strong></p></div><p className="member-invoice-policy">{order.warrantyPolicy || MEMBER_INVOICE_PAGE.warrantyTerms}</p></section>
      <footer><p>{MEMBER_INVOICE_PAGE.privacyNote}</p><Link href="/bao-hanh">{MEMBER_INVOICE_PAGE.lookupLink}</Link></footer>
    </article>
  </main>;
}

function formatDate(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return ""; return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)); }
function warrantyEndDate(startDate: string, months: number) { if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || months <= 0) return ""; const date = new Date(`${startDate}T00:00:00Z`); date.setUTCMonth(date.getUTCMonth() + months); return date.toISOString().slice(0, 10); }
