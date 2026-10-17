// Tu bat may chu nhan dien khuon mat (python-ai/) khi nhan vien / quan ly can dung, tu tat khi bo khong.
// Chi chay khi FACE_API_URL tro ve chinh may nay va da cai python-ai/.venv (xem python-ai/README.md).
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { env } from "../config/env";
import { HttpError } from "../utils/http";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);
const HEALTH_TIMEOUT_MS = 1_500;
const START_TIMEOUT_MS = 180_000;
// Proxy /api cua Next.js cat request sau 30 giay: chi doi trong request mot luc, phan con lai chay nen.
const REQUEST_WAIT_MS = 25_000;

const HEALTH_CACHE_MS = 15_000;

let child: ChildProcess | null = null;
let lastHealthyAt = 0;
let starting: Promise<void> | null = null;

function serverDir() {
  return env.faceServerDir || path.resolve(__dirname, "../../../python-ai");
}

function pythonPath() {
  const venv = path.join(serverDir(), ".venv");
  return process.platform === "win32" ? path.join(venv, "Scripts", "python.exe") : path.join(venv, "bin", "python");
}

function localTarget(): URL | null {
  if (!env.faceAutostart || !env.faceApiUrl) return null;
  try {
    const url = new URL(env.faceApiUrl);
    return LOCAL_HOSTS.has(url.hostname) ? url : null;
  } catch {
    return null;
  }
}

async function isHealthy(url: URL) {
  try {
    const response = await fetch(new URL("/health", url), { signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS) });
    return response.ok;
  } catch {
    return false;
  }
}

function stopChild(reason: string) {
  if (!child) return;
  console.log(`[face] Tắt máy chủ khuôn mặt (${reason}).`);
  child.kill();
  child = null;
}

async function launch(url: URL) {
  const python = pythonPath();
  if (!existsSync(python)) {
    throw new HttpError(503, "Máy chủ khuôn mặt chưa được cài trên máy này (xem python-ai/README.md).");
  }
  console.log("[face] Đang bật máy chủ khuôn mặt...");
  const port = url.port || "8001";
  const host = url.hostname === "localhost" ? "127.0.0.1" : url.hostname.replace(/^\[|\]$/g, "");
  const proc = spawn(python, ["-m", "uvicorn", "face_server:app", "--host", host, "--port", port], {
    cwd: serverDir(),
    // Server tu thoat khi ranh (ke ca khi backend nap lai va bo mo coi tien trinh nay).
    env: { ...process.env, PYTHONIOENCODING: "utf-8", FACE_IDLE_EXIT_MINUTES: String(env.faceIdleMinutes) },
    stdio: ["ignore", "ignore", "pipe"],
    windowsHide: true,
  });
  child = proc;
  let lastError = "";
  proc.stderr?.on("data", (chunk: Buffer) => {
    const line = chunk.toString("utf8").trim();
    if (/Traceback|Error/.test(line)) lastError = line.split("\n").slice(-1)[0];
  });
  proc.on("exit", (code) => {
    if (child === proc) child = null;
    if (code) console.log(`[face] Máy chủ khuôn mặt dừng (mã ${code}). ${lastError}`);
  });

  const deadline = Date.now() + START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child !== proc) throw new HttpError(503, `Máy chủ khuôn mặt không khởi động được. ${lastError}`.trim());
    if (await isHealthy(url)) {
      console.log("[face] Máy chủ khuôn mặt đã sẵn sàng.");
      lastHealthyAt = Date.now();
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  stopChild("khởi động quá lâu");
  throw new HttpError(503, "Máy chủ khuôn mặt khởi động quá lâu.");
}

/** Goi truoc moi yeu cau toi may chu khuon mat: dang tat thi bat len. */
export async function ensureFaceServer() {
  const url = localTarget();
  if (!url) return;
  // Camera goi lien tuc: vua thay server song thi khong hoi /health lai moi request.
  if (!starting && Date.now() - lastHealthyAt < HEALTH_CACHE_MS) return;
  if (!starting && await isHealthy(url)) {
    lastHealthyAt = Date.now();
    return;
  }
  lastHealthyAt = 0;
  starting ??= launch(url).finally(() => {
    starting = null;
  });
  const ready = starting.then(() => true);
  // Request da tra "dang khoi dong" ma sau do khoi dong loi: tranh unhandled rejection lam sap backend.
  ready.catch(() => undefined);
  const waited = await Promise.race([ready, new Promise<false>((resolve) => setTimeout(resolve, REQUEST_WAIT_MS, false))]);
  if (!waited) throw new HttpError(503, "Máy chủ khuôn mặt đang khởi động, vui lòng thử lại sau ít giây.");
}

// Backend tat (Ctrl+C, tsx watch nap lai) thi tat luon may chu khuon mat da tu bat.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    stopChild("backend dừng");
    process.exit(0);
  });
}
process.once("exit", () => stopChild("backend dừng"));
