"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import InfinityBrandMark from "@/src/components/common/InfinityBrandMark";
import { roleLabel } from "@/src/constants/shared/roles";
import { EMPLOYEE_CARD } from "@/src/constants/admin/components";

type CardEmployee = {
  adminUserId: string;
  name: string;
  role: string;
  branch: string;
  photoKey: string;
  joinedDate: string;
};

const digitPatterns: Record<string, string> = {
  "0": "nnnwwnwnn", "1": "wnnwnnnnw", "2": "nnwwnnnnw", "3": "wnwwnnnnn", "4": "nnnwwnnnw",
  "5": "wnnwwnnnn", "6": "nnwwwnnnn", "7": "nnnwnnwnw", "8": "wnnwnnwnn", "9": "nnwwnnwnn", "*": "nwnnwnwnn",
};

export default function EmployeeCardPreview({ employee }: { employee: CardEmployee }) {
  const code = useMemo(() => employeeCode(employee.adminUserId), [employee.adminUserId]);
  const [qr, setQr] = useState("");

  useEffect(() => {
    let active = true;
    const payload = JSON.stringify({ type: "INFINITY_COMPANY_EMPLOYEE", code, name: employee.name, role: roleLabel(employee.role), branch: employee.branch });
    import("qrcode")
      .then((mod) => {
        const QRCode = (mod && (mod.default || mod)) as { toDataURL: (data: string, opts: unknown) => Promise<string> };
        return QRCode.toDataURL(payload, { errorCorrectionLevel: "H", margin: 1, width: 320, color: { dark: "#0b315a", light: "#ffffff" } });
      })
      .then((url) => { if (active) setQr(url); })
      .catch(() => { if (active) setQr(""); });
    return () => { active = false; };
  }, [code, employee.branch, employee.name, employee.role]);

  return <>
    <div className="employee-card-toolbar">
      <div><span>{EMPLOYEE_CARD.employeeCode}</span><strong>{code}</strong></div>
      <button type="button" onClick={() => window.print()}>{EMPLOYEE_CARD.print}</button>
    </div>
    <div className="employee-card-print-area">
      <article className="employee-id-card employee-id-front">
        <div className="employee-card-orb employee-card-orb-one" /><div className="employee-card-orb employee-card-orb-two" />
        <header><InfinityBrandMark compact /><div><strong>INFINITY COMPANY</strong><small>EMPLOYEE IDENTITY CARD</small></div><b>STAFF</b></header>
        <div className="employee-card-front-body">
          <div className="employee-card-photo">{employee.photoKey ? <Image src={`/api/admin/hr-photo/${employee.adminUserId}`} alt={EMPLOYEE_CARD.photoAlt(employee.name)} width={132} height={156} unoptimized /> : <span>{employee.name.slice(0, 1).toUpperCase()}</span>}</div>
          <div className="employee-card-person">
            <div className="employee-card-info-row employee-card-name-row"><span>{EMPLOYEE_CARD.fullName}</span><strong>{employee.name}</strong></div>
            <div className="employee-card-info-row"><span>{EMPLOYEE_CARD.position}</span><strong>{roleLabel(employee.role)}</strong></div>
            <div className="employee-card-info-row"><span>{EMPLOYEE_CARD.branch}</span><strong>{employee.branch || EMPLOYEE_CARD.noBranch}</strong></div>
            <em>{EMPLOYEE_CARD.employeeCodePrefix}{code}</em>
          </div>
          <div className="employee-card-qr">{qr ? <Image src={qr} alt={EMPLOYEE_CARD.qrAlt(employee.name)} width={104} height={104} unoptimized /> : <span>{EMPLOYEE_CARD.generatingQr}</span>}<small>{EMPLOYEE_CARD.scanToVerify}</small></div>
        </div>
      </article>

      <article className="employee-id-card employee-id-back">
        <div className="employee-card-back-band"><InfinityBrandMark compact /><div><strong>INFINITY COMPANY</strong><small>BUSINESS MANAGEMENT</small></div></div>
        <div className="employee-card-back-content">
          <p>{EMPLOYEE_CARD.ownershipNote}</p>
          <EmployeeBarcode value={code} />
          <strong className="employee-card-code">{code}</strong>
          <div><span>{EMPLOYEE_CARD.joinedPrefix}{formatDate(employee.joinedDate)}</span><span>{EMPLOYEE_CARD.cardBrand}</span></div>
        </div>
      </article>
    </div>
    <p className="employee-card-print-note">{EMPLOYEE_CARD.printHint}</p>
  </>;
}

function EmployeeBarcode({ value }: { value: string }) {
  const bars: Array<{ x: number; width: number }> = [];
  let cursor = 12;
  for (const character of `*${value}*`) {
    const pattern = digitPatterns[character];
    pattern.split("").forEach((widthType, index) => {
      const width = widthType === "w" ? 3 : 1;
      if (index % 2 === 0) bars.push({ x: cursor, width });
      cursor += width;
    });
    cursor += 1;
  }
  return <svg className="employee-card-barcode" viewBox={`0 0 ${cursor + 12} 54`} role="img" aria-label={EMPLOYEE_CARD.barcodeLabel(value)} preserveAspectRatio="none">
    <rect width={cursor + 12} height="54" fill="#fff" />
    {bars.map((bar, index) => <rect key={`${bar.x}-${index}`} x={bar.x} y="3" width={bar.width} height="48" fill="#082d50" />)}
  </svg>;
}

function employeeCode(id: string) {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) hash = Math.imul(hash ^ id.charCodeAt(index), 16777619);
  return `89${String(hash >>> 0).padStart(10, "0")}`;
}
function formatDate(value: string) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN") : EMPLOYEE_CARD.notUpdated; }
