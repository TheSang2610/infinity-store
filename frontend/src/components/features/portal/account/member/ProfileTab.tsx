"use client";

import { ACCOUNT_PANEL } from "@/src/constants/portal/account";
import Image from "next/image";
import { ChangeEvent, FormEvent, useState } from "react";
import { AuthResult } from "../account-model";
import type { Dispatch, SetStateAction } from "react";
import type { Customer } from "../account-model";
import type { ReadonlyURLSearchParams } from "next/navigation";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

type ProfileTabProps = {
  params: ReadonlyURLSearchParams;
  avatar: string;
  customer: Customer;
  initials: string;
  profileName: string;
  setProfileName: Dispatch<SetStateAction<string>>;
  profilePhone: string;
  setProfilePhone: Dispatch<SetStateAction<string>>;
  setRecoveryStep: Dispatch<SetStateAction<"" | "forgot" | "verify" | "reset">>;
  setMessage: Dispatch<SetStateAction<string>>;
  setAvatarPreview: Dispatch<SetStateAction<string>>;
  setCustomer: Dispatch<SetStateAction<Customer | null>>;
  returnTo: string;
  router: AppRouterInstance;
  refresh: () => Promise<void>;
};

export default function ProfileTab({ params, avatar, customer, initials, profileName, setProfileName, profilePhone, setProfilePhone, setRecoveryStep, setMessage, setAvatarPreview, setCustomer, returnTo, router, refresh }: ProfileTabProps) {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileNotice, setProfileNotice] = useState("");
  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setProfileNotice("");
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setProfileNotice(ACCOUNT_PANEL.avatarTypeError);
      input.value = "";
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setProfileNotice(ACCOUNT_PANEL.avatarSizeError);
      input.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
    setUploadingAvatar(true);
    try {
      const data = new FormData();
      data.set("avatar", file);
      const response = await fetch("/api/account/avatar", { method: "POST", body: data });
      const result = await response.json() as AuthResult;
      if (!response.ok) throw new Error(result.message || ACCOUNT_PANEL.avatarUpdateError);
      setCustomer(result.customer || null);
      setProfileNotice(ACCOUNT_PANEL.avatarUpdated);
      window.dispatchEvent(new CustomEvent("huy-account-change", { detail: { customer: result.customer || null } }));
    } catch (error) {
      setProfileNotice(error instanceof Error ? error.message : ACCOUNT_PANEL.avatarUpdateError);
    } finally {
      setUploadingAvatar(false);
      setAvatarPreview("");
      input.value = "";
    }
  }
  async function removeAvatar() {
    setUploadingAvatar(true);
    setProfileNotice("");
    try {
      const response = await fetch("/api/account/avatar", { method: "DELETE" });
      const result = await response.json() as AuthResult;
      if (!response.ok) throw new Error(result.message || ACCOUNT_PANEL.avatarRemoveError);
      setCustomer(result.customer || null);
      setAvatarPreview("");
      setProfileNotice(ACCOUNT_PANEL.avatarRemoved);
      window.dispatchEvent(new CustomEvent("huy-account-change", { detail: { customer: result.customer || null } }));
    } catch (error) {
      setProfileNotice(error instanceof Error ? error.message : ACCOUNT_PANEL.avatarRemoveError);
    } finally {
      setUploadingAvatar(false);
    }
  }
  const submitProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setProfileNotice("");
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName, phone: profilePhone }),
      });
      const data = await res.json() as { ok: boolean; message?: string };
      if (data.ok) {
        setProfileNotice(ACCOUNT_PANEL.profileUpdated);
        if (params.get("complete") === "1" && returnTo !== "/member") {
          router.replace(returnTo);
          router.refresh();
        } else {
          void refresh();
        }
      } else {
        setProfileNotice(data.message || ACCOUNT_PANEL.updateError);
      }
    } catch {
      setProfileNotice(ACCOUNT_PANEL.serverError);
    }
  };

  return (
    <div className="smem-section-card">
      {params.get("complete") === "1" && (
        <div className="smem-profile-completion-note">
          <strong>{ACCOUNT_PANEL.completeProfileEyebrow}</strong>
          <span>{ACCOUNT_PANEL.completeProfileText}</span>
        </div>
      )}
      <div className="smem-tab-header">
        <div>
          <h2>{ACCOUNT_PANEL.memberInfoTitle}</h2>
          <p>{ACCOUNT_PANEL.memberInfoText}</p>
        </div>
      </div>

      {profileNotice && (
        <div style={{ background: profileNotice.startsWith("✓") ? "#f0fdf4" : "#fef2f2", border: `1px solid ${profileNotice.startsWith("✓") ? "#bbf7d0" : "#fecaca"}`, padding: "12px 16px", borderRadius: "8px", color: profileNotice.startsWith("✓") ? "#15803d" : "#b91c1c", fontSize: "13px", marginBottom: "16px" }}>
          {profileNotice}
        </div>
      )}

      <div className="smem-profile-avatar-editor">
        <div className="smem-profile-avatar-preview">
          {avatar ? <Image src={avatar} alt={ACCOUNT_PANEL.avatarAlt(customer.name || customer.username)} fill unoptimized /> : initials}
        </div>
        <div>
          <strong>{ACCOUNT_PANEL.avatar}</strong>
          <p>{ACCOUNT_PANEL.avatarHint}</p>
          <div className="smem-profile-avatar-actions">
            <label>
              {uploadingAvatar ? ACCOUNT_PANEL.processing : ACCOUNT_PANEL.changeAvatar}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAvatar} disabled={uploadingAvatar} />
            </label>
            {customer.avatarUrl && <button type="button" onClick={removeAvatar} disabled={uploadingAvatar}>{ACCOUNT_PANEL.removeAvatar}</button>}
          </div>
        </div>
      </div>

      <form onSubmit={submitProfileUpdate}>
        <div className="smem-form-grid">
          <div className="smem-input-card">
            <label>{ACCOUNT_PANEL.username}</label>
            <input value={customer.username} disabled style={{ background: "#f1f5f9", cursor: "not-allowed" }} />
          </div>

          <div className="smem-input-card">
            <label>{ACCOUNT_PANEL.registeredEmail}</label>
            <input value={customer.email || ACCOUNT_PANEL.notUpdatedShort} disabled style={{ background: "#f1f5f9", cursor: "not-allowed" }} />
          </div>

          <div className="smem-input-card">
            <label>{ACCOUNT_PANEL.nameRequired}</label>
            <input
              required
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
            />
          </div>

          <div className="smem-input-card">
            <label>{ACCOUNT_PANEL.phoneRequired}</label>
            <input
              required
              type="tel"
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="smem-cta-btn" style={{ marginBottom: "24px" }}>
          {ACCOUNT_PANEL.saveProfile}</button>
      </form>

      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "20px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 800, margin: "0 0 6px", color: "#0f172a" }}>{ACCOUNT_PANEL.securityTitle}</h3>
        <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 14px" }}>
          {ACCOUNT_PANEL.securityText}</p>

        <button
          type="button"
          onClick={() => { setRecoveryStep("forgot"); setMessage(""); }}
          style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer", color: "#0f172a" }}
        >
          {ACCOUNT_PANEL.resetPassword}</button>
      </div>
    </div>
  );
}
