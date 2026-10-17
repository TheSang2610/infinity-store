import { requireAdminPage } from "@/src/services/admin-auth";
import { getAdminUsers, getBranches, getAccessibleCameras, getCameraPermissions } from "@/src/services/data";

import CameraViewer from "@/src/components/features/admin/cameras/CameraViewer";
import { createCameraAction, grantCameraAction, revokeCameraAction, toggleCameraAction } from "@/src/actions/admin/cameras";
import { roleShortLabel } from "@/src/constants/shared/roles";
import { CAMERAS_PAGE } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";

export default async function CamerasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const user = await requireAdminPage("/admin/cameras");
  const isOwner = user.role === "owner";
  const [cameras, branches, users, permissions, query] = await Promise.all([
    getAccessibleCameras(user).catch(() => []),
    isOwner ? getBranches(false).catch(() => []) : Promise.resolve([]),
    isOwner ? getAdminUsers().catch(() => []) : Promise.resolve([]),
    isOwner ? getCameraPermissions().catch(() => []) : Promise.resolve([]),
    searchParams,
  ]);
  const staff = users.filter((item) => item.role !== "owner" && item.active);

  return (
    <>
      <div className="admin-topline camera-page-toolbar">
        <div>
          <span>{CAMERAS_PAGE.eyebrow}</span>
          <h1>{CAMERAS_PAGE.title}</h1>
          <p className="admin-subtitle">
            {isOwner
              ? CAMERAS_PAGE.ownerText
              : CAMERAS_PAGE.staffText}
          </p>
        </div>
        <div className="camera-security-pill"><i /> {CAMERAS_PAGE.protected}</div>
      </div>

      {query.status === "camera-created" && <p className="admin-alert success">{CAMERAS_PAGE.cameraAdded}</p>}
      {query.status === "permission-created" && <p className="admin-alert success">{CAMERAS_PAGE.permissionGranted}</p>}
      {query.error && <p className="admin-alert error">{query.error}</p>}

      <section className="admin-branch-summary camera-summary">
        <article><span>{CAMERAS_PAGE.accessible}</span><strong>{cameras.length}</strong></article>
        <article><span>{CAMERAS_PAGE.active}</span><strong>{cameras.filter((camera) => camera.active).length}</strong></article>
        <article><span>{CAMERAS_PAGE.scope}</span><strong className="camera-scope-label">{isOwner ? CAMERAS_PAGE.allBranches : CAMERAS_PAGE.granted}</strong></article>
      </section>

      <section className="camera-grid">
        {cameras.map((camera) => (
          <article className={`camera-card ${camera.active ? "" : "is-inactive"}`} key={camera.id}>
            <header>
              <div><span>{camera.branchName}</span><h2>{camera.name}</h2></div>
              <b className={camera.active ? "is-online" : ""}>{camera.active ? CAMERAS_PAGE.online : CAMERAS_PAGE.paused}</b>
            </header>
            <CameraViewer camera={camera} />
            <footer>
              <div><span>{CAMERAS_PAGE.location}</span><strong>{camera.location || CAMERAS_PAGE.noNote}</strong></div>
              <div><span>{CAMERAS_PAGE.streamType}</span><strong>{streamTypeLabel(camera.streamType)}</strong></div>
              {isOwner && (
                <form action={toggleCameraAction}>
                  <input type="hidden" name="id" value={camera.id} />
                  <input type="hidden" name="active" value={String(!camera.active)} />
                  <button className="admin-button" type="submit">{camera.active ? CAMERAS_PAGE.paused : CAMERAS_PAGE.activate}</button>
                </form>
              )}
            </footer>
          </article>
        ))}
        {!cameras.length && (
          <div className="admin-card camera-empty-state">
            <span className="camera-lens" aria-hidden="true" />
            <h2>{isOwner ? CAMERAS_PAGE.emptyTitle : CAMERAS_PAGE.noPermissionTitle}</h2>
            <p>{isOwner ? CAMERAS_PAGE.emptyText : CAMERAS_PAGE.noPermissionText}</p>
          </div>
        )}
      </section>

      {isOwner && (
        <section className="camera-management-grid">
          <article className="admin-card">
            <div className="admin-card-head"><div><span>{CAMERAS_PAGE.newDevice}</span><h2>{CAMERAS_PAGE.addTitle}</h2></div></div>
            {!branches.length && <p className="admin-alert error">{CAMERAS_PAGE.needBranch}</p>}
            <form action={createCameraAction} className="camera-management-form">
              <label className="admin-field"><span>{CAMERAS_PAGE.branch}</span><select name="branchId" required defaultValue=""><option value="" disabled>{CAMERAS_PAGE.chooseBranch}</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
              <label className="admin-field"><span>{CAMERAS_PAGE.cameraName}</span><input name="name" required placeholder={CAMERAS_PAGE.cameraNamePlaceholder} /></label>
              <label className="admin-field"><span>{CAMERAS_PAGE.installLocation}</span><input name="location" placeholder={CAMERAS_PAGE.installLocationPlaceholder} /></label>
              <label className="admin-field"><span>{CAMERAS_PAGE.streamFormat}</span><select name="streamType" defaultValue="embed"><option value="embed">{CAMERAS_PAGE.streamEmbed}</option><option value="video">{CAMERAS_PAGE.streamVideo}</option><option value="snapshot">{CAMERAS_PAGE.streamSnapshot}</option></select></label>
              <label className="admin-field camera-form-wide"><span>URL xem camera</span><input name="streamUrl" type="url" required placeholder="https://camera.example.com/embed/..." /></label>
              <p className="camera-form-note">{CAMERAS_PAGE.streamHint}</p>
              <button className="admin-button admin-button-primary" type="submit" disabled={!branches.length}>{CAMERAS_PAGE.add}</button>
            </form>
          </article>

          <article className="admin-card">
            <div className="admin-card-head"><div><span>{CAMERAS_PAGE.permissionsEyebrow}</span><h2>{CAMERAS_PAGE.grantTitle}</h2></div></div>
            <form action={grantCameraAction} className="camera-permission-form">
              <label className="admin-field"><span>{CAMERAS_PAGE.employee}</span><select name="adminUserId" required defaultValue=""><option value="" disabled>{CAMERAS_PAGE.chooseEmployee}</option>{staff.map((item) => <option key={item.id} value={item.id}>{item.name} · {roleShortLabel(item.role)}</option>)}</select></label>
              <label className="admin-field"><span>{CAMERAS_PAGE.viewableBranch}</span><select name="branchId" required defaultValue=""><option value="" disabled>{CAMERAS_PAGE.chooseBranch}</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
              <button className="admin-button admin-button-primary" type="submit" disabled={!staff.length || !branches.length}>{CAMERAS_PAGE.grant}</button>
            </form>
            <div className="camera-permission-list">
              {permissions.map((permission) => (
                <div key={permission.id}>
                  <span className="camera-user-avatar">{permission.userName.slice(0, 1).toUpperCase()}</span>
                  <p><strong>{permission.userName}</strong><span>{CAMERAS_PAGE.viewingPrefix}{permission.branchName}</span></p>
                  <form action={revokeCameraAction}><input type="hidden" name="id" value={permission.id} /><button className="admin-button admin-button-danger" type="submit">{CAMERAS_PAGE.revoke}</button></form>
                </div>
              ))}
              {!permissions.length && <p className="camera-no-permission">{CAMERAS_PAGE.noPermissions}</p>}
            </div>
          </article>
        </section>
      )}
    </>
  );
}

function streamTypeLabel(type: string) {
  if (type === "video") return CAMERAS_PAGE.typeVideo;
  if (type === "snapshot") return CAMERAS_PAGE.typeSnapshot;
  return CAMERAS_PAGE.typeEmbed;
}
