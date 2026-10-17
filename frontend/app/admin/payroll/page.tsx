import { requireOwnerPage } from "@/src/services/admin-auth";
import { getBranches, getAttendanceForMonth, getPayrollEmployeeDirectory, getPayrollRecords } from "@/src/services/data";

import PayrollEditorForm from "@/src/components/features/admin/payroll/PayrollEditorForm";
import { PAYROLL_PAGE } from "@/src/constants/admin/pages";
import { formatVnd } from "@/src/lib/format";

export const dynamic = "force-dynamic";

export default async function PayrollPage({ searchParams }: { searchParams: Promise<{ month?: string; branch?: string; error?: string; status?: string }> }) {
  await requireOwnerPage("/admin/payroll");
  const query = await searchParams;
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(query.month || "") ? query.month! : currentMonth();
  const [allEmployees, records, branches, monthAttendance] = await Promise.all([
    getPayrollEmployeeDirectory().catch(() => []),
    getPayrollRecords(month).catch(() => []),
    getBranches().catch(() => []),
    getAttendanceForMonth(month).catch(() => []),
  ]);
  const selectedBranch = branches.some((branch) => branch.id === query.branch) ? query.branch! : "";
  const employees = selectedBranch ? allEmployees.filter((employee) => employee.branchId === selectedBranch) : allEmployees;
  const attendance = new Map<string, typeof monthAttendance>();
  monthAttendance.forEach((row) => attendance.set(row.adminUserId, [...(attendance.get(row.adminUserId) || []), row]));
  const recordMap = new Map(records.map((record) => [record.adminUserId, record]));
  const rows = employees.map((employee) => {
    const monthAttendance = attendance.get(employee.adminUserId) || [];
    const workDays = monthAttendance.filter((item) => item.status === "present" || item.status === "late").length;
    const record = recordMap.get(employee.adminUserId);
    return { employee, record, workDays, lateDays: monthAttendance.filter((item) => item.status === "late").length, payable: record?.payableAmount ?? employee.monthlySalary };
  });
  const grouped = groupByBranch(rows, branches);
  const total = rows.reduce((sum, row) => sum + row.payable, 0);
  const paid = rows.reduce((sum, row) => sum + (row.record?.status === "paid" ? row.payable : 0), 0);

  return <>
    <div className="admin-topline"><div><span>{PAYROLL_PAGE.eyebrow}</span><h1>{PAYROLL_PAGE.title}</h1><p className="admin-subtitle">{PAYROLL_PAGE.text}</p></div></div>
    {query.status === "saved" && <p className="admin-alert success">{PAYROLL_PAGE.saved}</p>}{query.error && <p className="admin-alert error">{query.error}</p>}
    <form className="admin-report-filters admin-payroll-filters"><label><span>{PAYROLL_PAGE.month}</span><input type="month" name="month" defaultValue={month}/></label><label><span>{PAYROLL_PAGE.branch}</span><select name="branch" defaultValue={selectedBranch}><option value="">{PAYROLL_PAGE.allBranches}</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label><button className="admin-button admin-button-primary">{PAYROLL_PAGE.view}</button></form>
    <section className="admin-report-kpis"><Metric label={PAYROLL_PAGE.totalNet} value={formatVnd(total)} note={PAYROLL_PAGE.staffInScope(rows.length)}/><Metric label={PAYROLL_PAGE.paid} value={formatVnd(paid)} note={PAYROLL_PAGE.paidSlips(rows.filter((row) => row.record?.status === "paid").length)}/><Metric label={PAYROLL_PAGE.unpaid} value={formatVnd(total - paid)} note={PAYROLL_PAGE.unpaidNote}/><Metric label={PAYROLL_PAGE.missingAccount} value={String(rows.filter((row) => !row.employee.hasBankAccount).length)} note={PAYROLL_PAGE.missingAccountNote}/></section>
    <p className="admin-ledger-note"><strong>{PAYROLL_PAGE.taxReviewLabel}</strong> {PAYROLL_PAGE.taxReviewText}</p>
    <div className="admin-payroll-branches">{grouped.map((group) => <section className="admin-card admin-payroll-list" key={group.id}><div className="admin-card-head admin-payroll-branch-head"><div><span>{group.code} · {group.rows.length} {PAYROLL_PAGE.staffSuffix}</span><h2>{group.name}</h2><p>{group.address}</p></div><strong>{formatVnd(group.rows.reduce((sum, row) => sum + row.payable, 0))}<small>{PAYROLL_PAGE.totalNet}</small></strong></div><div className="admin-payroll-rows">{group.rows.map(({ employee, record, workDays, lateDays }) => <PayrollEditorForm key={employee.adminUserId} employee={{ id: employee.adminUserId, name: employee.name, role: employee.role, branch: employee.branch, monthlySalary: employee.monthlySalary, bankName: employee.bankName, bankAccountMasked: employee.bankAccountMasked }} month={month} selectedBranch={selectedBranch} workDays={workDays} lateDays={lateDays} record={record}/>)}</div></section>)}{!rows.length && <section className="admin-card admin-empty-state">{PAYROLL_PAGE.empty}</section>}</div>
  </>;
}

type PayrollRow = { employee: { branchId: string; branch: string }; payable: number };
function groupByBranch<T extends PayrollRow>(rows: T[], branches: Array<{ id: string; code: string; name: string; address: string }>) {
  const known = branches.map((branch) => ({ ...branch, rows: rows.filter((row) => row.employee.branchId === branch.id) })).filter((group) => group.rows.length);
  const unassigned = rows.filter((row) => !branches.some((branch) => branch.id === row.employee.branchId));
  return unassigned.length ? [...known, { id: "unassigned", code: PAYROLL_PAGE.unassignedKey, name: PAYROLL_PAGE.unassignedBranch, address: PAYROLL_PAGE.needsProfile, rows: unassigned }] : known;
}
function Metric({ label, value, note }: { label: string; value: string; note: string }) { return <article><i>₫</i><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>; }
function currentMonth() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit" }).format(new Date()); }
