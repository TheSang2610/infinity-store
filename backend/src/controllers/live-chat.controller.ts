import type { Request, Response } from "express";
import { badRequest, forbidden, notFound } from "../utils/http";
import type { AdminUser } from "../types";
import { getBranches } from "../repositories/branch.repository";
import {
  addLiveMessage, createLiveConversation, customerConversation, getAdminConversation, getAdminConversations,
  getLiveMessages, updateLiveConversation,
} from "../repositories/live-chat.repository";

const clean = (value: unknown, max = 500) =>
  String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

function branchScope(admin: AdminUser) {
  if (admin.role === "owner") return "";
  if (!admin.branchId) throw forbidden("Tài khoản chưa được cấp quyền tư vấn chi nhánh.");
  return admin.branchId;
}

export async function handleCustomerAction(req: Request, res: Response) {
  const body = (req.body ?? {}) as Record<string, unknown>;
  if (body.action === "start") {
    const name = clean(body.name, 80);
    const phone = clean(body.phone, 20);
    if (name.length < 2 || !/^0\d{8,10}$/.test(phone)) throw badRequest("Tên hoặc số điện thoại chưa hợp lệ.");
    const branch = (await getBranches(false)).find((item) => item.id === clean(body.branchId, 50));
    if (!branch) throw badRequest("Vui lòng chọn một chi nhánh đang hoạt động.");
    const chat = await createLiveConversation(name, phone, { id: branch.id, name: branch.name });
    await addLiveMessage(chat.id, "system", "Hệ thống", `${name} yêu cầu tư vấn tại ${branch.name}.`);
    res.json({ ...chat, branchName: branch.name });
    return;
  }
  const id = clean(body.conversationId, 50);
  const chat = await customerConversation(id, clean(body.token, 50));
  if (!chat) throw forbidden("Phiên chat không hợp lệ.");
  const message = clean(body.text);
  if (!message) throw badRequest("Tin nhắn trống.");
  await addLiveMessage(id, "customer", chat.customerName, message);
  res.json({ ok: true });
}

export async function getCustomerConversation(req: Request, res: Response) {
  if (req.query.branches === "1") {
    const branches = await getBranches(false).catch(() => []);
    res.set("Cache-Control", "public, max-age=60")
      .json({ branches: branches.map(({ id, name, address, hours }) => ({ id, name, address, hours })) });
    return;
  }
  const id = clean(req.query.conversationId, 50);
  const chat = await customerConversation(id, clean(req.query.token, 50)).catch(() => undefined);
  if (!chat) throw forbidden("Phiên chat không hợp lệ.");
  res.set("Cache-Control", "no-store").json({
    conversation: { status: chat.status, customerName: chat.customerName, branchName: chat.branchName },
    messages: await getLiveMessages(id, Number(req.query.after) || 0),
  });
}

export async function getAdminInbox(req: Request, res: Response) {
  const scope = branchScope(req.admin!);
  const id = clean(req.query.conversationId, 50);
  if (!id) {
    res.json({ conversations: await getAdminConversations(scope) });
    return;
  }
  const chat = await getAdminConversation(id, scope);
  if (!chat) throw notFound("Không tìm thấy hội thoại trong chi nhánh được phép.");
  const { token: _token, ...conversation } = chat;
  res.set("Cache-Control", "no-store").json({ conversation, messages: await getLiveMessages(id) });
}

export async function handleAdminAction(req: Request, res: Response) {
  const admin = req.admin!;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const id = clean(body.conversationId, 50);
  const chat = await getAdminConversation(id, branchScope(admin));
  if (!chat) throw notFound("Không tìm thấy hội thoại trong chi nhánh được phép.");
  if (clean(body.action, 20) === "status") {
    const status = clean(body.status, 20);
    if (!["waiting", "active", "closed"].includes(status)) throw badRequest("Trạng thái không hợp lệ.");
    await updateLiveConversation(id, status, admin.name);
    res.json({ ok: true });
    return;
  }
  const message = clean(body.text);
  if (!message) throw badRequest("Tin nhắn trống.");
  await updateLiveConversation(id, "active", admin.name);
  await addLiveMessage(id, "admin", admin.name, message);
  res.json({ ok: true });
}
