"use client";

import { useMemo, useState } from "react";
import { assignOrderAction } from "@/src/actions/admin/orders-products";
import { roleShortLabel } from "@/src/constants/shared/roles";
import { ORDER_ASSIGNMENT } from "@/src/constants/admin/components";

type BranchOption = { id: string; name: string };
type StaffOption = { id: string; name: string; branchId: string; role: string };

export default function OrderAssignmentForm({
  orderId,
  branches,
  staff,
  defaultBranchId,
  defaultAdminId,
  lockBranch,
}: {
  orderId: string;
  branches: BranchOption[];
  staff: StaffOption[];
  defaultBranchId: string;
  defaultAdminId: string;
  lockBranch: boolean;
}) {
  const initialBranch = defaultBranchId || branches[0]?.id || "";
  const [branchId, setBranchId] = useState(initialBranch);
  const availableStaff = useMemo(() => staff.filter((item) => item.branchId === branchId), [branchId, staff]);
  const selectedAdmin = availableStaff.some((item) => item.id === defaultAdminId) ? defaultAdminId : "";

  return (
    <form action={assignOrderAction} className="admin-order-assignment-form">
      <input type="hidden" name="id" value={orderId} />
      {lockBranch ? (
        <input type="hidden" name="branchId" value={branchId} />
      ) : (
        <label><span>{ORDER_ASSIGNMENT.branch}</span><select name="branchId" value={branchId} onChange={(event) => setBranchId(event.target.value)} required><option value="" disabled>{ORDER_ASSIGNMENT.chooseBranch}</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
      )}
      {lockBranch && <p className="admin-assignment-locked"><span>{ORDER_ASSIGNMENT.branch}</span><strong>{branches.find((item) => item.id === branchId)?.name || ORDER_ASSIGNMENT.noBranch}</strong></p>}
      <label><span>{ORDER_ASSIGNMENT.assignee}</span><select name="adminUserId" key={`${branchId}-${selectedAdmin}`} defaultValue={selectedAdmin}><option value="">{ORDER_ASSIGNMENT.unassigned}</option>{availableStaff.map((item) => <option key={item.id} value={item.id}>{item.name} · {roleShortLabel(item.role)}</option>)}</select></label>
      <button className="admin-button admin-button-primary" type="submit" disabled={!branchId}>{ORDER_ASSIGNMENT.save}</button>
    </form>
  );
}
