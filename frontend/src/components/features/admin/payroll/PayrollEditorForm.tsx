"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { savePayrollAction } from "@/src/actions/admin/payroll";
import { roleLabel } from "@/src/constants/shared/roles";
import { PAYROLL_EDITOR } from "@/src/constants/admin/components";
import { formatVnd } from "@/src/lib/format";

type Props = {
  employee: { id: string; name: string; role: string; branch: string; monthlySalary: number; bankName: string; bankAccountMasked: string };
  month: string;
  selectedBranch: string;
  workDays: number;
  lateDays: number;
  record?: { bonusAmount: number; socialInsuranceAmount: number; personalIncomeTaxAmount: number; status: string; note: string };
};

export default function PayrollEditorForm({ employee, month, selectedBranch, workDays, lateDays, record }: Props) {
  const [bonus, setBonus] = useState(record?.bonusAmount || 0);
  const [socialInsurance, setSocialInsurance] = useState(record?.socialInsuranceAmount || 0);
  const [personalIncomeTax, setPersonalIncomeTax] = useState(record?.personalIncomeTaxAmount || 0);
  const gross = employee.monthlySalary + bonus;
  const net = useMemo(() => Math.max(0, gross - socialInsurance - personalIncomeTax), [gross, socialInsurance, personalIncomeTax]);

  return <form action={savePayrollAction} className="admin-payroll-row">
    <input type="hidden" name="adminUserId" value={employee.id}/><input type="hidden" name="payrollMonth" value={month}/><input type="hidden" name="workDays" value={workDays}/><input type="hidden" name="branch" value={selectedBranch}/>
    <div className="admin-payroll-person"><b>{employee.name.slice(0, 1).toUpperCase()}</b><div><strong>{employee.name}</strong><span>{roleLabel(employee.role)}</span><small>{employee.branch || PAYROLL_EDITOR.noBranch}</small></div></div>
    <div className="admin-payroll-attendance"><span>{PAYROLL_EDITOR.workDays}</span><strong>{workDays}</strong><small>{lateDays} {PAYROLL_EDITOR.lateDays}</small></div>
    <div className="admin-payroll-base"><span>{PAYROLL_EDITOR.baseSalary}</span><strong>{formatVnd(employee.monthlySalary)}</strong><small>{employee.bankName || PAYROLL_EDITOR.noBank} · {employee.bankAccountMasked}</small></div>
    <label><span>{PAYROLL_EDITOR.bonus}</span><input name="bonusAmount" type="text" inputMode="numeric" value={numberInput(bonus)} onChange={(event) => setBonus(numberValue(event.target.value))}/></label>
    <label><span>{PAYROLL_EDITOR.insurance}</span><input name="socialInsuranceAmount" type="text" inputMode="numeric" value={numberInput(socialInsurance)} onChange={(event) => setSocialInsurance(numberValue(event.target.value))}/></label>
    <label><span>{PAYROLL_EDITOR.incomeTax}</span><input name="personalIncomeTaxAmount" type="text" inputMode="numeric" value={numberInput(personalIncomeTax)} onChange={(event) => setPersonalIncomeTax(numberValue(event.target.value))}/></label>
    <div className="admin-payroll-net"><span>{PAYROLL_EDITOR.netPay}</span><strong>{formatVnd(net)}</strong><small>{gross > 12_000_000 ? PAYROLL_EDITOR.taxReview : PAYROLL_EDITOR.belowTaxThreshold}</small></div>
    <label><span>{PAYROLL_EDITOR.status}</span><select name="status" defaultValue={record?.status || "draft"}><option value="draft">{PAYROLL_EDITOR.unpaid}</option><option value="paid">{PAYROLL_EDITOR.paid}</option></select></label>
    <label className="admin-payroll-note"><span>{PAYROLL_EDITOR.note}</span><input name="note" defaultValue={record?.note || ""} placeholder={PAYROLL_EDITOR.notePlaceholder}/></label>
    <div className="admin-payroll-actions"><button className="admin-button admin-button-primary">{PAYROLL_EDITOR.save}</button>{record && <Link className="admin-button" href={`/admin/payroll/${employee.id}?month=${month}`}>{PAYROLL_EDITOR.payslip}</Link>}</div>
  </form>;
}

function numberValue(value: string) { const parsed = Number(value.replace(/\D/g, "")); return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0; }
function numberInput(value: number) { return Math.max(0, Math.round(value)).toLocaleString("vi-VN"); }
