"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { WARRANTY } from "@/src/constants/portal/warranty-page";

type Warranty = {
  orderCode: string;
  productName: string;
  items: Array<{ productName: string; ram: string; storage: string; color: string; quantity: number }>;
  orderStatus: string;
  invoiceNumber: string;
  warrantyMonths: number;
  warrantyStartDate: string;
  warrantyEndDate: string;
  warrantySerials: string;
  warrantyPolicy: string;
  branchName: string;
};

export default function WarrantyLookup() {
  const [warranty, setWarranty] = useState<Warranty | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setWarranty(null);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/warranty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json() as { warranty?: Warranty; message?: string };
    setLoading(false);
    if (!response.ok || !result.warranty) {
      setMessage(result.message || WARRANTY.lookupFailed);
      return;
    }
    setWarranty(result.warranty);
  }

  return <div className="warranty-lookup-layout">
    <section className="warranty-lookup-card">
      <p className="eyebrow">{WARRANTY.eyebrow}</p>
      <h1>{WARRANTY.title}</h1>
      <p>{WARRANTY.intro}</p>
      <form onSubmit={submit}>
        <label>{WARRANTY.orderCode}<input name="orderCode" required minLength={6} maxLength={25} autoCapitalize="characters" placeholder={WARRANTY.orderCodePlaceholder} /></label>
        <label>{WARRANTY.phone}<input name="phone" required type="tel" inputMode="tel" placeholder="0901 234 567" /></label>
        {message && <p className="warranty-error" role="alert">{message}</p>}
        <button className="button button-primary" disabled={loading}>{loading ? WARRANTY.searching : WARRANTY.submit}</button>
      </form>
      <div className="warranty-member-note"><strong>{WARRANTY.memberTitle}</strong><span>{WARRANTY.memberText}</span><Link href="/member">{WARRANTY.memberLink}</Link></div>
    </section>

    <section className={`warranty-result ${warranty ? "has-result" : ""}`} aria-live="polite">
      {!warranty ? <div className="warranty-empty"><span aria-hidden="true">✓</span><h2>{WARRANTY.emptyTitle}</h2><p>{WARRANTY.emptyText}</p></div> : <>
        <header><div><span>{WARRANTY.found}</span><h2>{warranty.productName}</h2></div><i>{warranty.warrantyStartDate ? WARRANTY.activated : WARRANTY.pendingActivation}</i></header>
        <div className="warranty-result-grid">
          <div><span>{WARRANTY.orderCode}</span><strong>{warranty.orderCode}</strong></div>
          <div><span>{WARRANTY.invoiceNumber}</span><strong>{warranty.invoiceNumber || WARRANTY.notIssued}</strong></div>
          <div><span>{WARRANTY.duration}</span><strong>{warranty.warrantyMonths || 12} {WARRANTY.months}</strong></div>
          <div><span>{WARRANTY.serviceBranch}</span><strong>{warranty.branchName || "Infinity Store"}</strong></div>
          <div><span>{WARRANTY.startDate}</span><strong>{formatDate(warranty.warrantyStartDate) || WARRANTY.notActivated}</strong></div>
          <div><span>{WARRANTY.endDate}</span><strong>{formatDate(warranty.warrantyEndDate) || WARRANTY.unknown}</strong></div>
        </div>
        <div className="warranty-products"><h3>{WARRANTY.product}</h3>{(warranty.items.length ? warranty.items : [{ productName: warranty.productName, ram: "", storage: "", color: "", quantity: 1 }]).map((item, index) => <article key={`${item.productName}-${index}`}><div><strong>{item.productName}</strong><span>{[item.ram && `RAM ${item.ram}`, item.storage, item.color].filter(Boolean).join(" · ") || WARRANTY.configFromOrder}</span></div><b>x{item.quantity}</b></article>)}</div>
        <div className="warranty-serial"><span>Serial / IMEI</span><strong>{warranty.warrantySerials || WARRANTY.notUpdated}</strong></div>
        <div className="warranty-policy"><h3>{WARRANTY.conditionsTitle}</h3><p>{warranty.warrantyPolicy || WARRANTY.conditionsText}</p></div>
      </>}
    </section>
  </div>;
}

function formatDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}
