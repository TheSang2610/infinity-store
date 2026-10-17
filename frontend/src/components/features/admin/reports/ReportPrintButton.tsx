"use client";
import { REPORT_PRINT } from "@/src/constants/admin/components";

export default function ReportPrintButton() {
  return <button className="admin-button" type="button" onClick={() => window.print()}>{REPORT_PRINT.label}</button>;
}
