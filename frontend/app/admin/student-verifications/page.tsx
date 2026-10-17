import Link from "next/link";
import { requireAdminPage } from "@/src/services/admin-auth";
import { getStudentVerifications } from "@/src/services/data";
import type { StudentVerificationStatus } from "@/src/types";
import { reviewStudentVerificationAction } from "@/src/actions/admin/student-verifications";
import { STUDENT_REVIEW_PAGE } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";

export default async function StudentVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string; status?: string; error?: string }>;
}) {
  const [user, query, requests] = await Promise.all([
    requireAdminPage("/admin/student-verifications"),
    searchParams,
    getStudentVerifications().catch(() => []),
  ]);
  const keyword = query.q?.trim().toLocaleLowerCase("vi-VN") || "";
  const filter = isStatus(query.filter) ? query.filter : "all";
  const visible = requests.filter((item) => {
    const matchesStatus = filter === "all" || item.status === filter;
    const haystack = `${item.customerName} ${item.customerEmail} ${item.customerPhone} ${item.school} ${item.studentCode}`.toLocaleLowerCase("vi-VN");
    return matchesStatus && (!keyword || haystack.includes(keyword));
  });
  const pending = requests.filter((item) => item.status === "pending").length;
  const approved = requests.filter((item) => item.status === "approved").length;
  const rejected = requests.filter((item) => item.status === "rejected").length;

  return <>
    <div className="admin-topline student-review-heading">
      <div><span>MEMBER EDUCATION</span><h1>{STUDENT_REVIEW_PAGE.title}</h1><p className="admin-subtitle">{STUDENT_REVIEW_PAGE.text}</p></div>
      {user.role !== "owner" && <Link className="admin-button" href={user.role === "manager" ? "/manager" : "/staff"}>{STUDENT_REVIEW_PAGE.backToWork}</Link>}
    </div>

    {query.status === "approved" && <p className="admin-alert success">{STUDENT_REVIEW_PAGE.approved}</p>}
    {query.status === "rejected" && <p className="admin-alert success">{STUDENT_REVIEW_PAGE.needsUpdate}</p>}
    {query.error && <p className="admin-alert error">{query.error}</p>}

    <section className="student-review-kpis" aria-label={STUDENT_REVIEW_PAGE.statsLabel}>
      <article><span>{STUDENT_REVIEW_PAGE.total}</span><strong>{requests.length}</strong><small>{STUDENT_REVIEW_PAGE.memberSubmitted}</small></article>
      <article className="is-pending"><span>{STUDENT_REVIEW_PAGE.pending}</span><strong>{pending}</strong><small>{STUDENT_REVIEW_PAGE.toHandle}</small></article>
      <article className="is-approved"><span>{STUDENT_REVIEW_PAGE.approvedTitle}</span><strong>{approved}</strong><small>{STUDENT_REVIEW_PAGE.benefitActivated}</small></article>
      <article className="is-rejected"><span>{STUDENT_REVIEW_PAGE.needsUpdateTitle}</span><strong>{rejected}</strong><small>{STUDENT_REVIEW_PAGE.resultSent}</small></article>
    </section>

    <form className="admin-toolbar student-review-toolbar">
      <input name="q" defaultValue={query.q} placeholder={STUDENT_REVIEW_PAGE.searchPlaceholder} />
      <select name="filter" defaultValue={filter}>
        <option value="all">{STUDENT_REVIEW_PAGE.allStatuses}</option>
        <option value="pending">{STUDENT_REVIEW_PAGE.pending}</option>
        <option value="approved">{STUDENT_REVIEW_PAGE.approvedTitle}</option>
        <option value="rejected">{STUDENT_REVIEW_PAGE.needsUpdateTitle}</option>
      </select>
      <button className="admin-button" type="submit">{STUDENT_REVIEW_PAGE.filter}</button>
    </form>

    <section className="student-review-list">
      {visible.map((request) => <article className={`admin-card student-review-card is-${request.status}`} key={request.id}>
        <header>
          <div className="student-review-person"><span>{request.customerName.slice(0, 1).toUpperCase() || "M"}</span><div><h2>{request.customerName || STUDENT_REVIEW_PAGE.noName}</h2><p>{request.customerEmail} · {request.customerPhone || STUDENT_REVIEW_PAGE.noPhone}</p></div></div>
          <em className={`student-review-status is-${request.status}`}><i />{statusLabel(request.status)}</em>
        </header>
        <div className="student-review-body">
          <dl>
            <div><dt>{STUDENT_REVIEW_PAGE.school}</dt><dd>{request.school}</dd></div>
            <div><dt>{STUDENT_REVIEW_PAGE.studentId}</dt><dd>{request.studentCode}</dd></div>
            <div><dt>{STUDENT_REVIEW_PAGE.major}</dt><dd>{request.faculty || STUDENT_REVIEW_PAGE.notProvided}</dd></div>
            <div><dt>{STUDENT_REVIEW_PAGE.graduation}</dt><dd>{request.graduationYear || STUDENT_REVIEW_PAGE.notProvided}</dd></div>
            <div><dt>{STUDENT_REVIEW_PAGE.submittedAt}</dt><dd>{formatDate(request.createdAt)}</dd></div>
            <div><dt>{STUDENT_REVIEW_PAGE.lastUpdate}</dt><dd>{formatDate(request.updatedAt)}</dd></div>
          </dl>
          <aside>
            <span>{STUDENT_REVIEW_PAGE.attachment}</span>
            <strong>{request.documentName || STUDENT_REVIEW_PAGE.verificationFile}</strong>
            <Link href={`/api/admin/student-verifications/${request.id}/document`} target="_blank">{STUDENT_REVIEW_PAGE.openFile}</Link>
          </aside>
        </div>
        {request.reviewedAt > 0 && <div className="student-review-history"><span>{STUDENT_REVIEW_PAGE.lastFeedback}</span><p>{request.reviewNote || STUDENT_REVIEW_PAGE.approvedFeedback}</p><small>{request.reviewedByName} · {formatDate(request.reviewedAt)}</small></div>}
        <form action={reviewStudentVerificationAction} className="student-review-form">
          <input type="hidden" name="id" value={request.id} />
          <label className="admin-field"><span>{STUDENT_REVIEW_PAGE.feedbackLabel}</span><textarea name="note" rows={2} maxLength={500} defaultValue={request.status === "rejected" ? request.reviewNote : ""} placeholder={STUDENT_REVIEW_PAGE.feedbackPlaceholder} /></label>
          <div>
            <button className="admin-button student-reject-button" name="decision" value="rejected" type="submit">{STUDENT_REVIEW_PAGE.requestUpdate}</button>
            <button className="admin-button admin-button-primary" name="decision" value="approved" type="submit">{STUDENT_REVIEW_PAGE.approve}</button>
          </div>
        </form>
      </article>)}
      {!visible.length && <div className="admin-card admin-empty-state">{STUDENT_REVIEW_PAGE.empty}</div>}
    </section>
  </>;
}

function isStatus(value?: string): value is StudentVerificationStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

function statusLabel(status: StudentVerificationStatus) {
  if (status === "approved") return STUDENT_REVIEW_PAGE.approvedTitle;
  if (status === "rejected") return STUDENT_REVIEW_PAGE.needsUpdateTitle;
  return STUDENT_REVIEW_PAGE.pending;
}

function formatDate(value: number) {
  return value ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—";
}
