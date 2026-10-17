import { PAYROLL_LOADING } from "@/src/constants/admin/pages";
export default function PayrollLoading() {
  return (
    <>
      <div className="admin-topline">
        <div>
          <span>{PAYROLL_LOADING.eyebrow}</span>
          <h1>{PAYROLL_LOADING.title}</h1>
          <p className="admin-subtitle">{PAYROLL_LOADING.text}</p>
        </div>
      </div>
      <section className="admin-card admin-empty-state" role="status" aria-live="polite">
        {PAYROLL_LOADING.wait}</section>
    </>
  );
}
