"use client";

import { PRODUCT_DETAIL } from "@/src/constants/portal/product-detail";

export default function TrustGrid() {
  return (
    <div className="pdp-trust-grid">
      <div className="pdp-trust-item">
        <div className="pdp-trust-icon"></div>
        <div className="pdp-trust-text">
          <strong>{PRODUCT_DETAIL.trustGenuine}</strong>
          <span>{PRODUCT_DETAIL.trustGenuineText}</span>
        </div>
      </div>
      <div className="pdp-trust-item">
        <div className="pdp-trust-icon">⚡</div>
        <div className="pdp-trust-text">
          <strong>{PRODUCT_DETAIL.trustDelivery}</strong>
          <span>{PRODUCT_DETAIL.trustDeliveryText}</span>
        </div>
      </div>
      <div className="pdp-trust-item">
        <div className="pdp-trust-icon">↺</div>
        <div className="pdp-trust-icon">💳</div>
        <div className="pdp-trust-text">
          <strong>{PRODUCT_DETAIL.trustTradeIn}</strong>
          <span>{PRODUCT_DETAIL.trustTradeInText}</span>
          <strong>{PRODUCT_DETAIL.trustInstallment}</strong>
          <span>{PRODUCT_DETAIL.trustInstallmentText}</span>
        </div>
      </div>
      <div className="pdp-trust-item">
        <div className="pdp-trust-icon">🛡️</div>
        <div className="pdp-trust-text">
          <strong>{PRODUCT_DETAIL.trustExchange}</strong>
          <span>{PRODUCT_DETAIL.trustExchangeText}</span>
        </div>
      </div>
    </div>
  );
}
