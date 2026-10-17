import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwnerPage } from "@/src/services/admin-auth";
import { getEmployeeProfile, getPayrollRecord } from "@/src/services/data";

import PayrollPrintButton from "@/src/components/features/admin/payroll/PayrollPrintButton";
import DocumentStamp from "@/src/components/common/DocumentStamp";
import { roleLabel } from "@/src/constants/shared/roles";
import { PAYSLIP_PAGE } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";

export default async function PayrollReceiptPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ month?: string }> }) {
  await requireOwnerPage("/admin/payroll");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(query.month || "") ? query.month! : "";
  const [employee, record] = await Promise.all([getEmployeeProfile(id), month ? getPayrollRecord(id, month).catch(() => undefined) : undefined]);
  if (!employee || !record) notFound();
  const gross = record.baseSalary + record.bonusAmount;

  return <>
    <div className="admin-topline admin-payroll-toolbar"><div><span>{PAYSLIP_PAGE.eyebrow}</span><h1>{PAYSLIP_PAGE.title}</h1><p className="admin-subtitle">{PAYSLIP_PAGE.text}</p></div><div className="admin-actions-row"><Link className="admin-button" href={`/admin/payroll?month=${month}&branch=${employee.branchId}`}>{PAYSLIP_PAGE.backToPayroll}</Link><PayrollPrintButton/></div></div>
    <article className="admin-payroll-receipt">
      <header><div><span>INFINITY COMPANY</span><h2>{PAYSLIP_PAGE.documentTitle}</h2><p>{PAYSLIP_PAGE.periodPrefix}{monthLabel(month)}</p></div><dl><div><dt>{PAYSLIP_PAGE.slipCode}</dt><dd>PAY-{month.replace("-", "")}-{record.id.slice(0, 8).toUpperCase()}</dd></div><div><dt>{PAYSLIP_PAGE.status}</dt><dd>{record.status === "paid" ? PAYSLIP_PAGE.paidUpper : PAYSLIP_PAGE.unpaidUpper}</dd></div><div><dt>{PAYSLIP_PAGE.paidAt}</dt><dd>{record.paidAt ? formatDate(record.paidAt) : PAYSLIP_PAGE.notConfirmed}</dd></div></dl></header>
      <section className="admin-payroll-receipt-person"><div><span>{PAYSLIP_PAGE.recipient}</span><strong>{employee.name}</strong><p>{roleLabel(employee.role)}</p></div><div><span>{PAYSLIP_PAGE.branch}</span><strong>{employee.branch || PAYSLIP_PAGE.noBranch}</strong><p>{record.workDays} {PAYSLIP_PAGE.workDaysInPeriod}</p></div><div><span>{PAYSLIP_PAGE.bankAccount}</span><strong>{employee.bankName || PAYSLIP_PAGE.notUpdated}</strong><p>{mask(employee.bankAccountNumber)} · {employee.bankAccountName || employee.name}</p></div></section>
      <section className="admin-payroll-receipt-lines"><div><span>{PAYSLIP_PAGE.baseSalary}</span><strong>{money(record.baseSalary)}</strong></div><div><span>{PAYSLIP_PAGE.bonus}</span><strong className="is-plus">+ {money(record.bonusAmount)}</strong></div><div><span>{PAYSLIP_PAGE.insuranceDeduction}</span><strong className="is-minus">− {money(record.socialInsuranceAmount)}</strong></div><div><span>{PAYSLIP_PAGE.taxDeduction}</span><strong className="is-minus">− {money(record.personalIncomeTaxAmount)}</strong></div><div className="is-gross"><span>{PAYSLIP_PAGE.grossIncome}</span><strong>{money(gross)}</strong></div><div className="is-net"><span>{PAYSLIP_PAGE.netPay}</span><strong>{money(record.payableAmount)}</strong></div></section>
      {record.status === "paid" && <div className="document-stamp-row admin-payroll-stamp"><DocumentStamp kind="disbursed" date={record.paidAt ? formatDate(record.paidAt) : ""} /></div>}
      {record.note && <section className="admin-payroll-receipt-note"><span>{PAYSLIP_PAGE.note}</span><p>{record.note}</p></section>}
      <p className="admin-payroll-receipt-disclaimer">{PAYSLIP_PAGE.disclaimer}</p>
      <footer><div><strong>{PAYSLIP_PAGE.preparer}</strong><span>{PAYSLIP_PAGE.signHint}</span></div><div><strong>{PAYSLIP_PAGE.receiver}</strong><span>{PAYSLIP_PAGE.signHint}</span></div><div><strong>{PAYSLIP_PAGE.director}</strong><span>{PAYSLIP_PAGE.signHint}</span></div></footer>
    </article>
  </>;
}

function money(value: number) { return `${Math.max(0, Math.round(value)).toLocaleString("vi-VN")} đồng`; }
function monthLabel(value: string) { const [year, month] = value.split("-"); return PAYSLIP_PAGE.monthLabel(Number(month), year); }
function formatDate(timestamp: number) { return new Date(timestamp).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }); }
function mask(value: string) { return value ? `${"•".repeat(Math.max(4, value.length - 4))}${value.slice(-4)}` : PAYSLIP_PAGE.noBankAccount; }
