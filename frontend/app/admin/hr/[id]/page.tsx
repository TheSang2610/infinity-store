import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { canManageEmployee, requireHrManagerPage } from "@/src/services/admin-auth";
import { getEmployeeAttendance, getEmployeeProfile, vietnamDate } from "@/src/services/data";
import AdminMoneyInput from "@/src/components/features/admin/common/AdminMoneyInput";
import { formatMoney } from "@/src/lib/admin/format";
import { saveAttendanceAction, saveEmployeeProfileAction } from "@/src/actions/admin/hr";
import { roleLabel } from "@/src/constants/shared/roles";
import { HR_DETAIL_PAGE } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";

export default async function EmployeeProfilePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string; error?: string }> }) {
  const [user, { id }, query] = await Promise.all([requireHrManagerPage("/admin/hr"), params, searchParams]);
  const [employee, attendance] = await Promise.all([getEmployeeProfile(id), getEmployeeAttendance(id).catch(() => [])]);
  if (!employee) notFound();
  if (!canManageEmployee(user, employee)) notFound();
  const monthKey = vietnamDate().slice(0, 7);
  const monthRecords = attendance.filter((item) => item.workDate.startsWith(monthKey));
  const workedDays = monthRecords.filter((item) => item.status === "present" || item.status === "late").length;
  const totalMinutes = monthRecords.reduce((sum, item) => sum + workMinutes(item.checkIn, item.checkOut), 0);

  return (
    <>
      <div className="admin-topline admin-hr-profile-heading">
        <div><span>{HR_DETAIL_PAGE.eyebrow}</span><h1>{employee.name}</h1><p className="admin-subtitle">{roleLabel(employee.role)} · {employee.branch || HR_DETAIL_PAGE.noBranch}</p></div>
        <div className="admin-actions-row"><Link className="admin-button admin-button-primary" href={`/admin/hr/cards?employee=${employee.adminUserId}`}>{HR_DETAIL_PAGE.createCard}</Link><Link className="admin-button" href="/admin/hr">{HR_DETAIL_PAGE.backToList}</Link></div>
      </div>
      {query.status === "profile-saved" && <p className="admin-alert success">{HR_DETAIL_PAGE.saved}</p>}
      {query.status === "attendance-saved" && <p className="admin-alert success">{HR_DETAIL_PAGE.attendanceUpdated}</p>}
      {query.error && <p className="admin-alert error">{query.error}</p>}

      <section className="admin-employee-identity">
        <article className="admin-card admin-employee-profile-card">
          <div className="admin-employee-photo">{employee.photoKey ? <Image src={`/api/admin/hr-photo/${employee.adminUserId}`} alt={HR_DETAIL_PAGE.photoAlt(employee.name)} width={150} height={150} unoptimized /> : <span>{employee.name.slice(0, 1).toUpperCase()}</span>}</div>
          <h2>{employee.name}</h2><p>@{employee.username}</p>
          <dl><div><dt>{HR_DETAIL_PAGE.role}</dt><dd>{roleLabel(employee.role)}</dd></div><div><dt>{HR_DETAIL_PAGE.branch}</dt><dd>{employee.branch || HR_DETAIL_PAGE.notAssigned}</dd></div><div><dt>{HR_DETAIL_PAGE.status}</dt><dd>{employee.active ? HR_DETAIL_PAGE.active : HR_DETAIL_PAGE.locked}</dd></div><div><dt>{HR_DETAIL_PAGE.joinedAt}</dt><dd>{formatDate(employee.joinedDate)}</dd></div></dl>
        </article>
        <div className="admin-employee-month-stats">
          <article><span>{HR_DETAIL_PAGE.workDaysThisMonth}</span><strong>{workedDays}</strong><small>{monthRecords.length} {HR_DETAIL_PAGE.daysRecorded}</small></article>
          <article><span>{HR_DETAIL_PAGE.totalHours}</span><strong>{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</strong><small>{HR_DETAIL_PAGE.fromCheckTimes}</small></article>
          <article><span>{HR_DETAIL_PAGE.late}</span><strong>{monthRecords.filter((item) => item.status === "late").length}</strong><small>{HR_DETAIL_PAGE.lateRule}</small></article>
          <article><span>{HR_DETAIL_PAGE.baseSalary}</span><strong>{employee.monthlySalary ? formatMoney(employee.monthlySalary) : HR_DETAIL_PAGE.notSet}</strong><small>{employee.bankName || HR_DETAIL_PAGE.noBank}</small></article>
        </div>
      </section>

      <form action={saveEmployeeProfileAction} className="admin-card admin-hr-profile-form">
        <input type="hidden" name="adminUserId" value={employee.adminUserId} />
        <div className="admin-card-head"><div><span>{HR_DETAIL_PAGE.personalEyebrow}</span><h2>{HR_DETAIL_PAGE.updateTitle}</h2></div><strong className="admin-private-data-badge">{HR_DETAIL_PAGE.privateBadge}</strong></div>
        <fieldset><legend>{HR_DETAIL_PAGE.identitySection}</legend><div className="admin-hr-form-grid">
          <label className="admin-field"><span>{HR_DETAIL_PAGE.fullName}</span><input name="name" defaultValue={employee.name} minLength={2} maxLength={100} required /></label>
          <label className="admin-field"><span>{HR_DETAIL_PAGE.dateOfBirth}</span><input type="date" name="dateOfBirth" defaultValue={employee.dateOfBirth} /></label>
          <label className="admin-field"><span>{HR_DETAIL_PAGE.joinedAt}</span><input type="date" name="joinedDate" defaultValue={employee.joinedDate} /></label>
          <label className="admin-field"><span>{HR_DETAIL_PAGE.citizenId}</span><input name="citizenId" defaultValue={employee.citizenId} inputMode="numeric" maxLength={20} autoComplete="off" /></label>
          <label className="admin-field admin-hr-wide"><span>{HR_DETAIL_PAGE.photo}</span><input type="file" name="photo" accept="image/jpeg,image/png,image/webp" /><small>{HR_DETAIL_PAGE.photoHint}</small></label>
        </div></fieldset>
        <fieldset><legend>{HR_DETAIL_PAGE.residenceSection}</legend><div className="admin-hr-form-grid">
          <label className="admin-field admin-hr-wide"><span>{HR_DETAIL_PAGE.permanentAddress}</span><textarea name="permanentAddress" rows={3} defaultValue={employee.permanentAddress} placeholder={HR_DETAIL_PAGE.permanentAddressPlaceholder} /></label>
          <label className="admin-field admin-hr-wide"><span>{HR_DETAIL_PAGE.temporaryAddress}</span><textarea name="temporaryAddress" rows={3} defaultValue={employee.temporaryAddress} placeholder={HR_DETAIL_PAGE.temporaryAddressPlaceholder} /></label>
        </div></fieldset>
        <fieldset><legend>{HR_DETAIL_PAGE.bankSection}</legend><div className="admin-hr-form-grid">
          <label className="admin-field"><span>{HR_DETAIL_PAGE.bankName}</span><input name="bankName" defaultValue={employee.bankName} placeholder="VD: Techcombank" /></label>
          <label className="admin-field"><span>{HR_DETAIL_PAGE.accountNumber}</span><input name="bankAccountNumber" defaultValue={employee.bankAccountNumber} inputMode="numeric" autoComplete="off" /></label>
          <label className="admin-field"><span>{HR_DETAIL_PAGE.accountName}</span><input name="bankAccountName" defaultValue={employee.bankAccountName} placeholder="NGUYEN VAN AN" /></label>
          <label className="admin-field"><span>{HR_DETAIL_PAGE.monthlySalary}</span><AdminMoneyInput name="monthlySalary" initialValue={employee.monthlySalary} placeholder="12.000.000" /></label>
        </div></fieldset>
        <div className="admin-form-actions"><button className="admin-button admin-button-primary" type="submit">{HR_DETAIL_PAGE.saveProfile}</button></div>
      </form>

      <section className="admin-hr-attendance-layout">
        <article className="admin-card">
          <div className="admin-card-head"><div><span>{HR_DETAIL_PAGE.attendanceEyebrow}</span><h2>{HR_DETAIL_PAGE.attendanceTitle}</h2></div></div>
          <form action={saveAttendanceAction} className="admin-attendance-form">
            <input type="hidden" name="adminUserId" value={employee.adminUserId} />
            <label className="admin-field"><span>{HR_DETAIL_PAGE.workDate}</span><input type="date" name="workDate" defaultValue={vietnamDate()} required /></label>
            <label className="admin-field"><span>{HR_DETAIL_PAGE.status}</span><select name="attendanceStatus" defaultValue="present"><option value="present">{HR_DETAIL_PAGE.statusPresent}</option><option value="late">{HR_DETAIL_PAGE.late}</option><option value="leave">{HR_DETAIL_PAGE.statusLeave}</option><option value="absent">{HR_DETAIL_PAGE.statusAbsent}</option></select></label>
            <label className="admin-field"><span>{HR_DETAIL_PAGE.checkIn}</span><input type="time" name="checkIn" /></label>
            <label className="admin-field"><span>{HR_DETAIL_PAGE.checkOut}</span><input type="time" name="checkOut" /></label>
            <label className="admin-field admin-hr-wide"><span>{HR_DETAIL_PAGE.note}</span><input name="note" placeholder={HR_DETAIL_PAGE.notePlaceholder} /></label>
            <button className="admin-button admin-button-primary" type="submit">{HR_DETAIL_PAGE.saveAttendance}</button>
          </form>
        </article>
        <article className="admin-card admin-attendance-history">
          <div className="admin-card-head"><div><span>{attendance.length} {HR_DETAIL_PAGE.recentRecords}</span><h2>{HR_DETAIL_PAGE.historyTitle}</h2></div></div>
          <div>{attendance.slice(0, 31).map((record) => <article key={record.id}><time>{formatDate(record.workDate)}</time><span className={`admin-badge hr-attendance-${record.status}`}>{attendanceLabel(record.status)}</span><strong>{record.checkIn || "--:--"} → {record.checkOut || "--:--"}</strong><small>{record.note || HR_DETAIL_PAGE.updatedBy(record.recordedBy)}</small></article>)}{!attendance.length && <p className="admin-empty-state">{HR_DETAIL_PAGE.noAttendance}</p>}</div>
        </article>
      </section>
    </>
  );
}

function workMinutes(start: string, end: string) { if (!start || !end) return 0; const [sh, sm] = start.split(":").map(Number); const [eh, em] = end.split(":").map(Number); return Math.max(0, eh * 60 + em - sh * 60 - sm); }
function formatDate(value: string) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN") : HR_DETAIL_PAGE.notUpdated; }
function attendanceLabel(value: string) { if (value === "present") return HR_DETAIL_PAGE.statusPresent; if (value === "late") return HR_DETAIL_PAGE.late; if (value === "leave") return HR_DETAIL_PAGE.statusLeave; return HR_DETAIL_PAGE.statusAbsent; }
