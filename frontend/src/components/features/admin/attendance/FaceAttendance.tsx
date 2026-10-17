"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FACE_ATTENDANCE } from "@/src/constants/admin/components";

type ScanMode = "in" | "out" | "";
type ScanStatus = "idle" | "opening" | "searching" | "verifying" | "success" | "error";
type FaceBox = { left: number; top: number; width: number; height: number };
type FacialArea = { x?: number; y?: number; w?: number; h?: number; image_width?: number; image_height?: number };
type BrowserFaceDetector = { detect(source: HTMLVideoElement): Promise<Array<{ boundingBox: { x: number; y: number; width: number; height: number } }>> };

const AUTO_SCAN_DELAY = 850;
const AUTO_SCAN_INTERVAL = 2300;
const FACE_SERVER_RETRY_MS = 5000;
const FACE_SERVER_MAX_RETRIES = 36;

export default function FaceAttendance({ checkedIn, checkedOut }: { checkedIn: boolean; checkedOut: boolean }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestInFlightRef = useRef(false);
  const autoStartedRef = useRef(false);
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const detectorAvailableRef = useRef(false);
  const facePresentRef = useRef(false);
  const lastFaceSeenRef = useRef(0);
  const [registered, setRegistered] = useState<boolean | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>("");
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [overlayText, setOverlayText] = useState<string>(FACE_ATTENDANCE.centerFace);
  const [message, setMessage] = useState("");
  const [faceBox, setFaceBox] = useState<FaceBox | null>(null);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const stopCamera = useCallback(() => {
    if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
    completionTimerRef.current = null;
    requestInFlightRef.current = false;
    releaseStream();
    setCameraOn(false);
    setScanMode("");
    setScanStatus("idle");
    setOverlayText(FACE_ATTENDANCE.centerFace);
    setFaceBox(null);
    facePresentRef.current = false;
  }, [releaseStream]);

  const startCamera = useCallback(async (mode: Exclude<ScanMode, "">) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage(FACE_ATTENDANCE.cameraUnsupported);
      setScanStatus("error");
      return;
    }

    if (mode === "in" && checkedIn) return;
    if (mode === "out" && (!checkedIn || checkedOut)) return;

    try {
      releaseStream();
      requestInFlightRef.current = false;
      setMessage("");
      setFaceBox(null);
      facePresentRef.current = false;
      setScanMode(mode);
      setScanStatus("opening");
      setOverlayText(FACE_ATTENDANCE.openingCamera);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1440 } },
      });
      streamRef.current = stream;
      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraOn(true);
      setScanStatus("searching");
      setOverlayText(mode === "in" ? FACE_ATTENDANCE.scanningCheckIn : FACE_ATTENDANCE.scanningCheckOut);
    } catch (error) {
      releaseStream();
      setCameraOn(false);
      setScanMode("");
      setScanStatus("error");
      setOverlayText(FACE_ATTENDANCE.cameraFailed);
      setMessage(error instanceof Error ? error.message : FACE_ATTENDANCE.allowCameraRetry);
    }
  }, [checkedIn, checkedOut, releaseStream]);

  const scanFace = useCallback(async (mode: Exclude<ScanMode, "">) => {
    const video = videoRef.current;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || requestInFlightRef.current) return;
    if (detectorAvailableRef.current && (!facePresentRef.current || Date.now() - lastFaceSeenRef.current > 1400)) {
      setScanStatus("searching");
      setOverlayText(FACE_ATTENDANCE.searchingFace);
      return;
    }

    requestInFlightRef.current = true;
    setScanStatus("verifying");
    setOverlayText(FACE_ATTENDANCE.faceFound);
    try {
      const imageBase64 = captureFrame(video);
      const response = await fetch("/api/face/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, image_base64: imageBase64 }),
      });
      const data = await response.json().catch(() => ({})) as { verified?: boolean; message?: string; error?: string; facial_area?: FacialArea };
      if (data.facial_area) updateBoxFromArea(data.facial_area, video, cameraRef.current, setFaceBox);

      if (!response.ok) {
        const errorMessage = data.message || data.error || FACE_ATTENDANCE.faceNotDetected;
        setScanStatus("error");
        setOverlayText(response.status === 401 ? FACE_ATTENDANCE.faceMismatch : errorMessage);
        setMessage(response.status === 409 ? errorMessage : FACE_ATTENDANCE.stillScanning);
        if (response.status === 409) {
          setScanMode("");
          completionTimerRef.current = setTimeout(() => {
            releaseStream();
            setCameraOn(false);
            router.refresh();
          }, 1200);
        }
        return;
      }

      setScanStatus("success");
      setOverlayText(mode === "in" ? FACE_ATTENDANCE.checkInSuccess : FACE_ATTENDANCE.checkOutSuccess);
      setMessage(mode === "in" ? FACE_ATTENDANCE.checkInRecorded : FACE_ATTENDANCE.checkOutRecorded);
      setScanMode("");
      completionTimerRef.current = setTimeout(() => {
        releaseStream();
        setCameraOn(false);
        router.refresh();
      }, 1500);
    } catch (error) {
      setScanStatus("error");
      setOverlayText(FACE_ATTENDANCE.connectionLost);
      setMessage(error instanceof Error ? error.message : FACE_ATTENDANCE.autoRetry);
    } finally {
      requestInFlightRef.current = false;
    }
  }, [releaseStream, router]);

  useEffect(() => {
    if (!cameraOn) return;
    const Detector = (window as unknown as { FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => BrowserFaceDetector }).FaceDetector;
    if (!Detector) {
      detectorAvailableRef.current = false;
      return;
    }
    detectorAvailableRef.current = true;
    const detector = new Detector({ fastMode: true, maxDetectedFaces: 1 });
    let active = true;
    let detecting = false;
    let misses = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const track = async () => {
      const video = videoRef.current;
      const camera = cameraRef.current;
      if (!active || !video || !camera || detecting || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        if (active) timer = setTimeout(track, 180);
        return;
      }
      detecting = true;
      try {
        const faces = await detector.detect(video);
        if (faces[0]) {
          misses = 0;
          facePresentRef.current = true;
          lastFaceSeenRef.current = Date.now();
          setFaceBox(mapFaceBox(faces[0].boundingBox, video.videoWidth, video.videoHeight, camera.clientWidth, camera.clientHeight, true));
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
    let active = true;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    // 503 = may chu khuon mat dang tu khoi dong (backend bat no khi co nguoi can): thu lai, toi da ~3 phut.
    const check = (attempt: number) => fetch("/api/face/attendance", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({})) as { registered?: boolean; message?: string };
        if (response.status === 503 && attempt < FACE_SERVER_MAX_RETRIES) {
          if (active) {
            setMessage(data.message || FACE_ATTENDANCE.faceCheckFailed);
            retryTimer = setTimeout(() => void check(attempt + 1), FACE_SERVER_RETRY_MS);
          }
          return;
        }
        if (!response.ok) throw new Error(data.message || FACE_ATTENDANCE.faceCheckFailed);
        if (active) {
          setMessage("");
          setRegistered(Boolean(data.registered));
        }
      })
      .catch((error) => {
        if (active) {
          setRegistered(false);
          setMessage(error instanceof Error ? error.message : FACE_ATTENDANCE.faceCheckFailed);
        }
      });
    void check(0);
    return () => { active = false; if (retryTimer) clearTimeout(retryTimer); };
  }, []);

  useEffect(() => {
    if (registered !== true || checkedIn || checkedOut || cameraOn || scanMode || autoStartedRef.current) return;
    autoStartedRef.current = true;
    const timer = setTimeout(() => void startCamera("in"), 350);
    return () => clearTimeout(timer);
  }, [cameraOn, checkedIn, checkedOut, registered, scanMode, startCamera]);

  useEffect(() => {
    if (!cameraOn || !scanMode) return;
    const mode = scanMode;
    const firstScan = setTimeout(() => void scanFace(mode), AUTO_SCAN_DELAY);
    const interval = setInterval(() => void scanFace(mode), AUTO_SCAN_INTERVAL);
    return () => {
      clearTimeout(firstScan);
      clearInterval(interval);
    };
  }, [cameraOn, scanFace, scanMode]);

  useEffect(() => () => {
    if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const statusTitle = scanStatus === "opening"
    ? FACE_ATTENDANCE.starting
    : scanStatus === "verifying"
      ? FACE_ATTENDANCE.verifying
      : scanStatus === "success"
        ? FACE_ATTENDANCE.verified
        : scanStatus === "error"
          ? FACE_ATTENDANCE.verifyFailed
          : FACE_ATTENDANCE.autoScanning;

  return (
    <section className="admin-card face-attendance">
      <header className="face-attendance-heading">
        <div className="face-test-mark" aria-hidden="true"><span /><span /><span /><span /></div>
        <div><span>{FACE_ATTENDANCE.eyebrow}</span><h2>{FACE_ATTENDANCE.title}</h2><p>{FACE_ATTENDANCE.text}</p></div>
        <em className={registered ? "is-ready" : ""}>{registered === null ? FACE_ATTENDANCE.checking : registered ? FACE_ATTENDANCE.registered : FACE_ATTENDANCE.notRegistered}</em>
      </header>

      {registered === false ? <div className="face-attendance-missing"><span>!</span><div><strong>{FACE_ATTENDANCE.noFaceTitle}</strong><p>{FACE_ATTENDANCE.noFaceText}</p></div></div> : registered === true ? <>
        <div className="face-attendance-body">
          <div ref={cameraRef} className={`face-attendance-camera ${cameraOn ? "is-on is-scanning" : ""}`}>
            <video ref={videoRef} muted playsInline aria-label={FACE_ATTENDANCE.cameraLabel} />
            {!cameraOn && <div className="face-attendance-empty"><span>◎</span><strong>{checkedIn ? FACE_ATTENDANCE.readyCheckOut : FACE_ATTENDANCE.cameraWillOpen}</strong><small>{checkedIn ? FACE_ATTENDANCE.pressCheckOut : FACE_ATTENDANCE.allowCamera}</small></div>}
            {cameraOn && <><div className={`face-attendance-tracker ${faceBox ? "is-tracking" : "is-searching"}`} style={faceBox ? { left: faceBox.left, top: faceBox.top, width: faceBox.width, height: faceBox.height } : undefined}><div className="face-attendance-frame" aria-hidden="true"><i /><i /><i /><i /></div><div className={`face-attendance-live-status is-${scanStatus}`} role="status" aria-live="polite"><span aria-hidden="true">{scanStatus === "success" ? "✓" : scanStatus === "error" ? "×" : "◎"}</span><div><strong>{statusTitle}</strong><small>{overlayText}</small></div></div></div><b aria-hidden="true" /></>}
          </div>

          <div className="face-attendance-controls">
            <div><strong>{FACE_ATTENDANCE.autoScanTitle}</strong><p>{FACE_ATTENDANCE.autoScanText}</p></div>
            {cameraOn ? <button className="admin-button" type="button" onClick={stopCamera}>{FACE_ATTENDANCE.stopCamera}</button> : !checkedIn && <button className="admin-button" type="button" onClick={() => void startCamera("in")}>{FACE_ATTENDANCE.reopenCheckIn}</button>}
            <button className="face-attendance-in" type="button" disabled={checkedIn || cameraOn || scanStatus === "opening"} onClick={() => void startCamera("in")}><span>→</span><strong>{checkedIn ? FACE_ATTENDANCE.checkedIn : cameraOn && scanMode === "in" ? FACE_ATTENDANCE.scanning : FACE_ATTENDANCE.checkIn}</strong></button>
            <button className="face-attendance-out" type="button" disabled={!checkedIn || checkedOut || cameraOn || scanStatus === "opening"} onClick={() => void startCamera("out")}><span>←</span><strong>{checkedOut ? FACE_ATTENDANCE.checkedOut : cameraOn && scanMode === "out" ? FACE_ATTENDANCE.scanning : FACE_ATTENDANCE.checkOut}</strong></button>
            {message && !cameraOn && <p className={`face-attendance-message is-${scanStatus}`} role="status">{message}</p>}
          </div>
        </div>
        <footer><span>{FACE_ATTENDANCE.ruleOwnAccount}</span><span>{FACE_ATTENDANCE.ruleNoOthers}</span><span>{FACE_ATTENDANCE.ruleAutoRecord}</span></footer>
      </> : null}
    </section>
  );
}

function captureFrame(video: HTMLVideoElement) {
  const sourceWidth = video.videoWidth || 720;
  const sourceHeight = video.videoHeight || 960;
  const width = Math.min(sourceWidth, 960);
  const height = Math.round((sourceHeight / sourceWidth) * width);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error(FACE_ATTENDANCE.captureFailed);
  context.translate(width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.86);
}

function updateBoxFromArea(area: FacialArea, video: HTMLVideoElement, camera: HTMLDivElement | null, update: (box: FaceBox) => void) {
  if (!camera || !area.w || !area.h) return;
  const sourceWidth = area.image_width || video.videoWidth;
  const sourceHeight = area.image_height || video.videoHeight;
  if (!sourceWidth || !sourceHeight) return;
  update(mapFaceBox({ x: area.x || 0, y: area.y || 0, width: area.w, height: area.h }, sourceWidth, sourceHeight, camera.clientWidth, camera.clientHeight, false));
}

function mapFaceBox(rect: { x: number; y: number; width: number; height: number }, sourceWidth: number, sourceHeight: number, cameraWidth: number, cameraHeight: number, mirrored: boolean): FaceBox {
  const scale = Math.max(cameraWidth / sourceWidth, cameraHeight / sourceHeight);
  const offsetX = (cameraWidth - sourceWidth * scale) / 2;
  const offsetY = (cameraHeight - sourceHeight * scale) / 2;
  const sourceX = mirrored ? sourceWidth - rect.x - rect.width : rect.x;
  const centerX = offsetX + (sourceX + rect.width / 2) * scale;
  const centerY = offsetY + (rect.y + rect.height / 2) * scale;
  const side = Math.min(cameraWidth - 20, cameraHeight - 94, Math.max(rect.width * scale * 1.55, rect.height * scale * 1.32));
  const left = clamp(centerX - side / 2, 10, cameraWidth - side - 10);
  const top = clamp(centerY - side / 2, 10, cameraHeight - side - 78);
  return { left, top, width: side, height: side };
}
function clamp(value: number, minimum: number, maximum: number) { return Math.max(minimum, Math.min(Math.max(minimum, maximum), value)); }
