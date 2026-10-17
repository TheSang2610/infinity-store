import type { Request, Response } from "express";
import { getPublicStoreSettings, getStoreSettings, updateStoreSettings } from "../services/store-settings.service";

/** Thong tin cong khai cho footer, trang thanh toan, hoa don. */
export async function getPublicSettings(_req: Request, res: Response) {
  res.set("Cache-Control", "public, max-age=60").json({ settings: await getPublicStoreSettings() });
}

export async function getSettings(_req: Request, res: Response) {
  res.set("Cache-Control", "private, no-store").json({ settings: await getStoreSettings() });
}

export async function saveSettings(req: Request, res: Response) {
  res.json({ ok: true, settings: await updateStoreSettings(req.body?.settings, req.admin!.id) });
}
