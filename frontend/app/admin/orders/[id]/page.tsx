import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getManagedOrderById, getManagedProducts, getBranches, getAdminUsers, getStoreSettings } from "@/src/services/data";

import { changeOrderPaymentStatusAction, changeOrderStatusAction, saveOrderInvoiceAction } from "@/src/actions/admin/orders-products";
import { requireAdminPage } from "@/src/services/admin-auth";

import { formatDateTime, formatMoney, nextOrderStatuses, orderStatuses, orderTotalNumber, paymentStatuses, statusLabel } from "@/src/lib/admin/format";
import PrintButtons from "@/src/components/features/admin/common/PrintButtons";
import OrderAssignmentForm from "@/src/components/features/admin/orders/OrderAssignmentForm";
import DocumentStamp from "@/src/components/common/DocumentStamp";
import { ORDER_DETAIL_PAGE } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string; error?: string }> }) {
  const [{ id }, query, currentUser] = await Promise.all([params, searchParams, requireAdminPage("/admin/orders")]);
  const canAssign = currentUser.role === "owner" || currentUser.role === "manager";
  const [order, products, allBranches, allStaff, { invoiceSeller: seller }] = await Promise.all([
    getManagedOrderById(id),
    getManagedProducts(),
    canAssign ? getBranches(false).catch(() => []) : Promise.resolve([]),
    canAssign ? getAdminUsers().catch(() => []) : Promise.resolve([]),
    getStoreSettings(),
  ]);
  if (!order) notFound();
  const isAssignedWorker = currentUser.role === "sales" || currentUser.role === "warranty" || currentUser.role === "repair";
  const canViewOrder = currentUser.role === "owner" || (currentUser.role === "manager" && order.branchId === currentUser.branchId) || (isAssignedWorker && order.assignedAdminId === currentUser.id);
  if (!canViewOrder) notFound();
  const branches = currentUser.role === "manager" ? allBranches.filter((item) => item.id === currentUser.branchId) : allBranches;
  const staff = allStaff.filter((item) => item.active && item.role !== "owner" && item.role !== "inventory" && (currentUser.role !== "manager" || item.branchId === currentUser.branchId));
  const product = products.find((item) => item.slug === order.productSlug || item.name === order.productName);
  const unitPrice = product ? orderTotalNumber({ ...order, quantity: 1 }, products) : 0;
  const orderItems = order.items.length ? order.items : [{
    productSlug: order.productSlug, productName: order.productName, ram: "", storage: order.storage,
    color: order.color, quantity: order.quantity, unitPrice, image: product?.image || "",
  }];
  const subtotal = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const total = orderTotalNumber(order, products);
  const invoiceDate = order.invoiceDate || new Date(order.createdAt).toISOString().slice(0, 10);
  const warrantyStartDate = order.warrantyStartDate || invoiceDate;
  const taxRate = order.invoiceTaxRate;
  const taxMultiplier = 1 + taxRate / 100;
  const taxableAmount = order.invoiceTaxIncluded && taxRate > 0 ? Math.round(total / taxMultiplier) : total;
  const taxAmount = taxRate > 0
    ? order.invoiceTaxIncluded ? total - taxableAmount : Math.round(taxableAmount * taxRate / 100)
    : 0;
  const invoiceTotal = order.invoiceTaxIncluded ? total : total + taxAmount;
  const warrantyPolicy = order.warrantyPolicy || DEFAULT_WARRANTY_POLICY;
  const isStoreConsultation = order.deliveryMethod === "Đến cửa hàng xem máy";

  return (
    <>
      <div className="admin-topline">
        <div><span>{ORDER_DETAIL_PAGE.orderPrefix}{order.orderCode}</span><h1>{ORDER_DETAIL_PAGE.title}</h1></div>
        <div className="admin-actions-row">
          <PrintButtons />
          <Link className="admin-button" href="/admin/orders">{ORDER_DETAIL_PAGE.back}</Link>
        </div>
      </div>
      {query.status && <p className="admin-alert success">{query.status === "invoice-saved" ? ORDER_DETAIL_PAGE.invoiceSaved : query.status === "assigned" ? ORDER_DETAIL_PAGE.assignmentSaved : ORDER_DETAIL_PAGE.orderUpdated}</p>}
      {query.error && <p className="admin-alert error">{query.error}</p>}
      {isStoreConsultation && <p className="admin-alert success">{ORDER_DETAIL_PAGE.visitRequestPrefix}{order.branchName || ORDER_DETAIL_PAGE.selectedBranch} {ORDER_DETAIL_PAGE.visitRequestNote}</p>}
      <section className="admin-order-detail">
        <div className="admin-card">
          <div className="admin-card-head"><div><span>{ORDER_DETAIL_PAGE.infoTitle}</span><h2>{formatDateTime(order.createdAt)}</h2></div></div>
          <div className="admin-detail-grid">
            <p><span>{ORDER_DETAIL_PAGE.paymentCode}</span><strong>{order.orderCode}</strong></p>
            <p><span>{ORDER_DETAIL_PAGE.customer}</span><strong>{order.customerName}</strong></p>
            <p><span>{ORDER_DETAIL_PAGE.phone}</span><a href={`tel:${order.phone}`}>{order.phone}</a></p>
            <p><span>Email</span>{order.email || ORDER_DETAIL_PAGE.none}</p>
            <p><span>{ORDER_DETAIL_PAGE.paymentMethod}</span>{order.paymentMethod || ORDER_DETAIL_PAGE.notSelected}</p>
            <p><span>{ORDER_DETAIL_PAGE.requestType}</span><strong>{isStoreConsultation ? ORDER_DETAIL_PAGE.storeVisit : ORDER_DETAIL_PAGE.onlineOrder}</strong></p>
            <p><span>{ORDER_DETAIL_PAGE.customerAccount}</span>{order.customerId ? `#${order.customerId.slice(0, 8)}` : ORDER_DETAIL_PAGE.guestCheckout}</p>
            <p><span>Voucher</span>{order.voucherCode || ORDER_DETAIL_PAGE.notUsed}</p>
            <p className="admin-span-2"><span>{isStoreConsultation ? ORDER_DETAIL_PAGE.serviceBranch : "Shipping address"}</span>{isStoreConsultation ? `${order.branchName} · ${order.address}` : order.address}</p>
            <p className="admin-span-2"><span>{ORDER_DETAIL_PAGE.note}</span>{order.note || ORDER_DETAIL_PAGE.noNote}</p>
          </div>
        </div>
        <div className="admin-card">
          <div className="admin-card-head"><div><span>{ORDER_DETAIL_PAGE.status}</span><h2>{ORDER_DETAIL_PAGE.update}</h2></div></div>
          {/* Chi hien trang thai hien tai + cac buoc duoc di tiep (quy trinh o lib/admin/format.ts). */}
          {nextOrderStatuses(order.status).length ? (
            <form action={changeOrderStatusAction} className="admin-status-form">
              <input type="hidden" name="id" value={order.id} />
              <select name="status" defaultValue={order.status}>{[order.status, ...nextOrderStatuses(order.status)].map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select>
              <button className="admin-button admin-button-primary" type="submit">{ORDER_DETAIL_PAGE.updateStatus}</button>
            </form>
          ) : (
            <p className="admin-status-form">{statusLabel(order.status)} · {ORDER_DETAIL_PAGE.updateStatusFinal}</p>
          )}
          <form action={changeOrderPaymentStatusAction} className="admin-status-form">
            <input type="hidden" name="id" value={order.id} />
            <select name="paymentStatus" defaultValue={order.paymentStatus}>{paymentStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select>
            <button className="admin-button" type="submit">{ORDER_DETAIL_PAGE.updatePayment}</button>
          </form>
          <div className="admin-order-assignment">
            <span>{ORDER_DETAIL_PAGE.assignmentTitle}</span>
            {canAssign ? <OrderAssignmentForm orderId={order.id} branches={branches} staff={staff} defaultBranchId={order.branchId || currentUser.branchId} defaultAdminId={order.assignedAdminId} lockBranch={currentUser.role === "manager"} /> : <div className="admin-assignment-readonly"><strong>{order.branchName || ORDER_DETAIL_PAGE.noBranch}</strong><small>{order.assignedAdminName || ORDER_DETAIL_PAGE.noAssignee}</small></div>}
          </div>
        </div>
        {order.financeCompany && (
          <div className="admin-card admin-span-2 admin-sensitive">
            <div className="admin-card-head">
              <div><span>{ORDER_DETAIL_PAGE.sensitiveNote}</span><h2>{ORDER_DETAIL_PAGE.installmentTitle}</h2></div>
              <strong className="admin-finance-company">{order.financeCompany}</strong>
            </div>
            <div className="admin-detail-grid">
              <p><span>{ORDER_DETAIL_PAGE.orderValue}</span><strong>{formatMoney(total)}</strong></p>
              <p><span>{ORDER_DETAIL_PAGE.downPayment}</span><strong>{order.downPaymentPercent}% · {formatMoney(Number(order.downPaymentAmount))}</strong></p>
              <p><span>{ORDER_DETAIL_PAGE.financedAmount}</span><strong>{formatMoney(Number(order.financedAmount))}</strong></p>
              <p><span>{ORDER_DETAIL_PAGE.term}</span><strong>{order.installmentTerm} {ORDER_DETAIL_PAGE.months}</strong></p>
              <p><span>{ORDER_DETAIL_PAGE.monthlyPayment}</span><strong>{formatMoney(Number(order.monthlyPayment))}</strong></p>
              <p><span>{ORDER_DETAIL_PAGE.totalInterest}</span><strong>{formatMoney(Number(order.estimatedInterest))}</strong></p>
              <p><span>{ORDER_DETAIL_PAGE.applicantName}</span><strong>{order.installmentName}</strong></p>
              <p><span>{ORDER_DETAIL_PAGE.phone}</span><a href={`tel:${order.installmentPhone}`}>{order.installmentPhone}</a></p>
              <p><span>{ORDER_DETAIL_PAGE.dateOfBirth}</span><strong>{formatProfileDate(order.dateOfBirth)}</strong></p>
              <p><span>{ORDER_DETAIL_PAGE.citizenId}</span><strong className="admin-citizen-id">{order.citizenId}</strong></p>
              <p><span>{ORDER_DETAIL_PAGE.issuedAt}</span><strong>{formatProfileDate(order.citizenIdIssueDate)}</strong></p>
              <p><span>{ORDER_DETAIL_PAGE.issuedPlace}</span><strong>{order.citizenIdIssuePlace}</strong></p>
            </div>
          </div>
        )}
        <div className="admin-card admin-span-2 admin-invoice-form">
          <div className="admin-card-head">
            <div><span>{ORDER_DETAIL_PAGE.invoiceEyebrow}</span><h2>{ORDER_DETAIL_PAGE.invoiceTitle}</h2></div>
            <span className={`admin-badge invoice-${order.invoiceStatus}`}>{invoiceStatusLabel(order.invoiceStatus)}</span>
          </div>
          <p className="admin-form-note">{ORDER_DETAIL_PAGE.invoiceText}</p>
          <form action={saveOrderInvoiceAction}>
            <input type="hidden" name="id" value={order.id} />
            <fieldset className="admin-invoice-section">
              <legend>{ORDER_DETAIL_PAGE.documentStatus}</legend>
              <div className="admin-invoice-grid admin-invoice-grid-4">
                <label><span>{ORDER_DETAIL_PAGE.invoiceStatus}</span><select name="invoiceStatus" defaultValue={order.invoiceStatus}><option value="not_created">{ORDER_DETAIL_PAGE.invoiceNotCreated}</option><option value="draft">{ORDER_DETAIL_PAGE.invoiceDraft}</option><option value="ready">{ORDER_DETAIL_PAGE.invoiceReady}</option><option value="issued">{ORDER_DETAIL_PAGE.invoiceIssued}</option><option value="cancelled">{ORDER_DETAIL_PAGE.invoiceCancelled}</option></select></label>
                <label><span>{ORDER_DETAIL_PAGE.invoiceNumber}</span><input name="invoiceNumber" defaultValue={order.invoiceNumber} placeholder="VD: 00000125" /></label>
                <label><span>{ORDER_DETAIL_PAGE.invoiceSeries}</span><input name="invoiceSeries" defaultValue={order.invoiceSeries} placeholder="VD: 1C26THA" /></label>
                <label><span>{ORDER_DETAIL_PAGE.invoiceTemplate}</span><input name="invoiceTemplateCode" defaultValue={order.invoiceTemplateCode} placeholder="VD: 1" /></label>
                <label><span>{ORDER_DETAIL_PAGE.invoiceDate}</span><input type="date" name="invoiceDate" defaultValue={invoiceDate} /></label>
                <label><span>{ORDER_DETAIL_PAGE.buyerType}</span><select name="invoiceBuyerType" defaultValue={order.invoiceBuyerType}><option value="individual">{ORDER_DETAIL_PAGE.individual}</option><option value="company">{ORDER_DETAIL_PAGE.business}</option></select></label>
                <label><span>{ORDER_DETAIL_PAGE.vatRate}</span><select name="invoiceTaxRate" defaultValue={String(order.invoiceTaxRate)}><option value="0">0%</option><option value="5">5%</option><option value="8">8%</option><option value="10">10%</option></select></label>
                <label className="admin-invoice-checkbox"><input type="checkbox" name="invoiceTaxIncluded" defaultChecked={order.invoiceTaxIncluded} /><span>{ORDER_DETAIL_PAGE.vatIncluded}</span></label>
              </div>
            </fieldset>
            <fieldset className="admin-invoice-section">
              <legend>{ORDER_DETAIL_PAGE.sellerTitle}</legend>
              <div className="admin-invoice-grid">
                <label><span>{ORDER_DETAIL_PAGE.sellerName}</span><input name="invoiceSellerName" defaultValue={order.invoiceSellerName || seller.name} /></label>
                <label><span>{ORDER_DETAIL_PAGE.taxCode}</span><input name="invoiceSellerTaxCode" inputMode="numeric" defaultValue={order.invoiceSellerTaxCode || seller.taxCode} placeholder={ORDER_DETAIL_PAGE.taxCodePlaceholder} /></label>
                <label className="admin-span-2"><span>{ORDER_DETAIL_PAGE.address}</span><input name="invoiceSellerAddress" defaultValue={order.invoiceSellerAddress || seller.address} /></label>
                <label><span>{ORDER_DETAIL_PAGE.phone}</span><input name="invoiceSellerPhone" defaultValue={order.invoiceSellerPhone || seller.phone} /></label>
              </div>
            </fieldset>
            <fieldset className="admin-invoice-section">
              <legend>{ORDER_DETAIL_PAGE.buyerTitle}</legend>
              <div className="admin-invoice-grid">
                <label><span>{ORDER_DETAIL_PAGE.buyerName}</span><input name="invoiceBuyerName" defaultValue={order.invoiceBuyerName || order.customerName} /></label>
                <label><span>{ORDER_DETAIL_PAGE.companyName}</span><input name="invoiceCompanyName" defaultValue={order.invoiceCompanyName} placeholder={ORDER_DETAIL_PAGE.companyNamePlaceholder} /></label>
                <label><span>{ORDER_DETAIL_PAGE.buyerTaxCode}</span><input name="invoiceTaxCode" inputMode="numeric" defaultValue={order.invoiceTaxCode} /></label>
                <label><span>{ORDER_DETAIL_PAGE.invoiceEmail}</span><input type="email" name="invoiceEmail" defaultValue={order.invoiceEmail || order.email} /></label>
                <label className="admin-span-2"><span>{ORDER_DETAIL_PAGE.invoiceAddress}</span><input name="invoiceAddress" defaultValue={order.invoiceAddress || order.address} /></label>
                <label className="admin-span-2"><span>{ORDER_DETAIL_PAGE.invoiceNote}</span><textarea name="invoiceNote" rows={3} defaultValue={order.invoiceNote} placeholder={ORDER_DETAIL_PAGE.invoiceNotePlaceholder} /></label>
              </div>
            </fieldset>
            <fieldset className="admin-invoice-section">
              <legend>{ORDER_DETAIL_PAGE.warrantyTitle}</legend>
              <div className="admin-invoice-grid">
                <label><span>{ORDER_DETAIL_PAGE.warrantyMonths}</span><div className="admin-input-suffix"><input type="number" min="0" max="120" name="warrantyMonths" defaultValue={order.warrantyMonths || 12} /><span>{ORDER_DETAIL_PAGE.months}</span></div></label>
                <label><span>{ORDER_DETAIL_PAGE.warrantyStart}</span><input type="date" name="warrantyStartDate" defaultValue={warrantyStartDate} /></label>
                <label className="admin-span-2"><span>{ORDER_DETAIL_PAGE.serials}</span><textarea name="warrantySerials" rows={3} defaultValue={order.warrantySerials} placeholder={ORDER_DETAIL_PAGE.serialsPlaceholder} /></label>
                <label className="admin-span-2"><span>{ORDER_DETAIL_PAGE.warrantyPolicy}</span><textarea name="warrantyPolicy" rows={7} defaultValue={warrantyPolicy} /></label>
              </div>
            </fieldset>
            <div className="admin-invoice-summary">
              <div><span>{ORDER_DETAIL_PAGE.afterDiscount}</span><strong>{formatMoney(total)}</strong></div>
              <div><span>{ORDER_DETAIL_PAGE.beforeTax}</span><strong>{formatMoney(taxableAmount)}</strong></div>
              <div><span>VAT {taxRate}%</span><strong>{formatMoney(taxAmount)}</strong></div>
              <div><span>{ORDER_DETAIL_PAGE.invoiceTotal}</span><strong>{formatMoney(invoiceTotal)}</strong></div>
            </div>
            <div className="admin-form-actions"><button className="admin-button admin-button-primary" type="submit">{ORDER_DETAIL_PAGE.saveInvoice}</button></div>
          </form>
        </div>
        <div className="admin-card admin-span-2">
          <div className="admin-card-head"><div><span>{ORDER_DETAIL_PAGE.productsEyebrow}</span><h2>{ORDER_DETAIL_PAGE.productsTitle}</h2></div></div>
          {orderItems.map((item, index) => {
            const managed = products.find((candidate) => candidate.slug === item.productSlug);
            const image = item.image || managed?.image;
            return <div className="admin-order-product" key={`${item.productSlug}-${item.ram}-${item.storage}-${item.color}-${index}`}>
              <div>{image ? <Image src={image} alt="" width={86} height={86} unoptimized /> : <span />}</div>
              <div><strong>{item.productName}</strong><span>SKU: {managed?.sku || item.productSlug || "N/A"}</span><span>{[item.ram && ORDER_DETAIL_PAGE.ramValue(item.ram), item.storage && ORDER_DETAIL_PAGE.storageValue(item.storage), item.color && ORDER_DETAIL_PAGE.colorValue(item.color)].filter(Boolean).join(" · ") || ORDER_DETAIL_PAGE.standardConfig}</span></div>
              <p>{item.quantity}</p>
              <p>{formatMoney(item.unitPrice)}</p>
              <p>{formatMoney(item.unitPrice * item.quantity)}</p>
            </div>;
          })}
          <div className="admin-totals">
            <p><span>{ORDER_DETAIL_PAGE.subtotal}</span><strong>{formatMoney(subtotal)}</strong></p>
            <p><span>{ORDER_DETAIL_PAGE.shippingFee}</span><strong>{Number(order.shippingFee) > 0 ? formatMoney(Number(order.shippingFee)) : ORDER_DETAIL_PAGE.zeroMoney}</strong></p>
            <p><span>{ORDER_DETAIL_PAGE.discount}</span><strong>{Number(order.discount) > 0 ? `-${formatMoney(Number(order.discount))}` : ORDER_DETAIL_PAGE.zeroMoney}</strong></p>
            <p><span>{ORDER_DETAIL_PAGE.grandTotal}</span><strong>{formatMoney(total)}</strong></p>
          </div>
        </div>
        <div className="admin-card admin-span-2">
          <div className="admin-card-head"><div><span>{ORDER_DETAIL_PAGE.progressEyebrow}</span><h2>{ORDER_DETAIL_PAGE.progressTitle}</h2></div></div>
          <ol className="admin-timeline">
            {["pending", "confirmed", "processing", "shipping", "delivered"].map((status) => (
              <li key={status} className={orderStatuses.indexOf(order.status) >= orderStatuses.indexOf(status) ? "is-done" : ""}>
                <span />
                <div><strong>{statusLabel(status)}</strong><small>{status === "pending" ? formatDateTime(order.createdAt) : ORDER_DETAIL_PAGE.pendingUpdate}</small></div>
              </li>
            ))}
          </ol>
        </div>
        <article className="admin-invoice-print">
          <header>
            <div><p>{order.invoiceSellerName || seller.name}</p><h1>{ORDER_DETAIL_PAGE.printTitle}</h1></div>
            <dl><div><dt>{ORDER_DETAIL_PAGE.invoiceNumber}</dt><dd>{order.invoiceNumber || ORDER_DETAIL_PAGE.notIssued}</dd></div><div><dt>{ORDER_DETAIL_PAGE.invoiceSeries}</dt><dd>{order.invoiceSeries || "-"}</dd></div><div><dt>{ORDER_DETAIL_PAGE.date}</dt><dd>{formatInvoiceDate(invoiceDate)}</dd></div></dl>
          </header>
          <section className="admin-invoice-parties">
            <div><h2>{ORDER_DETAIL_PAGE.seller}</h2><p><strong>{order.invoiceSellerName || seller.name}</strong></p><p>MST: {order.invoiceSellerTaxCode || seller.taxCode || ORDER_DETAIL_PAGE.notDeclared}</p><p>{order.invoiceSellerAddress || seller.address}</p><p>{ORDER_DETAIL_PAGE.phonePrefix}{order.invoiceSellerPhone || seller.phone}</p></div>
            <div><h2>{ORDER_DETAIL_PAGE.buyer}</h2><p><strong>{order.invoiceCompanyName || order.invoiceBuyerName || order.customerName}</strong></p>{order.invoiceCompanyName && <p>{ORDER_DETAIL_PAGE.buyerPrefix}{order.invoiceBuyerName || order.customerName}</p>}<p>MST: {order.invoiceTaxCode || ORDER_DETAIL_PAGE.none}</p><p>{order.invoiceAddress || order.address || ORDER_DETAIL_PAGE.storePickup}</p><p>Email: {order.invoiceEmail || order.email || ORDER_DETAIL_PAGE.none}</p></div>
          </section>
          <table>
            <thead><tr><th>STT</th><th>{ORDER_DETAIL_PAGE.productConfig}</th><th>SL</th><th>{ORDER_DETAIL_PAGE.unitPrice}</th><th>{ORDER_DETAIL_PAGE.lineTotal}</th></tr></thead>
            <tbody>{orderItems.map((item, index) => <tr key={`${item.productSlug}-invoice-${index}`}><td>{index + 1}</td><td><strong>{item.productName}</strong><small>{[item.ram && ORDER_DETAIL_PAGE.ramValue(item.ram), item.storage, item.color].filter(Boolean).join(" · ")}</small></td><td>{item.quantity}</td><td>{formatMoney(item.unitPrice)}</td><td>{formatMoney(item.unitPrice * item.quantity)}</td></tr>)}</tbody>
          </table>
          <section className="admin-invoice-print-totals">
            <p><span>{ORDER_DETAIL_PAGE.goodsTotal}</span><strong>{formatMoney(subtotal)}</strong></p>
            <p><span>{ORDER_DETAIL_PAGE.discount}</span><strong>{Number(order.discount) > 0 ? `-${formatMoney(Number(order.discount))}` : ORDER_DETAIL_PAGE.zeroMoney}</strong></p>
            <p><span>{ORDER_DETAIL_PAGE.shippingFee}</span><strong>{Number(order.shippingFee) > 0 ? formatMoney(Number(order.shippingFee)) : ORDER_DETAIL_PAGE.zeroMoney}</strong></p>
            <p><span>{ORDER_DETAIL_PAGE.beforeTax}</span><strong>{formatMoney(taxableAmount)}</strong></p>
            <p><span>VAT ({taxRate}%)</span><strong>{formatMoney(taxAmount)}</strong></p>
            <p className="total"><span>{ORDER_DETAIL_PAGE.totalPaid}</span><strong>{formatMoney(invoiceTotal)}</strong></p>
          </section>
          {order.paymentStatus === "paid" && <div className="document-stamp-row admin-invoice-stamp"><DocumentStamp kind="collected" date={formatInvoiceDate(invoiceDate)} /></div>}
          <section className="admin-invoice-warranty">
            <h2>{ORDER_DETAIL_PAGE.warrantyInfo}</h2>
            <p><strong>{ORDER_DETAIL_PAGE.durationLabel}</strong> {order.warrantyMonths || 12} {ORDER_DETAIL_PAGE.monthsFrom}{formatInvoiceDate(warrantyStartDate)}</p>
            <p><strong>Serial / IMEI:</strong> {order.warrantySerials || ORDER_DETAIL_PAGE.notRecorded}</p>
            <p>{warrantyPolicy}</p>
          </section>
          {order.invoiceNote && <p className="admin-invoice-note"><strong>{ORDER_DETAIL_PAGE.noteLabel}</strong> {order.invoiceNote}</p>}
          <footer><div><strong>{ORDER_DETAIL_PAGE.buyerSign}</strong><span>{ORDER_DETAIL_PAGE.signHint}</span></div><div><strong>{ORDER_DETAIL_PAGE.sellerSign}</strong><span>{ORDER_DETAIL_PAGE.signHint}</span></div></footer>
        </article>
      </section>
    </>
  );
}

function formatProfileDate(value: string) {
  if (!value) return ORDER_DETAIL_PAGE.notAvailable;
  return new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN");
}

function formatInvoiceDate(value: string) {
  if (!value) return ORDER_DETAIL_PAGE.unknown;
  return new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN");
}

function invoiceStatusLabel(status: string) {
  if (status === "draft") return ORDER_DETAIL_PAGE.invoiceDraft;
  if (status === "ready") return ORDER_DETAIL_PAGE.invoiceReady;
  if (status === "issued") return ORDER_DETAIL_PAGE.invoiceIssued;
  if (status === "cancelled") return ORDER_DETAIL_PAGE.invoiceCancelled;
  return ORDER_DETAIL_PAGE.invoiceNotCreated;
}

const DEFAULT_WARRANTY_POLICY = ORDER_DETAIL_PAGE.defaultWarrantyPolicy;
