"use client";

import Link from "next/link";
import Image from "next/image";
import { ACCOUNT_PANEL } from "@/src/constants/portal/account";
import { FormEvent, useState } from "react";
import { AuthResult, Customer } from "../account-model";
import type { Dispatch, SetStateAction } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

type MemberLoginViewProps = {
  recoveryStep: "" | "forgot" | "verify" | "reset";
  message: string;
  setRecoveryStep: Dispatch<SetStateAction<"" | "forgot" | "verify" | "reset">>;
  setMessage: Dispatch<SetStateAction<string>>;
  returnTo: string;
  storeName: string;
  params: ReadonlyURLSearchParams;
  setCustomer: Dispatch<SetStateAction<Customer | null>>;
  router: AppRouterInstance;
  refresh: () => Promise<void>;
};

export default function MemberLoginView({ recoveryStep, message, setRecoveryStep, setMessage, returnTo, storeName, params, setCustomer, router, refresh }: MemberLoginViewProps) {
  const [mode, setMode] = useState<"login" | "register">((params.get("mode") as "login" | "register") || "login");
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryIdentifier, setRecoveryIdentifier] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveryError, setRecoveryError] = useState(false);
  const [sending, setSending] = useState(false);
  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setMessage("");
    try {
      const data = Object.fromEntries(new FormData(event.currentTarget));
      const response = await fetch(`/api/account/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json() as AuthResult;
      if (!response.ok) {
        setMessage(result.message || ACCOUNT_PANEL.accountError);
        return;
      }
      finishLogin(result.customer || null);
    } catch {
      setMessage(ACCOUNT_PANEL.connectionError);
    } finally {
      setSending(false);
    }
  }
  async function requestPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setRecoveryMessage("");
    setRecoveryError(false);
    const identifier = String(new FormData(event.currentTarget).get("identifier") || "").trim();
    const response = await fetch("/api/account/password/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
    });
    const result = await response.json() as AuthResult;
    setSending(false);
    setRecoveryMessage(result.message || ACCOUNT_PANEL.sendCodeError);
    setRecoveryError(!response.ok);
    if (!response.ok) return;
    setRecoveryIdentifier(identifier);
    setRecoveryStep("verify");
  }
  async function verifyPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setRecoveryMessage("");
    setRecoveryError(false);
    const code = String(new FormData(event.currentTarget).get("code") || "");
    const response = await fetch("/api/account/password/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const result = await response.json() as AuthResult;
    setSending(false);
    setRecoveryMessage(result.message || ACCOUNT_PANEL.verifyCodeError);
    setRecoveryError(!response.ok);
    if (response.ok) setRecoveryStep("reset");
  }
  async function completePasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setRecoveryMessage("");
    setRecoveryError(false);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/account/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json() as AuthResult;
    setSending(false);
    if (!response.ok) {
      setRecoveryError(true);
      setRecoveryMessage(result.message || ACCOUNT_PANEL.resetPasswordError);
      return;
    }
    setRecoveryStep("");
    setRecoveryMessage("");
    finishLogin(result.customer || null);
  }
  function finishLogin(nextCustomer: Customer | null) {
    setCustomer(nextCustomer);
    setMessage("");
    window.dispatchEvent(new CustomEvent("huy-account-change", { detail: { customer: nextCustomer } }));
    if (!nextCustomer) return;
    if (returnTo !== "/member") {
      router.replace(returnTo);
      router.refresh();
      return;
    }
    void refresh();
  }

  return (
    <div className="smem-login-wrapper">
      <div className="smem-login-container">
        {/* LEFT COLUMN: INFINITY MEMBER INVITATION & PERKS */}
        <div className="smem-intro-col">
          <div className="smem-brand-header">
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
              <Image
                src="/brand/if-techshop-logo.png"
                alt="IF TECHSHOP"
                width={160}
                height={50}
                style={{ objectFit: "contain", height: "48px", width: "auto" }}
                priority
                unoptimized
              />
            </Link>
          </div>

          <h1>
            {ACCOUNT_PANEL.joinTitlePrefix}<strong>INFINITY MEMBER</strong>
          </h1>
          <p>{ACCOUNT_PANEL.joinSubtitle}</p>

          <div className="smem-benefits-card">
            <ul className="smem-benefit-list">
              <li className="smem-benefit-item">
                <span className="smem-benefit-icon">🎁</span>
                <div><strong>{ACCOUNT_PANEL.benefitDiscount}</strong> {ACCOUNT_PANEL.benefitDiscountText}</div>
              </li>
              <li className="smem-benefit-item">
                <span className="smem-benefit-icon">🚚</span>
                <div><strong>{ACCOUNT_PANEL.benefitShipping}</strong> {ACCOUNT_PANEL.benefitShippingText}</div>
              </li>
              <li className="smem-benefit-item">
                <span className="smem-benefit-icon">🎂</span>
                <div><strong>{ACCOUNT_PANEL.benefitBirthday}</strong> {ACCOUNT_PANEL.benefitBirthdayText}</div>
              </li>
              <li className="smem-benefit-item">
                <span className="smem-benefit-icon">💳</span>
                <div><strong>{ACCOUNT_PANEL.benefitInstallment}</strong> {ACCOUNT_PANEL.benefitInstallmentText}</div>
              </li>
              <li className="smem-benefit-item">
                <span className="smem-benefit-icon">⭐</span>
                <div><strong>{ACCOUNT_PANEL.benefitUpgrade}</strong> {ACCOUNT_PANEL.benefitUpgradeText}</div>
              </li>
              <li className="smem-benefit-item">
                <span className="smem-benefit-icon">🎓</span>
                <div><strong>{ACCOUNT_PANEL.benefitStudent}</strong> {ACCOUNT_PANEL.benefitStudentText}</div>
              </li>
              <li className="smem-benefit-item">
                <span className="smem-benefit-icon">💼</span>
                <div><strong>Infinity Business:</strong> {ACCOUNT_PANEL.benefitBusiness}</div>
              </li>
            </ul>

            <a href="#" className="smem-benefit-more">
              {ACCOUNT_PANEL.viewMemberPolicy}</a>
          </div>

          <div className="smem-mascot-row">
            <Image
              src="/infinity-member/mascot-promotion.svg"
              alt="Infinity Member VIP"
              width={280}
              height={210}
              className="smem-mascot-img"
              unoptimized
              priority
            />
          </div>
        </div>

        {/* RIGHT COLUMN: LOGIN / REGISTER FORM */}
        <div className="smem-form-col">
          {!recoveryStep ? (
            <>
              <h2>{mode === "login" ? ACCOUNT_PANEL.loginTitle : ACCOUNT_PANEL.registerTitle}</h2>

              <form onSubmit={submitAuth}>
                {mode === "register" && (
                  <>
                    <div className="smem-input-group">
                      <label>{ACCOUNT_PANEL.username}</label>
                      <div className="smem-input-field">
                        <input name="username" required minLength={4} maxLength={24} pattern="[a-zA-Z0-9._]+" placeholder="infinity_user" autoComplete="username" />
                      </div>
                    </div>
                    <div className="smem-input-group">
                      <label>{ACCOUNT_PANEL.fullName}</label>
                      <div className="smem-input-field">
                        <input name="name" required placeholder={ACCOUNT_PANEL.namePlaceholder} autoComplete="name" />
                      </div>
                    </div>
                    <div className="smem-input-group">
                      <label>{ACCOUNT_PANEL.phone}</label>
                      <div className="smem-input-field">
                        <input name="phone" required type="tel" pattern="[0-9 +]{9,15}" placeholder="0987654321" autoComplete="tel" />
                      </div>
                    </div>
                    <div className="smem-input-group">
                      <label>Email</label>
                      <div className="smem-input-field">
                        <input name="email" type="email" required placeholder="name@example.com" autoComplete="email" />
                      </div>
                    </div>
                  </>
                )}

                {mode === "login" && (
                  <div className="smem-input-group">
                    <label>{ACCOUNT_PANEL.loginIdentifier}</label>
                    <div className="smem-input-field">
                      <input name="identifier" required placeholder={ACCOUNT_PANEL.phonePlaceholder} autoComplete="username" />
                    </div>
                  </div>
                )}

                <div className="smem-input-group">
                  <label>{ACCOUNT_PANEL.password}</label>
                  <div className="smem-input-field">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      minLength={8}
                      required
                      placeholder={ACCOUNT_PANEL.passwordPlaceholder}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                    />
                    <button
                      type="button"
                      className="smem-pwd-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? ACCOUNT_PANEL.hidePassword : ACCOUNT_PANEL.showPassword}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {message && (
                  <p style={{ color: "#b91c1c", fontSize: "13px", margin: "8px 0 14px", fontWeight: 600 }}>
                    {message}
                  </p>
                )}

                <button type="submit" className="smem-submit-btn" disabled={sending}>
                  {sending ? ACCOUNT_PANEL.processing : mode === "login" ? ACCOUNT_PANEL.login : ACCOUNT_PANEL.registerNow}
                </button>

                {mode === "login" && (
                  <button
                    type="button"
                    className="smem-forgot-link"
                    style={{ border: "none", background: "none", cursor: "pointer", width: "100%" }}
                    onClick={() => { setRecoveryStep("forgot"); setMessage(""); }}
                  >
                    {ACCOUNT_PANEL.forgotPassword}</button>
                )}
              </form>

              <div className="smem-divider">
                <span>{ACCOUNT_PANEL.orLoginWith}</span>
              </div>

              <div className="smem-social-buttons">
                <a href={`/api/account/google/start?returnTo=${encodeURIComponent(returnTo)}`} className="smem-social-btn">
                  <Image src="/infinity-member/logo-google.svg" alt="Google" width={18} height={18} unoptimized />
                  <span>{ACCOUNT_PANEL.continueWithGoogle}</span>
                </a>
              </div>

              <div className="smem-switch-auth">
                {mode === "login" ? (
                  <>
                    {ACCOUNT_PANEL.noAccount}{" "}
                    <button type="button" onClick={() => { setMode("register"); setMessage(""); }}>
                      {ACCOUNT_PANEL.registerNow}</button>
                  </>
                ) : (
                  <>
                    {ACCOUNT_PANEL.haveAccount}{" "}
                    <button type="button" onClick={() => { setMode("login"); setMessage(""); }}>
                      {ACCOUNT_PANEL.loginNow}</button>
                  </>
                )}
              </div>

              <p className="smem-footer-note">
                {ACCOUNT_PANEL.retailSystemFooter}<strong>{storeName}</strong>
              </p>
            </>
          ) : (
            /* PASSWORD RECOVERY */
            <div style={{ padding: "10px 0" }}>
              <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>
                {recoveryStep === "forgot" ? ACCOUNT_PANEL.recoverTitle : recoveryStep === "verify" ? ACCOUNT_PANEL.enterCodeTitle : ACCOUNT_PANEL.newPasswordTitle}
              </h2>
              <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "20px" }}>
                {recoveryStep === "forgot"
                  ? ACCOUNT_PANEL.recoverText
                  : recoveryStep === "verify"
                  ? ACCOUNT_PANEL.enterCodeText
                  : ACCOUNT_PANEL.newPasswordText}
              </p>

              {recoveryStep === "forgot" && (
                <form onSubmit={requestPasswordReset}>
                  <div className="smem-input-group">
                    <label>{ACCOUNT_PANEL.recoverIdentifier}</label>
                    <div className="smem-input-field">
                      <input name="identifier" required placeholder={ACCOUNT_PANEL.recoverPlaceholder} autoFocus />
                    </div>
                  </div>
                  {recoveryMessage && <p style={{ color: recoveryError ? "#b91c1c" : "#15803d", fontSize: "13px" }}>{recoveryMessage}</p>}
                  <button className="smem-submit-btn" disabled={sending}>
                    {sending ? ACCOUNT_PANEL.sending : ACCOUNT_PANEL.sendCode}
                  </button>
                </form>
              )}

              {recoveryStep === "verify" && (
                <form onSubmit={verifyPasswordReset}>
                  <div className="smem-input-group">
                    <label>{ACCOUNT_PANEL.otpLabel}</label>
                    <div className="smem-input-field">
                      <input name="code" required placeholder={ACCOUNT_PANEL.otpPlaceholder} inputMode="numeric" autoComplete="one-time-code" autoFocus />
                    </div>
                  </div>
                  <p className="smem-recovery-destination">{ACCOUNT_PANEL.codeSentTo}<strong>{recoveryIdentifier}</strong></p>
                  {recoveryMessage && <p style={{ color: recoveryError ? "#b91c1c" : "#15803d", fontSize: "13px" }}>{recoveryMessage}</p>}
                  <button className="smem-submit-btn" disabled={sending}>
                    {sending ? ACCOUNT_PANEL.checking : ACCOUNT_PANEL.verifyCode}
                  </button>
                </form>
              )}

              {recoveryStep === "reset" && (
                <form onSubmit={completePasswordReset}>
                  <div className="smem-input-group">
                    <label>{ACCOUNT_PANEL.newPassword}</label>
                    <div className="smem-input-field">
                      <input name="password" type="password" minLength={8} required placeholder={ACCOUNT_PANEL.newPasswordPlaceholder} autoFocus />
                    </div>
                  </div>
                  <div className="smem-input-group">
                    <label>{ACCOUNT_PANEL.confirmPassword}</label>
                    <div className="smem-input-field">
                      <input name="confirmPassword" type="password" minLength={8} required placeholder={ACCOUNT_PANEL.confirmPasswordPlaceholder} />
                    </div>
                  </div>
                  {recoveryMessage && <p style={{ color: recoveryError ? "#b91c1c" : "#15803d", fontSize: "13px" }}>{recoveryMessage}</p>}
                  <button className="smem-submit-btn" disabled={sending}>
                    {sending ? ACCOUNT_PANEL.changing : ACCOUNT_PANEL.updatePassword}
                  </button>
                </form>
              )}

              <button
                type="button"
                className="smem-forgot-link"
                style={{ border: "none", background: "none", cursor: "pointer", width: "100%", marginTop: "16px" }}
                onClick={() => { setRecoveryStep(""); setRecoveryMessage(""); }}
              >
                {ACCOUNT_PANEL.backToLogin}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
