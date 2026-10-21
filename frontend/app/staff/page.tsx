import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/src/services/admin-auth";
import BusinessPortalShell from "@/src/components/layout/BusinessPortalShell";
import { getEmployeeAttendance, getEmployeeProfile, vietnamDate, getReportingOrders, getWorkTasks } from "@/src/services/data";
import { roleLabel } from "@/src/constants/shared/roles";
import { STAFF_HOME_PAGE } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";

export default async function StaffPortal() {
  const user = await requireAdminPage("/staff");
  if (user.role === "owner") redirect("/admin");
  if (user.role === "manager") redirect("/manager");

  const [profile, attendance, orders, workTasks] = await Promise.all([
    getEmployeeProfile(user.id).catch(() => undefined),
    getEmployeeAttendance(user.id).catch(() => []),
    getReportingOrders().then((items) => items.filter((item) => item.assignedAdminId === user.id)).catch(() => []),
    getWorkTasks().catch(() => []),
  ]);
  const today = attendance.find((item) => item.workDate === vietnamDate());
  const open = orders.filter((item) => ["new", "pending", "confirmed", "processing", "shipping"].includes(item.status));
  const completed = orders.filter((item) => item.status === "delivered");
  const tools = staffTools(user.role);
  const role = roleLabel(user.role);
  const monthKey = vietnamDate().slice(0, 7);
  const monthRecords = attendance.filter((item) => item.workDate.startsWith(monthKey));
  const workedDays = monthRecords.filter((item) => item.status === "present" || item.status === "late").length;
  const shiftState = today?.checkOut ? STAFF_HOME_PAGE.shiftEnded : today?.checkIn ? STAFF_HOME_PAGE.inShift : STAFF_HOME_PAGE.notCheckedIn;

  return <BusinessPortalShell user={user}>
    <section className="staff-shell staff-shell-unified">
      <header className="staff-profile-topline">
        <div><span>{STAFF_HOME_PAGE.eyebrow}</span><h1>{STAFF_HOME_PAGE.title}</h1><p>{fullDate()} {STAFF_HOME_PAGE.privacyNote}</p></div>
        <span className="staff-employment-status"><i /> {profile?.active !== false ? STAFF_HOME_PAGE.working : STAFF_HOME_PAGE.stopped}</span>
      </header>

      <section className="staff-profile-hero">
        <div className="staff-profile-identity">
          <div className="staff-profile-photo">
            {profile?.photoKey ? <Image src={`/api/admin/hr-photo/${user.id}`} alt={STAFF_HOME_PAGE.photoAlt(user.name)} width={180} height={210} unoptimized /> : <span>{user.name.charAt(0).toUpperCase()}</span>}
          </div>
          <div className="staff-profile-copy">
            <span className="staff-profile-kicker">{STAFF_HOME_PAGE.employeeCodePrefix}{shortEmployeeId(user.id)}</span>
            <h2>{user.name}</h2>
            <p>{role} <i /> {user.branch || STAFF_HOME_PAGE.noBranch}</p>
            <div className="staff-profile-tags"><span><b>✓</b> {STAFF_HOME_PAGE.verified}</span><span><b>●</b> {STAFF_HOME_PAGE.accountActive}</span></div>
            <div className="staff-profile-actions">
              <Link href="/admin/attendance" className="is-primary">◎ {today?.checkIn && !today?.checkOut ? STAFF_HOME_PAGE.checkOut : today?.checkOut ? STAFF_HOME_PAGE.viewAttendance : STAFF_HOME_PAGE.checkIn}</Link>
              <Link href="/staff/card">{STAFF_HOME_PAGE.viewCard}</Link>
              <Link href="/admin/tasks">{STAFF_HOME_PAGE.myTasks}</Link>
            </div>
          </div>
        </div>

        <aside className="staff-profile-shift">
          <div className="staff-profile-shift-head"><span>{STAFF_HOME_PAGE.todayShift}</span><i className={today?.checkIn && !today?.checkOut ? "is-live" : ""}>{shiftState}</i></div>
          <div className="staff-profile-shift-state"><span className={today?.checkIn ? "is-active" : ""}>◎</span><div><small>{STAFF_HOME_PAGE.attendanceStatus}</small><strong>{today ? attendanceLabel(today.status) : STAFF_HOME_PAGE.notRecorded}</strong></div></div>
          <div className="staff-profile-shift-times">
            <div><span>{STAFF_HOME_PAGE.checkInTime}</span><strong>{today?.checkIn || "--:--"}</strong></div>
            <i>→</i>
            <div><span>{STAFF_HOME_PAGE.checkOutTime}</span><strong>{today?.checkOut || "--:--"}</strong></div>
          </div>
          <Link href="/admin/attendance">{STAFF_HOME_PAGE.openCamera}<span>→</span></Link>
        </aside>
      </section>

      <section className="staff-personnel-card">
        <div className="staff-section-heading"><div><span>{STAFF_HOME_PAGE.hrInfoEyebrow}</span><h2>{STAFF_HOME_PAGE.hrInfoTitle}</h2></div><small>{STAFF_HOME_PAGE.hrInfoNote}</small></div>
        <dl className="staff-personnel-grid">
          <ProfileField label={STAFF_HOME_PAGE.fullName} value={profile?.name || user.name} />
          <ProfileField label={STAFF_HOME_PAGE.position} value={role} />
          <ProfileField label={STAFF_HOME_PAGE.branch} value={profile?.branch || user.branch || STAFF_HOME_PAGE.notAssigned} />
          <ProfileField label={STAFF_HOME_PAGE.joinedAt} value={formatDate(profile?.joinedDate)} />
          <ProfileField label={STAFF_HOME_PAGE.dateOfBirth} value={formatDate(profile?.dateOfBirth)} />
          <ProfileField label={STAFF_HOME_PAGE.citizenId} value={maskValue(profile?.citizenId)} privateValue />
          <ProfileField label={STAFF_HOME_PAGE.internalAccount} value={`@${profile?.username || user.username}`} />
          <ProfileField label={STAFF_HOME_PAGE.staffStatus} value={profile?.active !== false ? STAFF_HOME_PAGE.working : STAFF_HOME_PAGE.stopped} active={profile?.active !== false} />
          <ProfileField label={STAFF_HOME_PAGE.permanentAddress} value={profile?.permanentAddress || STAFF_HOME_PAGE.notUpdated} wide />
          <ProfileField label={STAFF_HOME_PAGE.temporaryAddress} value={profile?.temporaryAddress || STAFF_HOME_PAGE.noneOrNotUpdated} wide />
        </dl>
      </section>

      <section className="staff-metrics" aria-label={STAFF_HOME_PAGE.overviewTitle}>
        <Metric icon="◷" label={STAFF_HOME_PAGE.attendance} value={today ? attendanceLabel(today.status) : STAFF_HOME_PAGE.notCheckedIn} note={today?.checkIn ? `${today.checkIn}${today.checkOut ? ` — ${today.checkOut}` : STAFF_HOME_PAGE.workingSuffix}` : STAFF_HOME_PAGE.scanToStart} tone="blue" />
        <Metric icon="▣" label={STAFF_HOME_PAGE.workDaysThisMonth} value={String(workedDays).padStart(2, "0")} note={STAFF_HOME_PAGE.lateDays(monthRecords.filter((item) => item.status === "late").length)} tone="green" />
        <Metric icon="▤" label={STAFF_HOME_PAGE.openTasks} value={String(open.length + workTasks.filter((item) => item.status !== "completed").length).padStart(2, "0")} note={STAFF_HOME_PAGE.completedOrders(completed.length)} tone="violet" />
        <Metric icon="⌂" label={STAFF_HOME_PAGE.workBranch} value={user.branch || STAFF_HOME_PAGE.notAssigned} note={role} tone="gold" />
      </section>

      <section className="staff-workspace">
        <div className="staff-tools-panel">
          <div className="staff-section-heading"><div><span>{STAFF_HOME_PAGE.quickAccess}</span><h2>{STAFF_HOME_PAGE.yourTools}</h2></div><small>{STAFF_HOME_PAGE.filteredByRole}{role.toLocaleLowerCase("vi-VN")}</small></div>
          <div className="staff-tool-grid">{tools.map((item, index) => <Tool key={item.href} {...item} index={index} />)}</div>
        </div>

        <aside className="staff-employment-card">
          <div><span>{STAFF_HOME_PAGE.personalInfo}</span><h2>{STAFF_HOME_PAGE.bankTitle}</h2><p>{STAFF_HOME_PAGE.bankNote}</p></div>
          <dl><div><dt>{STAFF_HOME_PAGE.bankName}</dt><dd>{profile?.bankName || STAFF_HOME_PAGE.notUpdated}</dd></div><div><dt>{STAFF_HOME_PAGE.accountNumber}</dt><dd>{maskValue(profile?.bankAccountNumber)}</dd></div><div><dt>{STAFF_HOME_PAGE.accountName}</dt><dd>{profile?.bankAccountName || STAFF_HOME_PAGE.notUpdated}</dd></div></dl>
          <Link href="/staff/card">{STAFF_HOME_PAGE.viewMyCard}<span>→</span></Link>
        </aside>
      </section>

      <section className="staff-tasks-panel">
        <div className="staff-section-heading"><div><span>{STAFF_HOME_PAGE.recentWork}</span><h2>{STAFF_HOME_PAGE.assignedOrders}</h2></div><Link href="/admin/orders">{STAFF_HOME_PAGE.viewAll}<span>→</span></Link></div>
        <div className="staff-task-list">
          {orders.slice(0, 5).map((order) => <Link href={`/admin/orders/${order.id}`} key={order.id}><span className={`staff-task-icon status-${order.status}`}>▤</span><div><strong>{order.customerName}</strong><small>{order.productName}</small></div><time>{new Date(order.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</time><em className={`status-${order.status}`}>{statusLabel(order.status)}</em><b>→</b></Link>)}
          {!orders.length && <div className="staff-empty-tasks"><span>✓</span><div><strong>{STAFF_HOME_PAGE.noWorkTitle}</strong><small>{STAFF_HOME_PAGE.noWorkText}</small></div></div>}
        </div>
      </section>

      <footer className="staff-footer"><span>Infinity Company · Internal Workspace</span><small>{STAFF_HOME_PAGE.scopeNote}</small></footer>
    </section>
  </BusinessPortalShell>;
}

function Metric({ icon, label, value, note, tone }: { icon: string; label: string; value: string; note: string; tone: string }) {
  return <article><i className={`tone-${tone}`}>{icon}</i><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

function ProfileField({ label, value, wide = false, active = false, privateValue = false }: { label: string; value: string; wide?: boolean; active?: boolean; privateValue?: boolean }) {
  return <div className={wide ? "is-wide" : ""}><dt>{label}</dt><dd className={active ? "is-active" : ""}>{active && <i />}{value}{privateValue && <small>{STAFF_HOME_PAGE.private}</small>}</dd></div>;
}

function staffTools(role: string) {
  const common = [{ href: "/admin/attendance", icon: "◎", eyebrow: STAFF_HOME_PAGE.toolBiometricTag, title: STAFF_HOME_PAGE.toolFaceTitle, note: STAFF_HOME_PAGE.toolFaceText }, { href: "/admin/tasks", icon: "✓", eyebrow: STAFF_HOME_PAGE.toolTaskTag, title: STAFF_HOME_PAGE.toolTaskTitle, note: STAFF_HOME_PAGE.toolTaskText }, { href: "/admin/student-verifications", icon: "♢", eyebrow: "Member", title: STAFF_HOME_PAGE.toolStudentTitle, note: STAFF_HOME_PAGE.toolStudentText }, { href: "/staff/card", icon: "▣", eyebrow: STAFF_HOME_PAGE.toolProfileTag, title: STAFF_HOME_PAGE.toolCardTitle, note: STAFF_HOME_PAGE.toolCardText }];
  if (role === "consultant") return [...common, { href: "/admin/live-chat", icon: "✦", eyebrow: STAFF_HOME_PAGE.toolCustomerTag, title: STAFF_HOME_PAGE.toolChatTitle, note: STAFF_HOME_PAGE.toolChatText }];
  if (role === "warranty") return [...common, { href: "/admin/orders", icon: "✓", eyebrow: STAFF_HOME_PAGE.toolServiceTag, title: STAFF_HOME_PAGE.toolWarrantyTitle, note: STAFF_HOME_PAGE.toolWarrantyText }];
  if (role === "repair") return [...common, { href: "/admin/orders", icon: "⌘", eyebrow: STAFF_HOME_PAGE.toolTechTag, title: STAFF_HOME_PAGE.toolRepairTitle, note: STAFF_HOME_PAGE.toolRepairText }];
  if (role === "inventory") return [...common, { href: "/admin/inventory", icon: "⇄", eyebrow: STAFF_HOME_PAGE.toolInventoryTag, title: STAFF_HOME_PAGE.toolInventoryTitle, note: STAFF_HOME_PAGE.toolInventoryText }];
  return [...common, { href: "/admin/orders", icon: "▤", eyebrow: STAFF_HOME_PAGE.toolSalesTag, title: STAFF_HOME_PAGE.toolOrdersTitle, note: STAFF_HOME_PAGE.toolOrdersText }, { href: "/admin/products", icon: "▦", eyebrow: STAFF_HOME_PAGE.toolLookupTag, title: STAFF_HOME_PAGE.toolProductsTitle, note: STAFF_HOME_PAGE.toolProductsText }];
}

function Tool({ href, icon, eyebrow, title, note, index }: { href: string; icon: string; eyebrow: string; title: string; note: string; index: number }) {
  return <Link href={href} className={`tone-${["blue", "violet", "green"][index % 3]}`}><span className="staff-tool-icon">{icon}</span><div><small>{eyebrow}</small><strong>{title}</strong><p>{note}</p></div><b>↗</b></Link>;
}

function attendanceLabel(status: string) { if (status === "present") return STAFF_HOME_PAGE.statusCheckedIn; if (status === "late") return STAFF_HOME_PAGE.statusLate; if (status === "leave") return STAFF_HOME_PAGE.statusLeave; return STAFF_HOME_PAGE.statusAbsent; }
function statusLabel(status: string) { if (status === "delivered") return STAFF_HOME_PAGE.orderDone; if (status === "shipping") return STAFF_HOME_PAGE.orderShipping; if (status === "processing") return STAFF_HOME_PAGE.orderProcessing; if (status === "confirmed") return STAFF_HOME_PAGE.orderConfirmed; if (status === "cancelled") return STAFF_HOME_PAGE.orderCancelled; return STAFF_HOME_PAGE.orderPending; }
function fullDate() { return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date()); }
function shortEmployeeId(value: string) { return value.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase() || "NV000000"; }
function formatDate(value?: string) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN") : STAFF_HOME_PAGE.notUpdated; }
function maskValue(value?: string) { if (!value) return STAFF_HOME_PAGE.notUpdated; const clean = value.replace(/\s/g, ""); return clean.length <= 4 ? clean : `${"•".repeat(Math.min(8, clean.length - 4))} ${clean.slice(-4)}`; }
