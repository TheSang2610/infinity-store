import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { adminUsers, branchCameras, branches, cameraBranchPermissions } from "../db/schema";
import { badRequest } from "../utils/http";
import type { AdminUser, Camera, CameraPermission } from "../types";

const STREAM_TYPES = ["embed", "video", "snapshot"];

/** Giam doc xem moi camera; nguoi khac chi xem camera dang bat cua chi nhanh duoc cap quyen. */
export async function getAccessibleCameras(user: AdminUser): Promise<Camera[]> {
  const db = getDb();
  const columns = { camera: branchCameras, branchName: branches.name };
  const rows = user.role === "owner"
    ? await db.select(columns).from(branchCameras).innerJoin(branches, eq(branches.id, branchCameras.branchId))
      .orderBy(asc(branches.name), asc(branchCameras.name))
    : await db.select(columns).from(branchCameras)
      .innerJoin(branches, eq(branches.id, branchCameras.branchId))
      .innerJoin(cameraBranchPermissions, eq(cameraBranchPermissions.branchId, branchCameras.branchId))
      .where(and(eq(cameraBranchPermissions.adminUserId, user.id), eq(branchCameras.active, true), eq(branches.active, true)))
      .orderBy(asc(branches.name), asc(branchCameras.name));
  return rows.map(({ camera, branchName }) => ({ ...camera, branchName }));
}

export async function getCameraPermissions(): Promise<CameraPermission[]> {
  const rows = await getDb().select({ permission: cameraBranchPermissions, userName: adminUsers.name, branchName: branches.name })
    .from(cameraBranchPermissions)
    .innerJoin(adminUsers, eq(adminUsers.id, cameraBranchPermissions.adminUserId))
    .innerJoin(branches, eq(branches.id, cameraBranchPermissions.branchId))
    .orderBy(asc(branches.name), asc(adminUsers.name));
  return rows.map(({ permission, userName, branchName }) => ({ ...permission, userName, branchName }));
}

export async function createCamera(input: { branchId: string; name: string; location: string; streamUrl: string; streamType: string }) {
  const name = input.name.trim().slice(0, 100);
  const location = input.location.trim().slice(0, 120);
  const streamUrl = input.streamUrl.trim().slice(0, 2000);
  if (name.length < 2 || !input.branchId) throw badRequest("Vui lòng chọn chi nhánh và nhập tên camera.");
  let url: URL;
  try {
    url = new URL(streamUrl);
  } catch {
    throw badRequest("URL camera không hợp lệ.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw badRequest("Camera phải sử dụng URL HTTP hoặc HTTPS.");
  await getDb().insert(branchCameras).values({
    id: randomUUID(), branchId: input.branchId, name, location, streamUrl,
    streamType: STREAM_TYPES.includes(input.streamType) ? input.streamType : "embed", active: true, createdAt: Date.now(),
  });
}

export async function setCameraActive(id: string, active: boolean) {
  await getDb().update(branchCameras).set({ active }).where(eq(branchCameras.id, id));
}

export async function grantCameraBranch(adminUserId: string, branchId: string) {
  await getDb().insert(cameraBranchPermissions).values({ id: randomUUID(), adminUserId, branchId, createdAt: Date.now() }).onConflictDoNothing();
}

export async function revokeCameraPermission(id: string) {
  await getDb().delete(cameraBranchPermissions).where(eq(cameraBranchPermissions.id, id));
}
