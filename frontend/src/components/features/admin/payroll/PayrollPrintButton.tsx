"use client";
import { PAYROLL_PRINT } from "@/src/constants/admin/components";

export default function PayrollPrintButton() { return <button className="admin-button admin-button-primary" type="button" onClick={() => window.print()}>{PAYROLL_PRINT.label}</button>; }
