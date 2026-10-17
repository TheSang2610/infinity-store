"use client";

import { PRODUCT_DETAIL } from "@/src/constants/portal/product-detail";

export default function ServicesSection() {
  return (
    <section id="pdp-services" className="pdp-section-wrap" aria-labelledby="pdp-commitments-heading">
      <header className="pdp-section-header">
        <span className="pdp-section-eyebrow">{PRODUCT_DETAIL.servicesEyebrow}</span>
        <h2 id="pdp-commitments-heading" className="pdp-section-title">
          {PRODUCT_DETAIL.servicesTitle}</h2>
        <p className="pdp-section-desc">
          {PRODUCT_DETAIL.servicesText}</p>
      </header>

      <div className="pdp-commitments-grid">
        <article className="pdp-commitment-card">
          <div className="pdp-commitment-icon"></div>
          <h4>{PRODUCT_DETAIL.serviceGenuine}</h4>
          <p>{PRODUCT_DETAIL.serviceGenuineText}</p>
        </article>
        <article className="pdp-commitment-card">
          <div className="pdp-commitment-icon">⚡</div>
          <h4>{PRODUCT_DETAIL.serviceDelivery}</h4>
          <p>{PRODUCT_DETAIL.serviceDeliveryText}</p>
        </article>
        <article className="pdp-commitment-card">
          <div className="pdp-commitment-icon">↺</div>
          <h4>{PRODUCT_DETAIL.serviceTradeIn}</h4>
          <p>{PRODUCT_DETAIL.serviceTradeInText}</p>
          <div className="pdp-commitment-icon">🛡️</div>
          <h4>{PRODUCT_DETAIL.trustExchange}</h4>
          <p>{PRODUCT_DETAIL.serviceExchangeText}</p>
        </article>
        <article className="pdp-commitment-card">
          <div className="pdp-commitment-icon">💳</div>
          <h4>{PRODUCT_DETAIL.serviceInstallment}</h4>
          <p>{PRODUCT_DETAIL.serviceInstallmentText}</p>
        </article>
      </div>
    </section>
  );
}
