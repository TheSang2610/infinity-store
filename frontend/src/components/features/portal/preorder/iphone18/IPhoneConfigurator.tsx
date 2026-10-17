"use client";

import { IPHONE18_SHOWCASE } from "@/src/constants/portal/preorder-page";
import Image from "next/image";
import { COLOR_OPTIONS, ColorOption, MODELS, STORAGE_TIERS, SubmitResult } from "../iphone18-data";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Branch, CustomerInfo } from "@/src/components/features/portal/preorder/preorder-model";

type IPhoneConfiguratorProps = {
  selectedColor: ColorOption;
  selectedModel: { id: string; name: string; screen: string; dimensions: string; weight: string; battery: "Lên đến 29 giờ xem video"; priceStarts: string; } | { id: string; name: string; screen: string; dimensions: string; weight: string; battery: "Lên đến 33 giờ xem video"; priceStarts: string; };
  setSelectedModelId: Dispatch<SetStateAction<string>>;
  selectedModelId: string;
  setSelectedColor: Dispatch<SetStateAction<ColorOption>>;
  customer: CustomerInfo | undefined;
  branches: Branch[];
};

export default function IPhoneConfigurator({ selectedColor, selectedModel, setSelectedModelId, selectedModelId, setSelectedColor, customer, branches }: IPhoneConfiguratorProps) {
  const [selectedStorage, setSelectedStorage] = useState("256GB");
  const [branchId, setBranchId] = useState(branches[0]?.id || "");
  const [branchQuery, setBranchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);
  const selectedBranch = branches.find((b) => b.id === branchId) || branches[0];
  const currentPriceEstimate = useMemo(() => {
    const tier = STORAGE_TIERS.find((t) => t.size === selectedStorage);
    if (!tier) return selectedModel.priceStarts;
    return selectedModelId === "iphone-18-pro-max" ? tier.priceMax : tier.pricePro;
  }, [selectedModelId, selectedStorage, selectedModel.priceStarts]);
  const filteredBranches = useMemo(() => {
    const q = branchQuery.toLowerCase().trim();
    if (!q) return branches;
    return branches.filter(
      (b) => b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q)
    );
  }, [branches, branchQuery]);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    setResult(null);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/preorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedModelId,
          configuration: selectedStorage,
          color: selectedColor.apiColor,
          branchId,
          customerName: formData.get("customerName"),
          phone: formData.get("phone"),
          email: formData.get("email"),
          quantity: formData.get("quantity") || "1",
          contactTime: formData.get("contactTime"),
          note: formData.get("note"),
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.orderCode) {
        throw new Error(payload.message || IPHONE18_SHOWCASE.submitFailed);
      }

      setResult({
        orderCode: payload.orderCode,
        branch: payload.branch || selectedBranch,
        modelName: selectedModel.name,
        storage: selectedStorage,
        colorName: selectedColor.name,
      });

      window.dispatchEvent(new Event("huy-account-change"));

      const resultEl = document.getElementById("preorder-result");
      if (resultEl) {
        resultEl.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : IPHONE18_SHOWCASE.genericError);
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="configurator" className="apple-mbp-config-section">
      <div className="apple-mbp-config-container">
        <div className="apple-mbp-config-header">
          <span className="apple-iphone-eyebrow">{IPHONE18_SHOWCASE.preorderEyebrow}</span>
          <h2 className="apple-mbp-config-title">{IPHONE18_SHOWCASE.preorderTitle}</h2>
          <p className="apple-mbp-config-subtitle">
            {IPHONE18_SHOWCASE.preorderText}</p>
        </div>

        <div className="apple-mbp-config-grid">
          {/* Left Column: Live Config Summary Card */}
          <div className="apple-mbp-summary-card">
            <div className="apple-mbp-summary-preview">
              <Image
                src={selectedColor.image}
                alt={selectedModel.name}
                width={380}
                height={380}
                className="apple-mbp-summary-img"
              />
            </div>

            <div className="apple-mbp-summary-info">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#ff6b87", letterSpacing: "0.08em" }}>
                  {IPHONE18_SHOWCASE.selectedConfig}</span>
                <span style={{ fontSize: "12px", color: "#30d158", fontWeight: 600 }}>{IPHONE18_SHOWCASE.zeroDepositBadge}</span>
              </div>

              <h3 className="apple-mbp-summary-title">{selectedModel.name}</h3>
              <p className="apple-mbp-summary-specs">
                {selectedStorage} · {selectedColor.name} · {selectedModel.screen}
              </p>

              <div className="apple-mbp-summary-price-box">
                <span className="apple-mbp-summary-price-label">{IPHONE18_SHOWCASE.expectedPrice}</span>
                <span className="apple-mbp-summary-price-value">{currentPriceEstimate}</span>
                <span className="apple-mbp-summary-price-note">
                  {IPHONE18_SHOWCASE.priceDisclaimer}</span>
              </div>

              <div className="apple-mbp-perks-list">
                <div className="apple-mbp-perk-item">
                  <span className="apple-mbp-perk-icon">✓</span>
                  <span><strong>{IPHONE18_SHOWCASE.perkZeroDeposit}</strong>{IPHONE18_SHOWCASE.perkZeroDepositText}</span>
                </div>
                <div className="apple-mbp-perk-item">
                  <span className="apple-mbp-perk-icon">✓</span>
                  <span><strong>{IPHONE18_SHOWCASE.perkPriority}</strong>{IPHONE18_SHOWCASE.perkPriorityText}</span>
                </div>
                <div className="apple-mbp-perk-item">
                  <span className="apple-mbp-perk-icon">✓</span>
                  <span><strong>{IPHONE18_SHOWCASE.perkTradeIn}</strong>{IPHONE18_SHOWCASE.perkTradeInText}</span>
                </div>
                <div className="apple-mbp-perk-item">
                  <span className="apple-mbp-perk-icon">✓</span>
                  <span><strong>{IPHONE18_SHOWCASE.perkWarranty}</strong>{IPHONE18_SHOWCASE.perkWarrantyText}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Selection & Form */}
          <div className="apple-mbp-form-card">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Choose Model */}
              <div className="apple-mbp-form-step">
                <label className="apple-mbp-step-title">
                  <span className="apple-mbp-step-num">1</span>
                  {IPHONE18_SHOWCASE.chooseModel}</label>
                <div className="apple-model-pills">
                  {MODELS.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => setSelectedModelId(model.id)}
                      className={`apple-model-btn ${selectedModelId === model.id ? "active" : ""}`}
                    >
                      <span className="apple-model-btn-name">{model.name}</span>
                      <span className="apple-model-btn-sub">{model.screen}</span>
                      <span style={{ fontSize: "11px", color: "#ff6b87", marginTop: "2px" }}>
                        {IPHONE18_SHOWCASE.fromPrefix}{model.priceStarts}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Choose Storage */}
              <div className="apple-mbp-form-step" style={{ marginTop: "24px" }}>
                <label className="apple-mbp-step-title">
                  <span className="apple-mbp-step-num">2</span>
                  {IPHONE18_SHOWCASE.chooseStorage}</label>
                <div className="apple-storage-options-grid">
                  {STORAGE_TIERS.map((tier) => (
                    <button
                      key={tier.size}
                      type="button"
                      onClick={() => setSelectedStorage(tier.size)}
                      style={{
                        padding: "12px 6px",
                        borderRadius: "14px",
                        background: selectedStorage === tier.size ? "rgba(226, 59, 93, 0.12)" : "#141418",
                        border: `1px solid ${selectedStorage === tier.size ? "#ff6b87" : "rgba(255,255,255,0.1)"}`,
                        color: selectedStorage === tier.size ? "#ffffff" : "#86868b",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <strong style={{ display: "block", fontSize: "14px", color: selectedStorage === tier.size ? "#ffffff" : "#d1d1d6" }}>
                        {tier.size}
                      </strong>
                      <span style={{ fontSize: "10px", color: "#86868b", display: "block", marginTop: "2px" }}>
                        {tier.note}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Choose Color */}
              <div className="apple-mbp-form-step" style={{ marginTop: "24px" }}>
                <label className="apple-mbp-step-title">
                  <span className="apple-mbp-step-num">3</span>
                  {IPHONE18_SHOWCASE.chooseColor}</label>
                <div className="apple-color-swatches-grid">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`apple-color-swatch-card ${selectedColor.id === color.id ? "active" : ""}`}
                    >
                      <div
                        className="apple-color-dot"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="apple-color-swatch-title">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 4: Branch Selection */}
              <div className="apple-mbp-form-step" style={{ marginTop: "24px" }}>
                <label className="apple-mbp-step-title">
                  <span className="apple-mbp-step-num">4</span>
                  {IPHONE18_SHOWCASE.chooseBranch}</label>

                <div className="apple-mbp-branch-search">
                  <input
                    type="text"
                    value={branchQuery}
                    onChange={(e) => setBranchQuery(e.target.value)}
                    placeholder={IPHONE18_SHOWCASE.branchSearchPlaceholder}
                    className="apple-mbp-input"
                  />
                </div>

                <div className="apple-mbp-branch-list">
                  {filteredBranches.map((branch) => (
                    <label
                      key={branch.id}
                      className={`apple-mbp-branch-option ${branchId === branch.id ? "active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="branchSelection"
                        value={branch.id}
                        checked={branchId === branch.id}
                        onChange={() => setBranchId(branch.id)}
                        className="apple-mbp-radio"
                      />
                      <div className="apple-mbp-branch-content">
                        <strong className="apple-mbp-branch-name">{branch.name}</strong>
                        <span className="apple-mbp-branch-addr">{branch.address}</span>
                        <div className="apple-mbp-branch-meta">
                          <span>📞 {branch.phone}</span>
                          <span>⏰ {branch.hours}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Step 5: Customer Contact Info */}
              <div className="apple-mbp-form-step" style={{ marginTop: "24px" }}>
                <label className="apple-mbp-step-title">
                  <span className="apple-mbp-step-num">5</span>
                  {IPHONE18_SHOWCASE.contactTitle}</label>

                <div className="apple-mbp-input-grid">
                  <div>
                    <label className="apple-mbp-field-label">{IPHONE18_SHOWCASE.nameRequired}</label>
                    <input
                      type="text"
                      name="customerName"
                      defaultValue={customer?.name || ""}
                      required
                      placeholder={IPHONE18_SHOWCASE.namePlaceholder}
                      className="apple-mbp-input"
                    />
                  </div>
                  <div>
                    <label className="apple-mbp-field-label">{IPHONE18_SHOWCASE.phoneRequired}</label>
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={customer?.phone || ""}
                      required
                      placeholder="0912 345 678"
                      className="apple-mbp-input"
                    />
                  </div>
                </div>

                <div className="apple-mbp-input-grid" style={{ marginTop: "14px" }}>
                  <div>
                    <label className="apple-mbp-field-label">{IPHONE18_SHOWCASE.emailOptional}</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={customer?.email || ""}
                      placeholder="email@example.com"
                      className="apple-mbp-input"
                    />
                  </div>
                  <div>
                    <label className="apple-mbp-field-label">{IPHONE18_SHOWCASE.contactTime}</label>
                    <select name="contactTime" className="apple-mbp-input" defaultValue={IPHONE18_SHOWCASE.timeAny}>
                      <option value={IPHONE18_SHOWCASE.timeAny}>{IPHONE18_SHOWCASE.timeAny}</option>
                      <option value={IPHONE18_SHOWCASE.timeMorning}>{IPHONE18_SHOWCASE.timeMorning}</option>
                      <option value={IPHONE18_SHOWCASE.timeAfternoon}>{IPHONE18_SHOWCASE.timeAfternoon}</option>
                      <option value={IPHONE18_SHOWCASE.timeEvening}>{IPHONE18_SHOWCASE.timeEvening}</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: "14px" }}>
                  <label className="apple-mbp-field-label">{IPHONE18_SHOWCASE.noteLabel}</label>
                  <textarea
                    name="note"
                    rows={2}
                    placeholder={IPHONE18_SHOWCASE.notePlaceholder}
                    className="apple-mbp-input"
                  />
                </div>
              </div>

              {/* Error Box */}
              {error && (
                <div className="apple-mbp-error-box" role="alert">
                  <span>⚠️ {error}</span>
                </div>
              )}

              {/* Submit Action Button */}
              <div style={{ marginTop: "32px" }}>
                <button
                  type="submit"
                  disabled={sending}
                  className="apple-iphone-btn-primary"
                  style={{ width: "100%", justifyContent: "center", padding: "16px", fontSize: "16px", cursor: sending ? "not-allowed" : "pointer" }}
                >
                  {sending ? IPHONE18_SHOWCASE.submitting : IPHONE18_SHOWCASE.submit}
                </button>
                <p style={{ textAlign: "center", fontSize: "12px", color: "#86868b", marginTop: "12px" }}>
                  {IPHONE18_SHOWCASE.privacyNote}</p>
              </div>
            </form>
          </div>
        </div>

        {/* Submission Result / Confirmation */}
        {result && (
          <div id="preorder-result" className="apple-mbp-result-card" style={{ marginTop: "48px" }}>
            <div className="apple-mbp-result-icon">✓</div>
            <h3 className="apple-mbp-result-title">{IPHONE18_SHOWCASE.successTitle}</h3>
            <p className="apple-mbp-result-desc">
              {IPHONE18_SHOWCASE.successTextPrefix}<strong>{result.modelName} ({result.storage} · {result.colorName})</strong> {IPHONE18_SHOWCASE.successTextSuffix}</p>

            <div className="apple-mbp-result-code-box">
              <span className="apple-mbp-result-code-label">{IPHONE18_SHOWCASE.preorderCode}</span>
              <span className="apple-mbp-result-code">{result.orderCode}</span>
            </div>

            <div className="apple-mbp-result-branch-info">
              <h4>{IPHONE18_SHOWCASE.selectedBranch}</h4>
              <p><strong>{result.branch.name}</strong></p>
              <p>{result.branch.address}</p>
              <p>{IPHONE18_SHOWCASE.hotlinePrefix}<strong>{result.branch.phone}</strong> {IPHONE18_SHOWCASE.hoursPrefix}{result.branch.hours}</p>
            </div>

            <div className="apple-mbp-result-actions">
              <Link href="/" className="apple-mbp-btn-secondary">
                {IPHONE18_SHOWCASE.backHome}</Link>
              <a href="#overview" className="apple-iphone-btn-primary">
                {IPHONE18_SHOWCASE.exploreMore}</a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
