"use client";

import { ACCOUNT_PANEL } from "@/src/constants/portal/account";
import { FormEvent, useState } from "react";
import { StudentVerification } from "../account-model";
import type { Dispatch, SetStateAction } from "react";

type StudentTabProps = {
  studentVerification: StudentVerification | null;
  setStudentVerification: Dispatch<SetStateAction<StudentVerification | null>>;
  studentSchool: string;
  setStudentSchool: Dispatch<SetStateAction<string>>;
  studentId: string;
  setStudentId: Dispatch<SetStateAction<string>>;
};

export default function StudentTab({ studentVerification, setStudentVerification, studentSchool, setStudentSchool, studentId, setStudentId }: StudentTabProps) {
  const [studentMsg, setStudentMsg] = useState("");
  const [studentSubmitting, setStudentSubmitting] = useState(false);
  const submitStudent = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!studentSchool.trim() || !studentId.trim()) return;
    setStudentSubmitting(true);
    setStudentMsg("");
    try {
      const response = await fetch("/api/account/student-verification", { method: "POST", body: new FormData(e.currentTarget) });
      const result = await response.json() as { ok?: boolean; message?: string; verification?: StudentVerification | null };
      setStudentMsg(result.message || (response.ok ? ACCOUNT_PANEL.applicationSent : ACCOUNT_PANEL.applicationError));
      if (response.ok && result.verification) setStudentVerification(result.verification);
    } catch {
      setStudentMsg(ACCOUNT_PANEL.connectionError);
    } finally {
      setStudentSubmitting(false);
    }
  };

  return (
    <div className="smem-section-card">
      <div className="smem-tab-header">
        <div>
          <h2>{ACCOUNT_PANEL.studentTitle}</h2>
          <p>{ACCOUNT_PANEL.studentText}</p>
        </div>
      </div>

      {studentMsg && <div className="smem-student-notice" role="status">{studentMsg}</div>}

      {studentVerification ? (
        <div className={`smem-student-status is-${studentVerification.status}`}>
          <div className="smem-student-status-head">
            <span>{studentVerification.status === "approved" ? "✓" : studentVerification.status === "rejected" ? "!" : "◷"}</span>
            <div>
              <strong>{studentVerification.status === "approved" ? ACCOUNT_PANEL.studentApproved : studentVerification.status === "rejected" ? ACCOUNT_PANEL.studentNeedsUpdate : ACCOUNT_PANEL.studentPending}</strong>
              <small>{ACCOUNT_PANEL.updatedPrefix}{new Date(studentVerification.updatedAt).toLocaleString("vi-VN")}</small>
            </div>
          </div>
          <p>{studentVerification.status === "approved"
            ? ACCOUNT_PANEL.studentApprovedText
            : studentVerification.status === "rejected"
              ? studentVerification.reviewNote || ACCOUNT_PANEL.studentNeedsUpdateText
              : ACCOUNT_PANEL.studentPendingText}</p>
          <dl>
            <div><dt>{ACCOUNT_PANEL.school}</dt><dd>{studentVerification.school}</dd></div>
            <div><dt>{ACCOUNT_PANEL.studentId}</dt><dd>{studentVerification.studentCode}</dd></div>
            <div><dt>{ACCOUNT_PANEL.uploadedFile}</dt><dd>{studentVerification.documentName}</dd></div>
            {studentVerification.reviewedByName && <div><dt>{ACCOUNT_PANEL.reviewer}</dt><dd>{studentVerification.reviewedByName}</dd></div>}
          </dl>
          {studentVerification.status !== "pending" && <button type="button" onClick={() => setStudentVerification(null)}>
            {studentVerification.status === "rejected" ? ACCOUNT_PANEL.resubmit : ACCOUNT_PANEL.updateApplication}
          </button>}
        </div>
      ) : (
        <>
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "18px", marginBottom: "20px" }}>
            <h4 style={{ margin: "0 0 6px", color: "#1e40af", fontSize: "14px" }}>{ACCOUNT_PANEL.studentPerksTitle}</h4>
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#1e3a8a", lineHeight: 1.5 }}>
              <li>{ACCOUNT_PANEL.studentPerk1}</li>
              <li>{ACCOUNT_PANEL.studentPerk2}</li>
              <li>{ACCOUNT_PANEL.studentPerk3}</li>
            </ul>
          </div>

          <form onSubmit={submitStudent}>
            <div className="smem-form-grid">
              <div className="smem-input-card">
                <label>{ACCOUNT_PANEL.schoolRequired}</label>
                <input
                  name="school"
                  required
                  placeholder={ACCOUNT_PANEL.schoolPlaceholder}
                  value={studentSchool}
                  onChange={(e) => setStudentSchool(e.target.value)}
                />
              </div>

              <div className="smem-input-card">
                <label>{ACCOUNT_PANEL.studentIdRequired}</label>
                <input
                  name="studentCode"
                  required
                  placeholder={ACCOUNT_PANEL.studentIdPlaceholder}
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
              </div>

              <div className="smem-input-card">
                <label>{ACCOUNT_PANEL.graduationYear}</label>
                <input name="graduationYear" inputMode="numeric" pattern="(19|20)[0-9]{2}" placeholder={ACCOUNT_PANEL.graduationYearPlaceholder} />
              </div>

              <div className="smem-input-card">
                <label>{ACCOUNT_PANEL.major}</label>
                <input name="faculty" placeholder={ACCOUNT_PANEL.majorPlaceholder} />
              </div>

              <div className="smem-input-card smem-form-full">
                <label>{ACCOUNT_PANEL.studentCardRequired}</label>
                <input name="document" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required style={{ padding: "8px" }} />
                <small style={{ color: "#64748b", fontSize: "11.5px" }}>{ACCOUNT_PANEL.studentCardHint}</small>
              </div>
            </div>

            <button type="submit" className="smem-cta-btn" disabled={studentSubmitting}>
              {studentSubmitting ? ACCOUNT_PANEL.submittingApplication : ACCOUNT_PANEL.submitApplication}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
