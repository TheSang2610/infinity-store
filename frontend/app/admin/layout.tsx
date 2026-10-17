import type { Metadata } from "next";
import Link from "next/link";
import { portalPathForRole, requireAdminPage } from "@/src/services/admin-auth";
import InfinityBrandMark from "@/src/components/common/InfinityBrandMark";
import RoleCrownAvatar from "@/src/components/common/RoleCrownAvatar";
import AdminNavigation from "@/src/components/features/admin/common/AdminNavigation";
import AdminMobileOrbitNav from "@/src/components/layout/AdminMobileOrbitNav";
import { logoutAdminAction } from "@/src/actions/admin-login";
import ThemeToggle from "@/src/components/common/ThemeToggle";
import { roleLabel } from "@/src/constants/shared/roles";
import { ADMIN_LAYOUT } from "@/src/constants/admin/pages";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage("/admin");
  const portalHome = portalPathForRole(user.role);

  return (
    <main className="admin-console">
      <aside className="admin-sidebar">
        <Link href={portalHome} className="admin-brand"><span className="admin-brand-mark"><InfinityBrandMark size={44} /></span><div><strong>Infinity Company</strong><small>Business Management</small></div></Link>
        <AdminNavigation role={user.role} homeHref={portalHome} />
        <div className="admin-user-summary"><RoleCrownAvatar role={user.role} /><div><strong>{user.name}</strong><span>{roleLabel(user.role)} · {user.branch}</span></div></div>
        <div className="admin-sidebar-actions">
          <ThemeToggle />
          <Link href="/" className="admin-store-link">{ADMIN_LAYOUT.viewStore}</Link>
          <form action={logoutAdminAction}><button type="submit">{ADMIN_LAYOUT.logoutWithIcon}</button></form>
        </div>
      </aside>
      <section className="admin-content">
        <header className="admin-commandbar">
          <div><i aria-hidden="true" /><span>Infinity Retail Operations</span><b>{user.branch || ADMIN_LAYOUT.allBranches}</b></div>
          <nav aria-label={ADMIN_LAYOUT.toolsLabel}>
            {(user.role === "owner" || user.role === "manager") && <Link href="/admin/reports">{ADMIN_LAYOUT.reports}</Link>}
            <span>{roleLabel(user.role)}</span>
          </nav>
        </header>
        <header className="admin-mobile-header">
          <Link href={portalHome}><span><InfinityBrandMark compact /></span><strong>Infinity Company</strong></Link>
          <div><p><strong>{user.name}</strong><small>{roleLabel(user.role)} · {user.branch}</small></p><ThemeToggle compact /><form action={logoutAdminAction}><button type="submit">{ADMIN_LAYOUT.logout}</button></form></div>
        </header>
        {children}
      </section>
      <AdminMobileOrbitNav role={user.role} homeHref={portalHome} />
    </main>
  );
}
