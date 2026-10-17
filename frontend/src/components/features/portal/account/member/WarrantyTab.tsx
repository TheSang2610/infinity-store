"use client";

import { ACCOUNT_PANEL } from "@/src/constants/portal/account";
import Link from "next/link";
import { calculateWarrantyEnd, formatTimestamp, formatWarrantyDate } from "../account-model";
import Image from "next/image";
import { useState } from "react";
import type { MemberPurchase } from "../account-model";

type WarrantyTabProps = {
  purchasesLoading: boolean;
  purchases: MemberPurchase[];
};

export default function WarrantyTab({ purchasesLoading, purchases }: WarrantyTabProps) {
  const [warrantyOrderCode, setWarrantyOrderCode] = useState("");
  const selectedWarrantyCode = warrantyOrderCode || purchases[0]?.orderCode || "";
  const warrantyOrder = purchases.find((order) => order.orderCode === selectedWarrantyCode) || null;
  const warrantyStart = warrantyOrder?.warrantyStartDate || warrantyOrder?.invoiceDate || "";
  const warrantyEnd = warrantyOrder
  ? calculateWarrantyEnd(warrantyStart, warrantyOrder.warrantyMonths || 12)
  : "";

  return (
    <div className="smem-section-card smem-member-warranty">
      <div className="smem-tab-header">
        <div>
          <h2>{ACCOUNT_PANEL.menuWarranty}</h2>
          <p>{ACCOUNT_PANEL.warrantyIntro}</p>
        </div>
      </div>

      {purchasesLoading ? (
        <div className="smem-warranty-loading">{ACCOUNT_PANEL.warrantyLoading}</div>
      ) : !purchases.length ? (
        <div className="smem-empty-box">
          <div className="smem-empty-icon">📦</div>
          <h3>{ACCOUNT_PANEL.noWarrantyTitle}</h3>
          <p>{ACCOUNT_PANEL.noWarrantyText}</p>
          <Link href="/" className="smem-cta-btn">{ACCOUNT_PANEL.exploreProductsShort}</Link>
        </div>
      ) : warrantyOrder ? (
        <>
          <div className="smem-warranty-picker">
            <label htmlFor="member-warranty-order">{ACCOUNT_PANEL.orderCode}</label>
            <select
              id="member-warranty-order"
              value={selectedWarrantyCode}
              onChange={(event) => setWarrantyOrderCode(event.target.value)}
            >
              {purchases.map((order) => (
                <option key={order.id} value={order.orderCode}>
                  {order.orderCode} · {order.productName} · {formatTimestamp(order.createdAt)}
                </option>
              ))}
            </select>
            <span>{purchases.length} {ACCOUNT_PANEL.ordersInAccount}</span>
          </div>

          <section className="smem-warranty-result" aria-live="polite">
            <header>
              <div>
                <span>{ACCOUNT_PANEL.infoForOrder}{warrantyOrder.orderCode}</span>
                <h3>{warrantyOrder.productName}</h3>
              </div>
              <strong className={warrantyOrder.status === "cancelled" ? "is-cancelled" : warrantyStart ? "is-active" : "is-pending"}>
                {warrantyOrder.status === "cancelled"
                  ? ACCOUNT_PANEL.orderCancelled
                  : warrantyStart
                  ? ACCOUNT_PANEL.activated
                  : ACCOUNT_PANEL.pendingActivation}
              </strong>
            </header>

            <div className="smem-warranty-facts">
              <div><span>{ACCOUNT_PANEL.orderCode}</span><strong>{warrantyOrder.orderCode}</strong></div>
              <div><span>{ACCOUNT_PANEL.invoiceNumber}</span><strong>{warrantyOrder.invoiceNumber || ACCOUNT_PANEL.notIssued}</strong></div>
              <div><span>{ACCOUNT_PANEL.duration}</span><strong>{warrantyOrder.warrantyMonths || 12} {ACCOUNT_PANEL.months}</strong></div>
              <div><span>{ACCOUNT_PANEL.serviceBranch}</span><strong>{warrantyOrder.branchName || "Infinity Store"}</strong></div>
              <div><span>{ACCOUNT_PANEL.startDate}</span><strong>{formatWarrantyDate(warrantyStart) || ACCOUNT_PANEL.notActivated}</strong></div>
              <div><span>{ACCOUNT_PANEL.endDate}</span><strong>{formatWarrantyDate(warrantyEnd) || ACCOUNT_PANEL.unknown}</strong></div>
            </div>

            <div className="smem-warranty-products">
              <h4>{ACCOUNT_PANEL.productsInOrder}</h4>
              {(warrantyOrder.items?.length ? warrantyOrder.items : [{
                productSlug: "",
                productName: warrantyOrder.productName,
                ram: "",
                storage: "",
                color: "",
                quantity: warrantyOrder.quantity || 1,
                unitPrice: Number(warrantyOrder.total),
                image: "",
              }]).map((item, index) => (
                <article key={`${item.productName}-${index}`}>
                  <div className="smem-warranty-product-media">
                    {item.image ? (
                      <Image src={item.image} alt="" width={52} height={52} unoptimized />
                    ) : (
                      <span aria-hidden="true">📱</span>
                    )}
                  </div>
                  <div>
                    <strong>{item.productName}</strong>
                    <span>{[item.ram && `RAM ${item.ram}`, item.storage, item.color].filter(Boolean).join(" · ") || ACCOUNT_PANEL.configFromOrder}</span>
                  </div>
                  <b>x{item.quantity}</b>
                </article>
              ))}
            </div>

            <div className="smem-warranty-note-grid">
              <div>
                <span>Serial / IMEI</span>
                <strong>{warrantyOrder.warrantySerials || ACCOUNT_PANEL.notUpdated}</strong>
              </div>
              <div>
                <span>{ACCOUNT_PANEL.conditionsTitle}</span>
                <p>{warrantyOrder.warrantyPolicy || ACCOUNT_PANEL.conditionsText}</p>
              </div>
            </div>

            <Link className="smem-warranty-invoice-link" href={`/member/hoa-don/${warrantyOrder.id}`}>
              {ACCOUNT_PANEL.viewInvoice}</Link>
          </section>
        </>
      ) : null}
    </div>
  );
}
