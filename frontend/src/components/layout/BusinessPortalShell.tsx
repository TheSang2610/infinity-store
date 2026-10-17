import Link from "next/link";
import type { AdminUser } from "@/src/types";
import InfinityBrandMark from "@/src/components/common/InfinityBrandMark";
import RoleCrownAvatar from "@/src/components/common/RoleCrownAvatar";
import { portalPathForRole } from "@/src/services/admin-auth";
import { logoutAdminAction } from "@/src/actions/admin-login";
import AdminNavigation from "@/src/components/features/admin/common/AdminNavigation";
import AdminMobileOrbitNav from "@/src/components/layout/AdminMobileOrbitNav";
import ThemeToggle from "@/src/components/common/ThemeToggle";
import { roleLabel } from "@/src/constants/shared/roles";
import { BUSINESS_PORTAL } from "@/src/constants/shared/common";

export default function BusinessPortalShell({ user, children }: { user: AdminUser; children: React.ReactNode }) {
  const home = portalPathForRole(user.role);
  return <main className="admin-console role-unified-console">
    <aside className="admin-sidebar">
      <Link href={home} className="admin-brand"><span className="admin-brand-mark"><InfinityBrandMark size={44} /></span><div><strong>{BUSINESS_PORTAL.company}</strong><small>{user.role === "manager" ? BUSINESS_PORTAL.managerPortal : BUSINESS_PORTAL.staffPortal}</small></div></Link>
      <AdminNavigation role={user.role} homeHref={home} />
      <div className="admin-user-summary"><RoleCrownAvatar role={user.role} /><div><strong>{user.name}</strong><span>{roleLabel(user.role)} · {user.branch}</span></div></div>
      <div className="admin-sidebar-actions"><ThemeToggle /><Link href="/" className="admin-store-link">{BUSINESS_PORTAL.viewStore}</Link><form action={logoutAdminAction}><button type="submit">{BUSINESS_PORTAL.logoutWithIcon}</button></form></div>
    </aside>
    <section className="admin-content role-unified-content">
      <header className="admin-mobile-header">
        <Link href={home}><span><InfinityBrandMark compact /></span><strong>{BUSINESS_PORTAL.company}</strong></Link>
        <div><p><strong>{user.name}</strong><small>{roleLabel(user.role)} · {user.branch}</small></p><ThemeToggle compact /><form action={logoutAdminAction}><button type="submit">{BUSINESS_PORTAL.logout}</button></form></div>
      </header>
      {children}
    </section>
    <AdminMobileOrbitNav role={user.role} homeHref={home} />
  </main>;
}
