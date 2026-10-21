import Link from "next/link";
import { requireAdminPage } from "@/src/services/admin-auth";
import { getAdminUsers, getAttendanceForDate, getEmployeeAttendance, vietnamDate } from "@/src/services/data";

import FaceAttendance from "@/src/components/features/admin/attendance/FaceAttendance";
import { roleShortLabel } from "@/src/constants/shared/roles";
import { ATTENDANCE_PAGE } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ date?: string; status?: string; error?: string }> }) {
  const [user, query] = await Promise.all([requireAdminPage("/admin/attendance"), searchParams]);
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(query.date || "") ? query.date! : vietnamDate();
  const isSupervisor = user.role === "owner" || user.role === "manager";
  const [allStaff, dateRecords, ownRecords] = await Promise.all([
    isSupervisor ? getAdminUsers().catch(() => []) : Promise.resolve([]),
    isSupervisor ? getAttendanceForDate(selectedDate).catch(() => []) : Promise.resolve([]),
    user.role !== "owner" ? getEmployeeAttendance(user.id).catch(() => []) : Promise.resolve([]),
  ]);
  const staff = user.role === "owner" ? allStaff : allStaff.filter((item) => item.branchId === user.branchId);
  const records = user.role === "owner" ? dateRecords : dateRecords.filter((item) => staff.some((employee) => employee.id === item.adminUserId));
  const ownToday = ownRecords.find((item) => item.workDate === vietnamDate());

  return (
    <>
      <div className="admin-topline">
        <div><span>{ATTENDANCE_PAGE.eyebrow}</span><h1>{ATTENDANCE_PAGE.title}</h1><p className="admin-subtitle">{user.role === "owner" ? ATTENDANCE_PAGE.ownerText : user.role === "manager" ? ATTENDANCE_PAGE.managerText(user.branch) : ATTENDANCE_PAGE.staffText}</p></div>
        {isSupervisor && <Link className="admin-button" href="/admin/hr">{ATTENDANCE_PAGE.hrProfiles}</Link>}
      </div>
      {query.status === "checked-in" && <p className="admin-alert success">{ATTENDANCE_PAGE.checkedIn}</p>}
      {query.status === "checked-out" && <p className="admin-alert success">{ATTENDANCE_PAGE.checkedOut}</p>}
      {query.error && <p className="admin-alert error">{query.error}</p>}

      {user.role !== "owner" && <FaceAttendance checkedIn={Boolean(ownToday?.checkIn)} checkedOut={Boolean(ownToday?.checkOut)} />}

      {isSupervisor && <>
        <form className="admin-report-filters admin-attendance-filter"><label><span>{ATTENDANCE_PAGE.date}</span><input type="date" name="date" defaultValue={selectedDate} /></label><button className="admin-button admin-button-primary">{ATTENDANCE_PAGE.view}</button></form>
        <section className="admin-report-kpis admin-attendance-kpis">
          <AttendanceMetric label={ATTENDANCE_PAGE.totalStaff} value={staff.length} note={ATTENDANCE_PAGE.inScope} />
          <AttendanceMetric label={ATTENDANCE_PAGE.present} value={records.filter((item) => item.status === "present").length} note={ATTENDANCE_PAGE.onTime} />
          <AttendanceMetric label={ATTENDANCE_PAGE.late} value={records.filter((item) => item.status === "late").length} note="Sau 09:00" />
          <AttendanceMetric label={ATTENDANCE_PAGE.absentLeave} value={records.filter((item) => item.status === "absent" || item.status === "leave").length} note={ATTENDANCE_PAGE.notRecordedCount(staff.length - records.length)} />
        </section>
        <section className="admin-card admin-attendance-board">
          <div className="admin-card-head"><div><span>{formatDate(selectedDate)}</span><h2>{ATTENDANCE_PAGE.dailyTable}</h2></div></div>
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{ATTENDANCE_PAGE.employee}</th><th>{ATTENDANCE_PAGE.branch}</th><th>{ATTENDANCE_PAGE.role}</th><th>{ATTENDANCE_PAGE.checkIn}</th><th>{ATTENDANCE_PAGE.checkOut}</th><th>{ATTENDANCE_PAGE.status}</th><th>{ATTENDANCE_PAGE.note}</th><th>{ATTENDANCE_PAGE.profile}</th></tr></thead><tbody>{staff.map((employee) => { const record = records.find((item) => item.adminUserId === employee.id); return <tr key={employee.id}><td><strong>{employee.name}</strong><span>@{employee.username}</span></td><td title={employee.branch}>{employee.branch}</td><td>{roleShortLabel(employee.role)}</td><td>{record?.checkIn || "--:--"}</td><td>{record?.checkOut || "--:--"}</td><td><span className={`admin-badge hr-attendance-${record?.status || "none"}`}>{record ? attendanceLabel(record.status) : ATTENDANCE_PAGE.notRecorded}</span></td><td>{record?.note || "—"}</td><td><Link className="admin-table-link" href={`/admin/hr/${employee.id}`}>{ATTENDANCE_PAGE.update}</Link></td></tr>; })}</tbody></table></div>
        </section>
      </>}
    </>
  );
}

function AttendanceMetric({ label, value, note }: { label: string; value: number; note: string }) { return <article><i>◷</i><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>; }
function formatDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }); }
function attendanceLabel(value: string) { if (value === "present") return ATTENDANCE_PAGE.present; if (value === "late") return ATTENDANCE_PAGE.late; if (value === "leave") return ATTENDANCE_PAGE.leave; return ATTENDANCE_PAGE.absent; }
