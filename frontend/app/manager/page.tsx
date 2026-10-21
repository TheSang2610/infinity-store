import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/src/services/admin-auth";
import BusinessPortalShell from "@/src/components/layout/BusinessPortalShell";
import { getAdminUsers, getBranchById, getEmployeeAttendance, getEmployeeProfile, vietnamDate, getReportingOrders, getWorkTasks } from "@/src/services/data";

import { orderTotalNumber } from "@/src/lib/admin/format";
import { MANAGER_HOME_PAGE } from "@/src/constants/admin/pages";
import { formatVnd } from "@/src/lib/format";

export const dynamic = "force-dynamic";

export default async function ManagerPortal() {
  const user = await requireAdminPage("/manager");
  if (user.role === "owner") redirect("/admin");
  if (user.role !== "manager") redirect("/staff");
  const [branch, staff, orders, workTasks, profile, attendance] = await Promise.all([
    getBranchById(user.branchId).catch(() => undefined),
    getAdminUsers().then((items) => items.filter((item) => item.branchId === user.branchId)).catch(() => []),
    getReportingOrders().then((items) => items.filter((item) => item.branchId === user.branchId)).catch(() => []),
    getWorkTasks().catch(() => []),
    getEmployeeProfile(user.id).catch(() => undefined),
    getEmployeeAttendance(user.id).catch(() => []),
  ]);
  const delivered = orders.filter((item) => item.status === "delivered");
  const open = orders.filter((item) => ["new", "pending", "confirmed", "processing", "shipping"].includes(item.status));
  const today = attendance.find((item) => item.workDate === vietnamDate());
  const shiftState = today?.checkOut ? MANAGER_HOME_PAGE.shiftEnded : today?.checkIn ? MANAGER_HOME_PAGE.inShift : MANAGER_HOME_PAGE.notCheckedIn;
  const branchName = branch?.name || profile?.branch || user.branch || MANAGER_HOME_PAGE.noBranch;

  return <BusinessPortalShell user={user}><section className="staff-shell staff-shell-unified manager-profile-portal">
    <header className="staff-profile-topline">
      <div><span>{MANAGER_HOME_PAGE.eyebrow}</span><h1>{MANAGER_HOME_PAGE.title}</h1><p>{fullDate()} {MANAGER_HOME_PAGE.subtitle}</p></div>
      <span className="staff-employment-status"><i /> {profile?.active !== false ? MANAGER_HOME_PAGE.working : MANAGER_HOME_PAGE.stopped}</span>
    </header>

    <section className="staff-profile-hero">
      <div className="staff-profile-identity">
        <div className="staff-profile-photo">
          {profile?.photoKey ? <Image src={`/api/admin/hr-photo/${user.id}`} alt={MANAGER_HOME_PAGE.photoAlt(user.name)} width={180} height={210} unoptimized /> : <span>{user.name.charAt(0).toUpperCase()}</span>}
        </div>
        <div className="staff-profile-copy">
          <span className="staff-profile-kicker">{MANAGER_HOME_PAGE.employeeCodePrefix}{shortEmployeeId(user.id)}</span>
          <h2>{profile?.name || user.name}</h2>
          <p>{MANAGER_HOME_PAGE.managerOfPrefix}<i /> {branchName}</p>
          <div className="staff-profile-tags"><span><b>✓</b> {MANAGER_HOME_PAGE.verified}</span><span><b>●</b> {MANAGER_HOME_PAGE.accountActive}</span></div>
          <div className="staff-profile-actions">
            <Link href="/admin/attendance" className="is-primary">◎ {today?.checkIn && !today?.checkOut ? MANAGER_HOME_PAGE.checkOut : today?.checkOut ? MANAGER_HOME_PAGE.viewAttendance : MANAGER_HOME_PAGE.checkIn}</Link>
            <Link href="/staff/card">{MANAGER_HOME_PAGE.viewCard}</Link>
            <Link href="/admin/tasks">{MANAGER_HOME_PAGE.myTasks}</Link>
            <Link href="/admin/student-verifications">{MANAGER_HOME_PAGE.reviewStudents}</Link>
            <Link href={`/admin/branches/${user.branchId}`}>{MANAGER_HOME_PAGE.addStaff}</Link>
          </div>
        </div>
      </div>

      <aside className="staff-profile-shift">
        <div className="staff-profile-shift-head"><span>{MANAGER_HOME_PAGE.todayShift}</span><i className={today?.checkIn && !today?.checkOut ? "is-live" : ""}>{shiftState}</i></div>
        <div className="staff-profile-shift-state"><span className={today?.checkIn ? "is-active" : ""}>◎</span><div><small>{MANAGER_HOME_PAGE.attendanceStatus}</small><strong>{today ? attendanceLabel(today.status) : MANAGER_HOME_PAGE.notRecorded}</strong></div></div>
        <div className="staff-profile-shift-times">
          <div><span>{MANAGER_HOME_PAGE.checkInTime}</span><strong>{today?.checkIn || "--:--"}</strong></div><i>→</i><div><span>{MANAGER_HOME_PAGE.checkOutTime}</span><strong>{today?.checkOut || "--:--"}</strong></div>
        </div>
        <Link href="/admin/attendance">{MANAGER_HOME_PAGE.openCamera}<span>→</span></Link>
      </aside>
    </section>

    <section className="staff-personnel-card">
      <div className="staff-section-heading"><div><span>{MANAGER_HOME_PAGE.hrInfoEyebrow}</span><h2>{MANAGER_HOME_PAGE.hrInfoTitle}</h2></div><small>{MANAGER_HOME_PAGE.hrInfoNote}</small></div>
      <dl className="staff-personnel-grid">
        <ProfileField label={MANAGER_HOME_PAGE.fullName} value={profile?.name || user.name} />
        <ProfileField label={MANAGER_HOME_PAGE.position} value={MANAGER_HOME_PAGE.positionValue} />
        <ProfileField label={MANAGER_HOME_PAGE.branch} value={branchName} />
        <ProfileField label={MANAGER_HOME_PAGE.joinedAt} value={formatDate(profile?.joinedDate)} />
        <ProfileField label={MANAGER_HOME_PAGE.dateOfBirth} value={formatDate(profile?.dateOfBirth)} />
        <ProfileField label={MANAGER_HOME_PAGE.citizenId} value={maskValue(profile?.citizenId)} privateValue />
        <ProfileField label={MANAGER_HOME_PAGE.internalAccount} value={`@${profile?.username || user.username}`} />
        <ProfileField label={MANAGER_HOME_PAGE.staffStatus} value={profile?.active !== false ? MANAGER_HOME_PAGE.working : MANAGER_HOME_PAGE.stopped} active={profile?.active !== false} />
        <ProfileField label={MANAGER_HOME_PAGE.permanentAddress} value={profile?.permanentAddress || MANAGER_HOME_PAGE.notUpdated} wide />
        <ProfileField label={MANAGER_HOME_PAGE.temporaryAddress} value={profile?.temporaryAddress || MANAGER_HOME_PAGE.noneOrNotUpdated} wide />
        <ProfileField label={MANAGER_HOME_PAGE.baseSalary} value={formatMoney(profile?.monthlySalary)} />
        <ProfileField label={MANAGER_HOME_PAGE.bankName} value={profile?.bankName || MANAGER_HOME_PAGE.notUpdated} />
        <ProfileField label={MANAGER_HOME_PAGE.accountNumber} value={maskValue(profile?.bankAccountNumber)} privateValue />
        <ProfileField label={MANAGER_HOME_PAGE.accountName} value={profile?.bankAccountName || MANAGER_HOME_PAGE.notUpdated} />
      </dl>
    </section>

    <section className="manager-operations-heading">
      <div><span>{MANAGER_HOME_PAGE.operationsEyebrow}</span><h2>{MANAGER_HOME_PAGE.overviewPrefix}{branchName}</h2><p>{MANAGER_HOME_PAGE.overviewText}</p></div>
      <Link href={`/admin/branches/${user.branchId}`}>{MANAGER_HOME_PAGE.addSubordinate}</Link>
    </section>
    <section className="role-metrics"><article><span>{MANAGER_HOME_PAGE.ordersToHandle}</span><strong>{open.length}</strong><small>{orders.length} {MANAGER_HOME_PAGE.totalOrdersHint}</small></article><article><span>{MANAGER_HOME_PAGE.openTasks}</span><strong>{workTasks.filter((item) => item.status !== "completed").length}</strong><small>{workTasks.filter((item) => item.status === "review").length} {MANAGER_HOME_PAGE.reportsPendingHint}</small></article><article><span>{MANAGER_HOME_PAGE.deliveredRevenue}</span><strong>{formatVnd(delivered.reduce((sum, item) => sum + orderTotalNumber(item), 0))}</strong><small>{delivered.length} {MANAGER_HOME_PAGE.completedOrdersHint}</small></article><article><span>{MANAGER_HOME_PAGE.activeStaff}</span><strong>{staff.filter((item) => item.active).length}</strong><small>{staff.length} {MANAGER_HOME_PAGE.assignedAccountsHint}</small></article></section>
    <section className="role-tool-grid" aria-label={MANAGER_HOME_PAGE.toolsTitle}>
      <Tool href="/admin/orders" icon="▤" title={MANAGER_HOME_PAGE.toolOrders} note={MANAGER_HOME_PAGE.toolOrdersNote}/>
      <Tool href="/admin/tasks" icon="✓" title={MANAGER_HOME_PAGE.toolTasks} note={MANAGER_HOME_PAGE.toolTasksNote}/>
      <Tool href="/admin/live-chat" icon="✦" title={MANAGER_HOME_PAGE.toolChat} note={MANAGER_HOME_PAGE.toolChatNote}/>
      <Tool href="/admin/products" icon="▦" title={MANAGER_HOME_PAGE.toolProducts} note={MANAGER_HOME_PAGE.toolProductsNote}/>
      <Tool href={`/admin/branches/${user.branchId}`} icon="♧" title={MANAGER_HOME_PAGE.toolStaff} note={MANAGER_HOME_PAGE.toolStaffNote}/>
      <Tool href="/admin/hr" icon="⌘" title={MANAGER_HOME_PAGE.toolHr} note={MANAGER_HOME_PAGE.toolHrNote}/>
      <Tool href="/admin/hr/cards" icon="▣" title={MANAGER_HOME_PAGE.toolCards} note={MANAGER_HOME_PAGE.toolCardsNote}/>
      <Tool href="/staff/card" icon="♙" title={MANAGER_HOME_PAGE.toolMyCard} note={MANAGER_HOME_PAGE.toolMyCardNote}/>
      <Tool href="/admin/attendance" icon="◷" title={MANAGER_HOME_PAGE.toolAttendance} note={MANAGER_HOME_PAGE.toolAttendanceNote}/>
      <Tool href="/admin/face-test" icon="◎" title={MANAGER_HOME_PAGE.toolFace} note={MANAGER_HOME_PAGE.toolFaceNote}/>
      <Tool href="/admin/reports" icon="↗" title={MANAGER_HOME_PAGE.toolReports} note={MANAGER_HOME_PAGE.toolReportsNote}/>
      <Tool href="/admin/cameras" icon="◉" title={MANAGER_HOME_PAGE.toolCameras} note={MANAGER_HOME_PAGE.toolCamerasNote}/>
    </section>
  </section></BusinessPortalShell>;
}

