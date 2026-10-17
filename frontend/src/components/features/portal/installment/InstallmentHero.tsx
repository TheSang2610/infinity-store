"use client";

import { INSTALLMENT } from "@/src/constants/portal/installment-page";

export default function InstallmentHero() {
  return (
    <section className="installment-hero">
      <div className="installment-hero-glow" aria-hidden="true" />
      <div className="installment-hero-container">
        <div className="installment-badge-strip">
          <span>{INSTALLMENT.brandBadge}</span>
          <span>•</span>
          <span style={{ color: "#30d158" }}>{INSTALLMENT.rateBadge}</span>
        </div>

        <h1 className="installment-hero-title">
          {INSTALLMENT.title}</h1>

        <p className="installment-hero-subtitle">
          {INSTALLMENT.intro}</p>

        {/* 4 Trust Commitments */}
        <div className="installment-trust-strip">
          <div className="installment-trust-card">
            <span className="installment-trust-icon">⚡</span>
            <div className="installment-trust-text">
              <strong>{INSTALLMENT.perkApproval}</strong>
              <span>{INSTALLMENT.perkApprovalText}</span>
            </div>
          </div>

          <div className="installment-trust-card">
            <span className="installment-trust-icon">💳</span>
            <div className="installment-trust-text">
              <strong>{INSTALLMENT.perkBanks}</strong>
              <span>{INSTALLMENT.perkBanksText}</span>
            </div>
          </div>

          <div className="installment-trust-card">
            <span className="installment-trust-icon">🛡️</span>
            <div className="installment-trust-text">
              <strong>{INSTALLMENT.perkPrivacy}</strong>
              <span>{INSTALLMENT.perkPrivacyText}</span>
            </div>
          </div>

          <div className="installment-trust-card">
            <span className="installment-trust-icon">🏬</span>
            <div className="installment-trust-text">
              <strong>{INSTALLMENT.perkInspect}</strong>
              <span>{INSTALLMENT.perkInspectText}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
