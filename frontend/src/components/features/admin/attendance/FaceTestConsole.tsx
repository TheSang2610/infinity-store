"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { roleLabel } from "@/src/constants/shared/roles";
import { FACE_CONSOLE } from "@/src/constants/admin/components";

type Employee = { id: string; name: string; role: string; branch: string; branchId: string; active: boolean };
type Registration = { employee_id: string; model_name: string; created_at: number; updated_at: number };
type FaceResult = { kind: "success" | "error"; title: string; detail: string; confidence?: number; distance?: number };
type FaceAction = "enroll" | "verify";
type FaceBox = { left: number; top: number; width: number; height: number };
type FacialArea = { x?: number; y?: number; w?: number; h?: number; image_width?: number; image_height?: number };
type BrowserFaceDetector = { detect(source: HTMLVideoElement): Promise<Array<{ boundingBox: { x: number; y: number; width: number; height: number } }>> };

export default function FaceTestConsole({ employees, scopeLabel }: { employees: Employee[]; scopeLabel: string }) {
  const initialEmployee = employees.find((employee) => employee.active);
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const cameraCardRef = useRef<HTMLElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorAvailableRef = useRef(false);
  const facePresentRef = useRef(false);
  const detectionRequestRef = useRef(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [busy, setBusy] = useState<"enroll" | "verify" | "delete" | "">("");
  const [pendingAction, setPendingAction] = useState<FaceAction | "">("");
  const [serverState, setServerState] = useState<"checking" | "online" | "offline">("checking");
  const [serverError, setServerError] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedBranchKey, setSelectedBranchKey] = useState(initialEmployee ? employeeBranchKey(initialEmployee) : "");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialEmployee?.id || "");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState<FaceResult | null>(null);
  const [faceBox, setFaceBox] = useState<FaceBox | null>(null);

  const branchOptions = useMemo(() => {
    const options = new Map<string, { key: string; name: string; count: number }>();
    for (const employee of employees) {
      const key = employeeBranchKey(employee);
      const existing = options.get(key);
      if (existing) existing.count += 1;
      else options.set(key, { key, name: employee.branch || FACE_CONSOLE.noBranch, count: 1 });
    }
    return [...options.values()].sort((left, right) => left.name.localeCompare(right.name, "vi"));
  }, [employees]);
  const branchEmployees = employees.filter((employee) => employeeBranchKey(employee) === selectedBranchKey);
  const selectableEmployees = branchEmployees.filter((employee) => employee.active);
  const registeredIds = useMemo(() => new Set(registrations.map((item) => item.employee_id)), [registrations]);
  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId);
  const selectedEmployeeName = selectedEmployee?.name || FACE_CONSOLE.employeesSuffix;
  const selectedRegistered = registeredIds.has(selectedEmployeeId);
  const visibleEmployees = branchEmployees.filter((employee) => {
    const matchesKeyword = `${employee.name} ${employee.branch} ${roleLabel(employee.role)}`.toLocaleLowerCase("vi-VN").includes(keyword.trim().toLocaleLowerCase("vi-VN"));
    const registered = registeredIds.has(employee.id);
    return matchesKeyword && (statusFilter === "all" || (statusFilter === "registered" ? registered : !registered));
  });

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setFaceBox(null);
    setPendingAction("");
    facePresentRef.current = false;
  }, [setCameraOn, setFaceBox, setPendingAction]);

  function changeBranch(branchKey: string) {
    stopCamera();
    const nextEmployees = employees.filter((employee) => employeeBranchKey(employee) === branchKey && employee.active);
    setSelectedBranchKey(branchKey);
    setSelectedEmployeeId(nextEmployees[0]?.id || "");
    setPendingAction("");
    setMessage(null);
  }

  const loadRegistrations = useCallback(async () => {
    setServerState("checking");
    setServerError("");
    try {
      const response = await fetch("/api/face/employees", { cache: "no-store" });
      const data = await response.json() as { employees?: Registration[]; message?: string };
      if (!response.ok) throw new Error(data.message || FACE_CONSOLE.deepfaceFailed);
      setRegistrations(Array.isArray(data.employees) ? data.employees : []);
      setServerState("online");
    } catch (error) {
      setServerState("offline");
      setRegistrations([]);
      setServerError(error instanceof Error ? error.message : FACE_CONSOLE.serverFailed);
    }
  }, [setRegistrations, setServerError, setServerState]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRegistrations(), 100);
    return () => window.clearTimeout(timer);
  }, [loadRegistrations]);
  useEffect(() => {
    if (serverState !== "offline") return;
    const timer = window.setTimeout(() => void loadRegistrations(), 5000);
    return () => window.clearTimeout(timer);
  }, [loadRegistrations, serverState]);
  useEffect(() => stopCamera, [stopCamera]);

  async function startCamera(employee?: Employee) {
    if (employee) setSelectedEmployeeId(employee.id);
    setMessage(null);
    setFaceBox(null);
    facePresentRef.current = false;
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      cameraCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return true;
    } catch {
      setMessage({ kind: "error", title: FACE_CONSOLE.cameraFailed, detail: FACE_CONSOLE.allowCameraRetry });
      return false;
    }
  }

  useEffect(() => {
    if (!cameraOn) return;
    const Detector = (window as unknown as { FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => BrowserFaceDetector }).FaceDetector;
    if (!Detector) { detectorAvailableRef.current = false; return; }
    detectorAvailableRef.current = true;
    const detector = new Detector({ fastMode: true, maxDetectedFaces: 1 });
    let active = true;
    let detecting = false;
    let misses = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const track = async () => {
      const video = videoRef.current;
      const viewport = viewportRef.current;
      if (!active || !video || !viewport || detecting || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        if (active) timer = setTimeout(track, 180);
        return;
      }
      detecting = true;
      try {
        const faces = await detector.detect(video);
        if (faces[0]) {
          misses = 0;
          facePresentRef.current = true;
          setFaceBox(mapSquareFaceBox(faces[0].boundingBox, video.videoWidth, video.videoHeight, viewport.clientWidth, viewport.clientHeight, true));
        } else {
          misses += 1;
          if (misses >= 4) { facePresentRef.current = false; setFaceBox(null); }
        }
      } catch {
        detectorAvailableRef.current = false;
        active = false;
      } finally {
        detecting = false;
        if (active) timer = setTimeout(track, 180);
      }
    };
    void track();
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, [cameraOn]);

  useEffect(() => {
    if (!cameraOn || !selectedEmployeeId || busy) return;
    let active = true;
    let misses = 0;
    const detectWithServer = async () => {
      const video = videoRef.current;
      const viewport = viewportRef.current;
      if (!active || !video || !viewport || detectionRequestRef.current || (detectorAvailableRef.current && facePresentRef.current) || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      detectionRequestRef.current = true;
      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 2500);
        const response = await fetch("/api/face/detect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ employee_id: selectedEmployeeId, image_base64: captureFrame(video, 640, 0.72) }), signal: controller.signal }).finally(() => window.clearTimeout(timeout));
        const data = await response.json().catch(() => ({})) as { facial_area?: FacialArea };
        if (!response.ok || !data.facial_area) throw new Error("face-not-found");
        misses = 0;
        facePresentRef.current = true;
        updateFaceTestBox(data.facial_area, video, viewport, setFaceBox);
      } catch {
        misses += 1;
        if (misses >= 2) { facePresentRef.current = false; setFaceBox(null); }
      } finally {
        detectionRequestRef.current = false;
      }
    };
    const first = setTimeout(() => void detectWithServer(), 120);
    const interval = setInterval(() => void detectWithServer(), 400);
    return () => { active = false; clearTimeout(first); clearInterval(interval); };
  }, [busy, cameraOn, selectedEmployeeId]);

  const runFaceAction = useCallback(async (action: FaceAction, employeeId: string, employeeName: string) => {
    const video = videoRef.current;
    if (!video || !employeeId) return;
    setPendingAction("");
    setBusy(action);
    setMessage(null);
    try {
      const response = await fetch(`/api/face/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: employeeId, image_base64: captureFrame(video) }),
      });
      const data = await response.json() as { verified?: boolean; confidence?: number; distance?: number; message?: string; facial_area?: FacialArea };
      if (data.facial_area) updateFaceTestBox(data.facial_area, video, viewportRef.current, setFaceBox);
      if (!response.ok) throw new Error(data.message || FACE_CONSOLE.imageFailed);

      if (action === "enroll") {
        setMessage({ kind: "success", title: FACE_CONSOLE.faceAdded, detail: FACE_CONSOLE.enrolledDetail(employeeName) });
        await loadRegistrations();
      } else if (data.verified) {
        setMessage({ kind: "success", title: FACE_CONSOLE.verifySuccess, detail: data.message || FACE_CONSOLE.recognized(employeeName), confidence: data.confidence, distance: data.distance });
      } else {
        setMessage({ kind: "error", title: FACE_CONSOLE.verifyFailedTitle, detail: data.message || FACE_CONSOLE.adjustFace, confidence: data.confidence, distance: data.distance });
      }
    } catch (error) {
      setMessage({ kind: "error", title: action === "enroll" ? FACE_CONSOLE.enrollFailed : FACE_CONSOLE.verifyFailedTitle, detail: FACE_CONSOLE.adjustFaceDetail(error instanceof Error ? error.message : FACE_CONSOLE.tryAgain) });
    } finally {
      setBusy("");
    }
  }, [loadRegistrations, setBusy, setFaceBox, setMessage, setPendingAction]);

  const faceLocated = Boolean(faceBox);
  useEffect(() => {
    if (!cameraOn || !pendingAction || busy) return;
    const stableTimer = window.setTimeout(() => {
      void runFaceAction(pendingAction, selectedEmployeeId, selectedEmployeeName);
    }, faceLocated ? 350 : 1200);
    return () => window.clearTimeout(stableTimer);
  }, [busy, cameraOn, faceLocated, pendingAction, runFaceAction, selectedEmployeeId, selectedEmployeeName]);

  async function submitFace(action: FaceAction) {
    if (!selectedEmployeeId) {
      setMessage({ kind: "error", title: FACE_CONSOLE.noEmployeeTitle, detail: FACE_CONSOLE.noEmployeeText });
      return;
    }
    if (!videoRef.current || !cameraOn) {
      setMessage(null);
      const opened = await startCamera();
      if (opened) setPendingAction(action);
      return;
    }
    if (!facePresentRef.current) {
      setMessage(null);
      setPendingAction(action);
      return;
    }
    await runFaceAction(action, selectedEmployeeId, selectedEmployeeName);
  }

  async function deleteRegistration(employee: Employee) {
    if (!window.confirm(FACE_CONSOLE.confirmDelete(employee.name))) return;
    setBusy("delete");
    setSelectedEmployeeId(employee.id);
    try {
      const response = await fetch(`/api/face/employees/${encodeURIComponent(employee.id)}`, { method: "DELETE" });
      const data = await response.json() as { message?: string };
      if (!response.ok) throw new Error(data.message || FACE_CONSOLE.deleteFailed);
      setMessage({ kind: "success", title: FACE_CONSOLE.deleted, detail: FACE_CONSOLE.deletedDetail(employee.name) });
      await loadRegistrations();
    } catch (error) {
      setMessage({ kind: "error", title: FACE_CONSOLE.deleteSampleFailed, detail: error instanceof Error ? error.message : FACE_CONSOLE.tryAgain });
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="face-test-page">
      <section className="face-test-workspace">
        <article className="face-test-camera-card" ref={cameraCardRef}>
          <header><div><span>{FACE_CONSOLE.liveCamera}</span><h2>{selectedEmployee ? FACE_CONSOLE.recognizing(selectedEmployee.name) : FACE_CONSOLE.frameLabel}</h2></div><p className={cameraOn ? "is-on" : ""}><i />{cameraOn ? FACE_CONSOLE.cameraOn : FACE_CONSOLE.cameraOff}</p></header>
          <div ref={viewportRef} className={`face-test-viewport ${cameraOn ? "is-active" : ""}`}>
            <video ref={videoRef} autoPlay muted playsInline />
            {!cameraOn && <div className="face-test-empty"><span>◎</span><strong>{FACE_CONSOLE.cameraNotOpen}</strong><small>{FACE_CONSOLE.chooseToStart}</small></div>}
            {cameraOn && <><div className={`face-test-tracker ${faceBox ? "is-tracking" : "is-searching"}`} style={faceBox ? { left: faceBox.left, top: faceBox.top, width: faceBox.width, height: faceBox.height } : undefined}><div className="face-test-frame"><i /><i /><i /><i /></div><div className="face-test-camera-status"><span className={message ? `is-${message.kind}` : busy || pendingAction ? "is-busy" : faceBox ? "is-ready" : ""}>{message?.kind === "success" ? "✓" : message?.kind === "error" ? "×" : busy || pendingAction ? "◎" : faceBox ? "✓" : "◎"}</span><div><strong>{message?.title || (busy === "enroll" ? FACE_CONSOLE.savingFace : busy === "verify" ? FACE_CONSOLE.verifying : pendingAction && faceBox ? FACE_CONSOLE.holdStill : pendingAction ? FACE_CONSOLE.searchingFace : faceBox ? FACE_CONSOLE.faceFound : FACE_CONSOLE.searchingFace)}</strong><small>{message?.detail || (pendingAction && faceBox ? FACE_CONSOLE.autoCapture : pendingAction ? FACE_CONSOLE.bringFace : faceBox ? FACE_CONSOLE.tracking : FACE_CONSOLE.moveIntoFrame)}</small></div></div></div><div className="face-test-scan" /></>}
            <span className="face-test-secure">{FACE_CONSOLE.secureProxy}</span>
          </div>
          <div className="face-test-actions face-test-camera-actions" aria-label={FACE_CONSOLE.actionsTitle}>
            <button type="button" className="face-test-enroll" disabled={Boolean(busy) || Boolean(pendingAction) || !selectedEmployee} onClick={() => void submitFace("enroll")}><span>{selectedRegistered ? "↻" : "＋"}</span><div><strong>{busy === "enroll" ? FACE_CONSOLE.processing : pendingAction === "enroll" ? FACE_CONSOLE.autoSearching : selectedRegistered ? FACE_CONSOLE.updateFace : FACE_CONSOLE.enrollFace}</strong><small>{cameraOn ? FACE_CONSOLE.enrollHint : FACE_CONSOLE.cameraAutoOpen}</small></div></button>
            <button type="button" className="face-test-verify" disabled={Boolean(busy) || Boolean(pendingAction) || !selectedRegistered} onClick={() => void submitFace("verify")}><span>✓</span><div><strong>{busy === "verify" ? FACE_CONSOLE.verifyingEllipsis : pendingAction === "verify" ? FACE_CONSOLE.autoSearching : FACE_CONSOLE.verifyFace}</strong><small>{selectedRegistered ? FACE_CONSOLE.verifyHint : FACE_CONSOLE.enrollFirst}</small></div></button>
          </div>
          <footer><div><span>{FACE_CONSOLE.qualityTitle}</span><p>{FACE_CONSOLE.qualityText}</p></div><button type="button" className={cameraOn ? "is-stop" : ""} onClick={cameraOn ? stopCamera : () => void startCamera()}>{cameraOn ? FACE_CONSOLE.stopCamera : FACE_CONSOLE.startCamera}</button></footer>
        </article>

        <aside className="face-test-controls">
          <div className="face-test-server">
            <div className={`face-test-server-icon is-${serverState}`}>◉</div>
            <div><span>{FACE_CONSOLE.serverTitle}</span><strong>{serverState === "online" ? FACE_CONSOLE.connected : serverState === "checking" ? FACE_CONSOLE.checking : FACE_CONSOLE.disconnected}</strong><small>{serverState === "online" ? FACE_CONSOLE.enrolledCount(registrations.length) : serverState === "offline" ? serverError : FACE_CONSOLE.protectedNote}</small></div>
            <button type="button" onClick={loadRegistrations} aria-label={FACE_CONSOLE.recheckServer}>↻</button>
          </div>
          <div className="face-test-selection-grid">
            <label className="face-test-field"><span>{FACE_CONSOLE.branch}</span><select value={selectedBranchKey} onChange={(event) => changeBranch(event.target.value)}><option value="">{FACE_CONSOLE.chooseBranch}</option>{branchOptions.map((branch) => <option key={branch.key} value={branch.key}>{branch.name} · {branch.count} {FACE_CONSOLE.employeesSuffix}</option>)}</select></label>
            <label className="face-test-field"><span>{FACE_CONSOLE.branchEmployees}</span><select value={selectedEmployeeId} disabled={!selectedBranchKey} onChange={(event) => { setSelectedEmployeeId(event.target.value); setPendingAction(""); setMessage(null); }}><option value="">{selectedBranchKey ? FACE_CONSOLE.chooseEmployee : FACE_CONSOLE.chooseBranchFirst}</option>{selectableEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} · {roleLabel(employee.role)}</option>)}</select></label>
          </div>
          {selectedEmployee && <div className="face-test-selected"><span className="face-test-person-avatar">{selectedEmployee.name.charAt(0).toUpperCase()}</span><div><strong>{selectedEmployee.name}</strong><small>{roleLabel(selectedEmployee.role)} · {selectedEmployee.branch || FACE_CONSOLE.noBranch}</small></div><em className={selectedRegistered ? "is-registered" : ""}>{selectedRegistered ? FACE_CONSOLE.enrolled : FACE_CONSOLE.notEnrolled}</em></div>}
          <div className="face-test-privacy"><span>⚿</span><p><strong>{FACE_CONSOLE.securityTitle}</strong><small>{FACE_CONSOLE.securityText}</small></p></div>
        </aside>
      </section>

      {message && !cameraOn && <section className={`face-test-result is-${message.kind}`} role="status"><span>{message.kind === "success" ? "✓" : "!"}</span><div><strong>{message.title}</strong><p>{message.detail}</p></div>{typeof message.confidence === "number" && <dl><div><dt>{FACE_CONSOLE.confidence}</dt><dd>{Math.round(message.confidence * 100)}%</dd></div><div><dt>{FACE_CONSOLE.distance}</dt><dd>{message.distance?.toFixed(4) ?? "—"}</dd></div></dl>}</section>}

      <section className="face-test-directory">
        <header><div><span>{FACE_CONSOLE.manageTitlePrefix}{scopeLabel}</span><h2>{FACE_CONSOLE.employeeList}</h2><p>{branchEmployees.length} {FACE_CONSOLE.recordsInBranch}{branchEmployees.filter((employee) => registeredIds.has(employee.id)).length} {FACE_CONSOLE.enrolledSuffix}</p></div><div className="face-test-directory-filters"><label><span>⌕</span><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={FACE_CONSOLE.searchPlaceholder} /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">{FACE_CONSOLE.allStatuses}</option><option value="registered">{FACE_CONSOLE.enrolled}</option><option value="missing">{FACE_CONSOLE.notEnrolled}</option></select></div></header>
        <div className="face-test-table-wrap"><table><thead><tr><th>{FACE_CONSOLE.employee}</th><th>{FACE_CONSOLE.role}</th><th>{FACE_CONSOLE.branch}</th><th>{FACE_CONSOLE.faceStatus}</th><th>{FACE_CONSOLE.lastUpdate}</th><th>{FACE_CONSOLE.actions}</th></tr></thead><tbody>{visibleEmployees.map((employee) => { const registration = registrations.find((item) => item.employee_id === employee.id); return <tr key={employee.id} className={selectedEmployeeId === employee.id ? "is-selected" : ""}><td><span className="face-test-person-avatar">{employee.name.charAt(0).toUpperCase()}</span><div><strong>{employee.name}</strong><small>{employee.active ? FACE_CONSOLE.active : FACE_CONSOLE.disabled}</small></div></td><td>{roleLabel(employee.role)}</td><td>{employee.branch || FACE_CONSOLE.noBranch}</td><td><em className={registration ? "is-registered" : ""}><i />{registration ? FACE_CONSOLE.enrolled : FACE_CONSOLE.notEnrolled}</em></td><td>{registration ? formatTimestamp(registration.updated_at) : "—"}</td><td><div className="face-test-row-actions"><button type="button" onClick={() => void startCamera(employee)}>{registration ? FACE_CONSOLE.update : FACE_CONSOLE.enroll}</button>{registration && <button type="button" className="is-delete" disabled={Boolean(busy)} onClick={() => void deleteRegistration(employee)}>{FACE_CONSOLE.delete}</button>}</div></td></tr>; })}</tbody></table>{!visibleEmployees.length && <div className="face-test-no-results">{FACE_CONSOLE.noMatch}</div>}</div>
      </section>

      <section className="face-test-guide"><header><span>{FACE_CONSOLE.processEyebrow}</span><h2>{FACE_CONSOLE.processTitle}</h2></header><div><article><i>01</i><span><strong>{FACE_CONSOLE.chooseEmployee}</strong><small>{FACE_CONSOLE.step1Text}</small></span></article><article><i>02</i><span><strong>{FACE_CONSOLE.step2Title}</strong><small>{FACE_CONSOLE.step2Text}</small></span></article><article><i>03</i><span><strong>{FACE_CONSOLE.step3Title}</strong><small>{FACE_CONSOLE.step3Text}</small></span></article></div></section>
    </div>
  );
}

function captureFrame(video: HTMLVideoElement, maxWidth = 1280, quality = 0.88) {
  if (!video.videoWidth || !video.videoHeight) throw new Error(FACE_CONSOLE.frameNotReady);
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, maxWidth / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error(FACE_CONSOLE.captureUnsupported);
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

function updateFaceTestBox(area: FacialArea, video: HTMLVideoElement, viewport: HTMLDivElement | null, update: (box: FaceBox) => void) {
  if (!viewport || !area.w || !area.h) return;
  const sourceWidth = area.image_width || video.videoWidth;
  const sourceHeight = area.image_height || video.videoHeight;
  if (!sourceWidth || !sourceHeight) return;
  update(mapSquareFaceBox({ x: area.x || 0, y: area.y || 0, width: area.w, height: area.h }, sourceWidth, sourceHeight, viewport.clientWidth, viewport.clientHeight, false));
}

function mapSquareFaceBox(rect: { x: number; y: number; width: number; height: number }, sourceWidth: number, sourceHeight: number, viewportWidth: number, viewportHeight: number, mirrored: boolean): FaceBox {
  const scale = Math.max(viewportWidth / sourceWidth, viewportHeight / sourceHeight);
  const offsetX = (viewportWidth - sourceWidth * scale) / 2;
  const offsetY = (viewportHeight - sourceHeight * scale) / 2;
  const sourceX = mirrored ? sourceWidth - rect.x - rect.width : rect.x;
  const centerX = offsetX + (sourceX + rect.width / 2) * scale;
  const centerY = offsetY + (rect.y + rect.height / 2) * scale;
  const side = Math.min(viewportWidth - 20, viewportHeight - 80, Math.max(rect.width * scale * 1.55, rect.height * scale * 1.3));
  return {
    left: clamp(centerX - side / 2, 10, viewportWidth - side - 10),
    top: clamp(centerY - side / 2, 10, viewportHeight - side - 68),
    width: side,
    height: side,
  };
}
function clamp(value: number, minimum: number, maximum: number) { return Math.max(minimum, Math.min(Math.max(minimum, maximum), value)); }

function employeeBranchKey(employee: Pick<Employee, "branchId" | "branch">) {
  return employee.branchId || `branch:${employee.branch.trim().toLocaleLowerCase("vi-VN") || "unassigned"}`;
}

function formatTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(timestamp * 1000));
}
