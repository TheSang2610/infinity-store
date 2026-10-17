"use client";

import { INSTALLMENT } from "@/src/constants/portal/installment-page";
import { telHref } from "@/src/lib/store-settings";
import { useStoreSettings } from "@/src/hooks/store-settings";
import { FormEvent, useState } from "react";
import type { BranchOption } from "./installment-model";

type ConsultRequestFormProps = {
  branches: BranchOption[];
};

export default function ConsultRequestForm({ branches }: ConsultRequestFormProps) {
  const { hotline } = useStoreSettings();
  const [consultSubmitted, setConsultSubmitted] = useState<boolean>(false);
  const [consultTicket, setConsultTicket] = useState<string>("");
  const [consultName, setConsultName] = useState<string>("");
  const [consultPhone, setConsultPhone] = useState<string>("");
  const [consultBranch, setConsultBranch] = useState<string>(branches[0]?.name || INSTALLMENT.branchDistrict1);
  function handleConsultSubmit(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!consultName.trim() || !consultPhone.trim()) return;
    const ticketId = `TG-${Date.now().toString().slice(-6)}`;
    setConsultTicket(ticketId);
    setConsultSubmitted(true);
  }

  return (
    <section id="consult-form" className="installment-consult-card">
      <h3>{INSTALLMENT.applyTitle}</h3>
      <p>
        {INSTALLMENT.applyText}</p>

      {consultSubmitted ? (
        <div className="installment-consult-success">
          <strong>{INSTALLMENT.applied}</strong>
          <p>
            {INSTALLMENT.applicationCode}<strong>{consultTicket}</strong>
            <br />
            {INSTALLMENT.callbackPrefix}<strong>{consultPhone}</strong> {INSTALLMENT.callbackSuffix}</p>
          <button
            type="button"
            className="installment-cat-btn"
            style={{ marginTop: "14px" }}
            onClick={() => setConsultSubmitted(false)}
          >
            {INSTALLMENT.newEstimate}</button>
        </div>
      ) : (
        <div className="installment-form-container">
          <div className="installment-form-field">
            <label htmlFor="consult-name">{INSTALLMENT.nameRequired}</label>
            <input
              id="consult-name"
              type="text"
              required
              placeholder={INSTALLMENT.namePlaceholder}
              value={consultName}
              onChange={(e) => setConsultName(e.target.value)}
              className="installment-form-input"
            />
          </div>

          <div className="installment-form-field">
            <label htmlFor="consult-phone">{INSTALLMENT.phoneRequired}</label>
            <input
              id="consult-phone"
              type="tel"
              required
              placeholder={INSTALLMENT.phonePlaceholder}
              value={consultPhone}
              onChange={(e) => setConsultPhone(e.target.value)}
              className="installment-form-input"
            />
          </div>

          <div className="installment-form-field">
            <label htmlFor="consult-branch">{INSTALLMENT.pickupBranch}</label>
            <select
              id="consult-branch"
              value={consultBranch}
              onChange={(e) => setConsultBranch(e.target.value)}
              className="installment-form-select"
            >
              {branches.length > 0 ? (
                branches.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name} - {b.address}
                  </option>
                ))
              ) : (
                <option value={INSTALLMENT.branchDistrict1}>{INSTALLMENT.defaultBranch}</option>
              )}
            </select>
          </div>

          <button type="button" onClick={() => handleConsultSubmit()} className="installment-btn-primary" style={{ marginTop: "16px" }}>
            {INSTALLMENT.submit}</button>

          {hotline && (
            <div style={{ textAlign: "center", marginTop: "12px" }}>
              <span style={{ fontSize: "12px", color: "var(--lux-text-muted)" }}>
                {INSTALLMENT.orHotline}{" "}
                <a href={telHref(hotline)} style={{ color: "var(--lux-blue)", fontWeight: 700 }}>
                  {hotline}
                </a>
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
