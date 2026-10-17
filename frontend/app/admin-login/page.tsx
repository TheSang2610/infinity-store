import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { adminRedirectUrl, currentAdminUser, portalPathForRole } from "@/src/services/admin-auth";
import { redirect } from "next/navigation";
import AdminLoginForm from "@/src/components/features/admin/auth/AdminLoginForm";
import { ADMIN_LOGIN_PAGE } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: ADMIN_LOGIN_PAGE.metaTitle,
  description: ADMIN_LOGIN_PAGE.metaDescription,
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string; status?: string }>;
}) {
  const currentUser = await currentAdminUser();
  if (currentUser) redirect(adminRedirectUrl(portalPathForRole(currentUser.role)));
  const query = await searchParams;
  const returnTo = query.returnTo?.startsWith("/admin") ? query.returnTo : "/admin";

  return (
    <main className="admin-login-page">
      {/* Ambient background glows */}
      <div className="admin-ambient-glow admin-glow-1" aria-hidden="true" />
      <div className="admin-ambient-glow admin-glow-2" aria-hidden="true" />

      <section className="admin-login-shell">
        {/* LEFT PANEL: Enterprise Brand & System Operations Showcase */}
        <aside className="admin-login-intro">
          {/* Top Brand Identity */}
          <Link href="/" className="admin-login-brand" title={ADMIN_LOGIN_PAGE.homeLabel}>
            <span className="admin-brand-icon" aria-hidden="true">
              <Image
                src="/brand/infinity-admin-logo.png"
                alt="Infinity Company"
                width={42}
                height={42}
                priority
                unoptimized
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </span>
            <div className="admin-brand-text">
              <strong>Infinity Company</strong>
              <small>Enterprise Operations</small>
            </div>
          </Link>

          {/* Main Headline & Context */}
          <div className="admin-intro-content">
            <span className="admin-intro-badge">{ADMIN_LOGIN_PAGE.eyebrow}</span>
            <h1 className="admin-intro-title">
              {ADMIN_LOGIN_PAGE.title}</h1>
            <p className="admin-intro-desc">
              {ADMIN_LOGIN_PAGE.text}</p>

            {/* Compact Indicators */}
            <div className="admin-indicator-list" aria-label={ADMIN_LOGIN_PAGE.capabilities}>
              <div className="admin-indicator-item">
                <span className="admin-indicator-dot" aria-hidden="true" />
                <span>{ADMIN_LOGIN_PAGE.capabilityProducts}</span>
              </div>
              <div className="admin-indicator-item">
                <span className="admin-indicator-dot" aria-hidden="true" />
                <span>{ADMIN_LOGIN_PAGE.capabilityOrders}</span>
              </div>
              <div className="admin-indicator-item">
                <span className="admin-indicator-dot" aria-hidden="true" />
                <span>{ADMIN_LOGIN_PAGE.capabilityOperations}</span>
              </div>
            </div>
          </div>

          {/* Left Panel Footer */}
          <footer className="admin-intro-footer">
            <div className="admin-intro-footer-line">
              <span className="admin-status-indicator-dot" aria-hidden="true" />
              <span>Infinity Store Admin Portal</span>
            </div>
            <p className="admin-intro-footer-sub">{ADMIN_LOGIN_PAGE.accessNote}</p>
          </footer>
        </aside>

        {/* RIGHT PANEL: Modern Authentication Form */}
        <div className="admin-login-panel">
          {/* Mobile Top Brand (visible only on mobile) */}
          <div className="admin-mobile-brand">
            <Link href="/" className="admin-mobile-brand-link" title={ADMIN_LOGIN_PAGE.homeLabel}>
              <span className="admin-mobile-brand-icon" aria-hidden="true">
                <Image
                  src="/brand/infinity-admin-logo.png"
                  alt="Infinity Company"
                  width={28}
                  height={28}
                  priority
                  unoptimized
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </span>
              <span className="admin-mobile-brand-name">Infinity Company</span>
            </Link>
          </div>

          <div className="admin-panel-header">
            <span className="admin-panel-eyebrow">{ADMIN_LOGIN_PAGE.formEyebrow}</span>
            <h2 className="admin-panel-title">{ADMIN_LOGIN_PAGE.formTitle}</h2>
            <p className="admin-panel-subtitle">
              {ADMIN_LOGIN_PAGE.formText}</p>
          </div>

          {/* Status Notices */}
          {query.status === "signed-out" && (
            <div className="admin-modern-notice admin-notice-success" role="status">
              <svg className="admin-notice-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <div className="admin-notice-body">
                <strong>{ADMIN_LOGIN_PAGE.loggedOutTitle}</strong>
                <p>{ADMIN_LOGIN_PAGE.loggedOutText}</p>
              </div>
            </div>
          )}

          {query.error === "invalid" && (
            <div className="admin-modern-notice admin-notice-error" role="alert">
              <svg className="admin-notice-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              <div className="admin-notice-body">
                <strong>{ADMIN_LOGIN_PAGE.errorTitle}</strong>
                <p>{ADMIN_LOGIN_PAGE.errorText}</p>
              </div>
            </div>
          )}

          {/* Interactive Form Component */}
          <AdminLoginForm returnTo={returnTo} />
        </div>
      </section>
    </main>
  );
}