function Tool({ href, icon, title, note }: { href: string; icon: string; title: string; note: string }) { return <Link href={href}><i>{icon}</i><span><strong>{title}</strong><small>{note}</small></span><b>→</b></Link>; }
function ProfileField({ label, value, wide = false, active = false, privateValue = false }: { label: string; value: string; wide?: boolean; active?: boolean; privateValue?: boolean }) { return <div className={wide ? "is-wide" : ""}><dt>{label}</dt><dd className={active ? "is-active" : ""}>{active && <i />}{value}{privateValue && <small>{MANAGER_HOME_PAGE.private}</small>}</dd></div>; }
function attendanceLabel(status: string) { if (status === "present") return MANAGER_HOME_PAGE.statusCheckedIn; if (status === "late") return MANAGER_HOME_PAGE.statusLate; if (status === "leave") return MANAGER_HOME_PAGE.statusLeave; return MANAGER_HOME_PAGE.statusAbsent; }
function fullDate() { return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date()); }
function shortEmployeeId(value: string) { return value.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase() || "NV000000"; }
function formatDate(value?: string) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN") : MANAGER_HOME_PAGE.notUpdated; }
function maskValue(value?: string) { if (!value) return MANAGER_HOME_PAGE.notUpdated; const clean = value.replace(/\s/g, ""); return clean.length <= 4 ? clean : `${"•".repeat(Math.min(8, clean.length - 4))} ${clean.slice(-4)}`; }
function formatMoney(value?: number) { return value ? `${new Intl.NumberFormat("vi-VN").format(value)} ₫` : MANAGER_HOME_PAGE.notUpdated; }
