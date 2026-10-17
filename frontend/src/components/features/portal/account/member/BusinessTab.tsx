"use client";

import { ACCOUNT_PANEL } from "@/src/constants/portal/account";
import { FormEvent, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

type BusinessTabProps = {
  businessRegistered: boolean;
  setBusinessRegistered: Dispatch<SetStateAction<boolean>>;
};

export default function BusinessTab({ businessRegistered, setBusinessRegistered }: BusinessTabProps) {
  const [businessCompany, setBusinessCompany] = useState("");
  const [businessTax, setBusinessTax] = useState("");
  const [businessMsg, setBusinessMsg] = useState("");
  const submitBusiness = (e: FormEvent) => {
    e.preventDefault();
    if (!businessCompany.trim() || !businessTax.trim()) return;
    setBusinessRegistered(true);
    setBusinessMsg(ACCOUNT_PANEL.businessActivated);
    try {
      localStorage.setItem("inf_business_profile", JSON.stringify({ company: businessCompany, tax: businessTax, time: Date.now() }));
    } catch {}
  };

  return (
    <div className="smem-section-card">
      <div className="smem-tab-header">
        <div>
          <h2>{ACCOUNT_PANEL.businessTitle}</h2>
          <p>{ACCOUNT_PANEL.businessText}</p>
        </div>
      </div>

      {businessRegistered ? (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{ fontSize: "20px" }}>🏢</span>
            <strong style={{ color: "#15803d", fontSize: "15px" }}>{ACCOUNT_PANEL.businessActiveTitle}</strong>
          </div>
          <p style={{ fontSize: "13.5px", color: "#166534", margin: "0 0 14px", lineHeight: 1.5 }}>
            {ACCOUNT_PANEL.businessActiveText}</p>
          <button
            type="button"
            onClick={() => { setBusinessRegistered(false); try { localStorage.removeItem("inf_business_profile"); } catch {} }}
            style={{ border: "1px solid #cbd5e1", background: "#ffffff", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
          >
            {ACCOUNT_PANEL.businessUpdate}</button>
        </div>
      ) : (
        <>
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "18px", marginBottom: "20px" }}>
            <h4 style={{ margin: "0 0 6px", color: "#1e40af", fontSize: "14px" }}>{ACCOUNT_PANEL.businessPerksTitle}</h4>
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#1e3a8a", lineHeight: 1.5 }}>
              <li>{ACCOUNT_PANEL.businessPerk1}</li>
              <li>{ACCOUNT_PANEL.businessPerk2}</li>
              <li>{ACCOUNT_PANEL.businessPerk3}</li>
              <li>{ACCOUNT_PANEL.businessPerk4}</li>
            </ul>
          </div>

          {businessMsg && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 16px", borderRadius: "8px", color: "#15803d", fontSize: "13px", marginBottom: "16px" }}>
              {businessMsg}
            </div>
          )}

          <form onSubmit={submitBusiness}>
            <div className="smem-form-grid">
              <div className="smem-input-card">
                <label>{ACCOUNT_PANEL.companyRequired}</label>
                <input
                  required
                  placeholder={ACCOUNT_PANEL.companyPlaceholder}
                  value={businessCompany}
                  onChange={(e) => setBusinessCompany(e.target.value)}
                />
              </div>

              <div className="smem-input-card">
                <label>{ACCOUNT_PANEL.taxCodeRequired}</label>
                <input
                  required
                  placeholder={ACCOUNT_PANEL.taxCodePlaceholder}
                  value={businessTax}
                  onChange={(e) => setBusinessTax(e.target.value)}
                />
              </div>

              <div className="smem-input-card smem-form-full">
                <label>{ACCOUNT_PANEL.companyAddressRequired}</label>
                <input required placeholder={ACCOUNT_PANEL.companyAddressPlaceholder} />
              </div>

              <div className="smem-input-card">
                <label>{ACCOUNT_PANEL.invoiceEmailRequired}</label>
                <input type="email" required placeholder="ketoan@congty.com" />
              </div>

              <div className="smem-input-card">
                <label>{ACCOUNT_PANEL.contactRequired}</label>
                <input required placeholder={ACCOUNT_PANEL.contactPlaceholder} />
              </div>
            </div>

            <button type="submit" className="smem-cta-btn">
              {ACCOUNT_PANEL.businessSubmit}</button>
          </form>
        </>
      )}
    </div>
  );
}
