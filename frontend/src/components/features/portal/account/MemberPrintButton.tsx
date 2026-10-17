"use client";
import { MEMBER_PRINT } from "@/src/constants/portal/account";

export default function MemberPrintButton() {
  return <button type="button" className="button button-primary member-invoice-print-button" onClick={() => window.print()}>{MEMBER_PRINT.label}</button>;
}
