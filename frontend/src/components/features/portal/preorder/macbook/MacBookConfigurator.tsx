"use client";

import { MACBOOK_SHOWCASE } from "@/src/constants/portal/preorder-page";
import Image from "next/image";
import { COLORS, MBP_VARIANTS, SubmitResult } from "../macbook-data";
import { FormEvent, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Branch, CustomerInfo } from "@/src/components/features/portal/preorder/preorder-model";

type MacBookConfiguratorProps = {
  selectedColor: { name: string; viName: "Đen Không Gian"; hex: string; } | { name: string; viName: "Bạc"; hex: string; };
  selectedVariantId: string;
  setSelectedVariantId: Dispatch<SetStateAction<string>>;
  setSelectedSize: Dispatch<SetStateAction<"14" | "16">>;
  setSelectedColor: Dispatch<SetStateAction<{ name: string; viName: "Đen Không Gian"; hex: string; } | { name: string; viName: "Bạc"; hex: string; }>>;
  customer: CustomerInfo | undefined;
  branches: Branch[];
};

export default function MacBookConfigurator({ selectedColor, selectedVariantId, setSelectedVariantId, setSelectedSize, setSelectedColor, customer, branches }: MacBookConfiguratorProps) {
  const [branchId, setBranchId] = useState(branches[0]?.id || "");
  const [branchQuery, setBranchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);
  const filteredBranches = useMemo(() => {
    const q = branchQuery.toLowerCase().trim();
    if (!q) return branches;
    return branches.filter(
      (b) => b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q)
    );
  }, [branches, branchQuery]);
  const selectedBranch = branches.find((b) => b.id === branchId) || branches[0];
  const selectedVariant = MBP_VARIANTS.find((v) => v.id === selectedVariantId) || MBP_VARIANTS[1];
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
          productId: "macbook-pro-m5-new",
          configuration: `${selectedVariant.name} · ${selectedVariant.specs}`,
          color: selectedColor.name,
          branchId,
          customerName: formData.get("customerName"),
          phone: formData.get("phone"),
          email: formData.get("email"),
          quantity: formData.get("quantity") || "1",
          contactTime: formData.get("contactTime"),
          note: formData.get("note"),
        }),
      });

      const payload = (await response.json()) as SubmitResult & { message?: string };
      if (!response.ok || !payload.orderCode) {
        throw new Error(payload.message || MACBOOK_SHOWCASE.submitFailed);
      }

      setResult(payload);
      window.dispatchEvent(new Event("huy-account-change"));

      // Scroll to result
      const resultEl = document.getElementById("preorder-result");
      if (resultEl) {
        resultEl.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : MACBOOK_SHOWCASE.genericError);
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="configurator" className="apple-mbp-configurator-section">
      <div className="apple-mbp-configurator-wrap">
        <div className="apple-mbp-section-header text-center">
          <span className="apple-mbp-eyebrow">{MACBOOK_SHOWCASE.preorderEyebrow}</span>
          <h2 className="apple-mbp-section-title">{MACBOOK_SHOWCASE.preorderTitle}</h2>
          <p className="apple-mbp-section-sub">
            {MACBOOK_SHOWCASE.preorderText}</p>
        </div>

        {result ? (
          <div id="preorder-result" className="apple-mbp-success-shell" aria-live="polite">
            <div className="apple-mbp-success-badge">✓</div>
            <h2>{MACBOOK_SHOWCASE.successTitle}</h2>
            <p style={{ color: "var(--apple-text-secondary)", fontSize: "15px" }}>
              {MACBOOK_SHOWCASE.successCodeText}</p>
            <strong className="apple-mbp-success-code">{result.orderCode}</strong>
            <div style={{ margin: "20px 0", color: "#e5e5ea", fontSize: "14px" }}>
              {MACBOOK_SHOWCASE.successBranch}<b>{result.branch.name}</b> · {result.branch.address}
            </div>
            <p style={{ color: "var(--apple-text-secondary)", fontSize: "13px" }}>
              {MACBOOK_SHOWCASE.successText}</p>
            <div style={{ marginTop: "28px" }}>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="apple-mbp-btn-secondary"
              >
                {MACBOOK_SHOWCASE.preorderAnother}</button>
            </div>
          </div>
        ) : (
          <div className="apple-mbp-config-grid">
            {/* Left Column: Live Summary Card */}
            <div className="apple-mbp-summary-card">
              <span className="apple-mbp-summary-badge">{MACBOOK_SHOWCASE.zeroDepositNote}</span>
              <h3>{selectedVariant.name}</h3>
              <p>{MACBOOK_SHOWCASE.colorPrefix}<strong>{selectedColor.viName}</strong></p>

              <div className="apple-mbp-summary-preview">
                <Image
                  src="/apple-macbook-pro/product-viewer-hero.jpg"
                  alt={selectedVariant.name}
                  width={320}
                  height={190}
                />
              </div>

              <div className="apple-mbp-summary-specs">
                <div className="apple-mbp-summary-spec-row">
                  <span>{MACBOOK_SHOWCASE.displayLabel}</span>
                  <strong>{selectedVariant.screen}</strong>
                </div>
                <div className="apple-mbp-summary-spec-row">
                  <span>{MACBOOK_SHOWCASE.configLabel}</span>
                  <strong>{selectedVariant.specs}</strong>
                </div>
                <div className="apple-mbp-summary-spec-row">
                  <span>{MACBOOK_SHOWCASE.batteryLabel}</span>
                  <strong>{selectedVariant.battery}</strong>
                </div>
                <div className="apple-mbp-summary-spec-row">
                  <span>{MACBOOK_SHOWCASE.colorLabel}</span>
                  <strong>{selectedColor.viName}</strong>
                </div>
                <div className="apple-mbp-summary-spec-row">
                  <span>{MACBOOK_SHOWCASE.branchLabel}</span>
                  <strong>{selectedBranch?.name || MACBOOK_SHOWCASE.allBranches}</strong>
                </div>
              </div>

              <ul className="apple-mbp-guarantees">
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{MACBOOK_SHOWCASE.perkNoDeposit}</span>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{MACBOOK_SHOWCASE.perkPayAtStore}</span>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{MACBOOK_SHOWCASE.perkTradeIn}</span>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{MACBOOK_SHOWCASE.perkInstallment}</span>
                </li>
              </ul>
            </div>

            {/* Right Column: Interactive Config Form */}
            <div className="apple-mbp-form-card">
              <form onSubmit={handleSubmit}>
                {/* Step 1: Kích thước & Cấu hình */}
                <div className="apple-mbp-options-group">
                  <h3 className="apple-mbp-step-title">
                    <span className="apple-mbp-step-num">1</span>
                    {MACBOOK_SHOWCASE.chooseSizeConfig}</h3>

                  <div className="apple-mbp-choice-grid">
                    {MBP_VARIANTS.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        className={`apple-mbp-choice-btn${selectedVariantId === v.id ? " is-active" : ""}`}
                        onClick={() => {
                          setSelectedVariantId(v.id);
                          setSelectedSize(v.size as "14" | "16");
                        }}
                      >
                        <strong>{v.name}</strong>
                        <small>{v.specs}</small>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Màu sắc */}
                <div className="apple-mbp-options-group">
                  <h3 className="apple-mbp-step-title">
                    <span className="apple-mbp-step-num">2</span>
                    {MACBOOK_SHOWCASE.chooseFinish}</h3>

                  <div className="apple-mbp-choice-grid">
                    {COLORS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        className={`apple-mbp-choice-btn${selectedColor.name === c.name ? " is-active" : ""}`}
                        onClick={() => setSelectedColor(c)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span
                            className="apple-mbp-color-circle"
                            style={{ backgroundColor: c.hex, width: "20px", height: "20px" }}
                          />
                          <strong>{c.viName}</strong>
                        </div>
                        <small>{c.name}</small>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 3: Chọn chi nhánh nhận máy */}
                <div className="apple-mbp-options-group">
                  <h3 className="apple-mbp-step-title">
                    <span className="apple-mbp-step-num">3</span>
                    {MACBOOK_SHOWCASE.chooseBranch}</h3>

                  <div className="apple-mbp-field" style={{ marginBottom: "12px" }}>
                    <input
                      type="text"
                      placeholder={MACBOOK_SHOWCASE.branchSearchPlaceholder}
                      value={branchQuery}
                      onChange={(e) => setBranchQuery(e.target.value)}
                    />
                  </div>

                  <div className="apple-mbp-branch-selector">
                    {filteredBranches.map((b) => (
                      <label
                        key={b.id}
                        className={`apple-mbp-branch-item${branchId === b.id ? " is-selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name="branchIdChoice"
                          value={b.id}
                          checked={branchId === b.id}
                          onChange={() => setBranchId(b.id)}
                        />
                        <div>
                          <strong>{b.name}</strong>
                          <small>{b.address} {MACBOOK_SHOWCASE.hoursPrefix}{b.hours}</small>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Step 4: Thông tin người nhận */}
                <div className="apple-mbp-options-group">
                  <h3 className="apple-mbp-step-title">
                    <span className="apple-mbp-step-num">4</span>
                    {MACBOOK_SHOWCASE.contactTitle}</h3>

                  <div className="apple-mbp-input-grid">
                    <div className="apple-mbp-field">
                      <label htmlFor="customerName">{MACBOOK_SHOWCASE.nameRequired}</label>
                      <input
                        id="customerName"
                        name="customerName"
                        type="text"
                        required
                        defaultValue={customer?.name || ""}
                        placeholder={MACBOOK_SHOWCASE.namePlaceholder}
                      />
                    </div>
                    <div className="apple-mbp-field">
                      <label htmlFor="phone">{MACBOOK_SHOWCASE.phoneRequired}</label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        defaultValue={customer?.phone || ""}
                        placeholder={MACBOOK_SHOWCASE.phonePlaceholder}
                      />
                    </div>
                  </div>

                  <div className="apple-mbp-input-grid full">
                    <div className="apple-mbp-field">
                      <label htmlFor="email">{MACBOOK_SHOWCASE.emailOptional}</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={customer?.email || ""}
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>

                  <div className="apple-mbp-input-grid full">
                    <div className="apple-mbp-field">
                      <label htmlFor="note">{MACBOOK_SHOWCASE.noteLabel}</label>
                      <textarea
                        id="note"
                        name="note"
                        rows={2}
                        placeholder={MACBOOK_SHOWCASE.notePlaceholder}
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(255, 69, 58, 0.15)", border: "1px solid rgba(255, 69, 58, 0.3)", color: "#ff453a", marginBottom: "16px", fontSize: "13.5px" }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="apple-mbp-submit-btn"
                >
                  {sending ? MACBOOK_SHOWCASE.submitting : MACBOOK_SHOWCASE.submit}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
