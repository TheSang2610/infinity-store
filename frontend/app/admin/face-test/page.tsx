import { canManageEmployee, requireHrManagerPage } from "@/src/services/admin-auth";
import { getAdminUsers } from "@/src/services/data";
import FaceTestConsole from "@/src/components/features/admin/attendance/FaceTestConsole";
import { FACE_TEST_PAGE } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";

export default async function FaceTestPage() {
  const manager = await requireHrManagerPage("/admin/face-test");
  const allEmployees = await getAdminUsers().catch(() => []);
  const employees = manager.role === "owner" ? allEmployees : allEmployees.filter((employee) => canManageEmployee(manager, employee));

  return (
    <>
      <div className="admin-topline face-test-topline">
        <div>
          <span>{FACE_TEST_PAGE.eyebrow}</span>
          <h1>{FACE_TEST_PAGE.title}</h1>
          <p className="admin-subtitle">{manager.role === "owner" ? FACE_TEST_PAGE.text : FACE_TEST_PAGE.managerText(manager.branch)}</p>
        </div>
        <div className="face-test-model"><i>AI</i><span><small>{FACE_TEST_PAGE.model}</small><strong>Facenet512 · DeepFace</strong></span></div>
      </div>
      <FaceTestConsole employees={employees.map(({ id, name, role, branch, branchId, active }) => ({ id, name, role, branch, branchId, active }))} scopeLabel={manager.role === "owner" ? FACE_TEST_PAGE.allBranches : manager.branch} />
    </>
  );
}
