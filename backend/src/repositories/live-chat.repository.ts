import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { liveChatConversations, liveChatMessages } from "../db/schema";
import type { LiveConversation, LiveMessage } from "../types";

type ConversationRow = typeof liveChatConversations.$inferSelect;

export async function createLiveConversation(customerName: string, phone: string, branch: { id: string; name: string }) {
  const id = randomUUID();
  const token = randomUUID();
  const now = Date.now();
  await getDb().insert(liveChatConversations).values({
    id, customerName, phone, token, status: "waiting", branchId: branch.id, branchName: branch.name, createdAt: now, updatedAt: now,
  });
  return { id, token };
}

/** Khach chi doc duoc cuoc chat khi co dung token cap luc mo. */
export async function customerConversation(id: string, token: string) {
  const [row] = await getDb().select().from(liveChatConversations)
    .where(and(eq(liveChatConversations.id, id), eq(liveChatConversations.token, token))).limit(1);
  return row ? toConversation(row) : undefined;
}

export async function addLiveMessage(conversationId: string, sender: "customer" | "admin" | "system", senderName: string, text: string) {
  const now = Date.now();
  await getDb().transaction(async (tx) => {
    await tx.insert(liveChatMessages).values({ id: randomUUID(), conversationId, sender, senderName, text, createdAt: now });
    await tx.update(liveChatConversations).set({
      updatedAt: now,
      status: sql`CASE WHEN ${liveChatConversations.status} = 'closed' THEN 'active' ELSE ${liveChatConversations.status} END`,
    }).where(eq(liveChatConversations.id, conversationId));
  });
}

export async function getLiveMessages(conversationId: string, after = 0): Promise<LiveMessage[]> {
  return getDb().select().from(liveChatMessages)
    .where(and(eq(liveChatMessages.conversationId, conversationId), gt(liveChatMessages.createdAt, after)))
    .orderBy(asc(liveChatMessages.createdAt)).limit(200);
}

/** Danh sach cho nhan vien: cuoc dang cho len dau; khong tra token cua khach. */
export async function getAdminConversations(branchId = "") {
  const lastMessage = sql<string>`(SELECT m.text FROM ${liveChatMessages} m WHERE m.conversation_id = ${liveChatConversations.id} ORDER BY m.created_at DESC LIMIT 1)`;
  const rows = await getDb().select({ conversation: liveChatConversations, lastMessage }).from(liveChatConversations)
    .where(branchId ? eq(liveChatConversations.branchId, branchId) : undefined)
    .orderBy(sql`CASE ${liveChatConversations.status} WHEN 'waiting' THEN 0 WHEN 'active' THEN 1 ELSE 2 END`, desc(liveChatConversations.updatedAt))
    .limit(100);
  return rows.map(({ conversation, lastMessage: text }) => {
    const { token: _token, ...rest } = toConversation(conversation);
    return { ...rest, lastMessage: text ?? "" };
  });
}

export async function getAdminConversation(id: string, branchId = "") {
  const [row] = await getDb().select().from(liveChatConversations)
    .where(branchId ? and(eq(liveChatConversations.id, id), eq(liveChatConversations.branchId, branchId)) : eq(liveChatConversations.id, id))
    .limit(1);
  return row ? toConversation(row) : undefined;
}

export async function updateLiveConversation(id: string, status: string, assignedAdmin: string) {
  await getDb().update(liveChatConversations).set({ status, assignedAdmin, updatedAt: Date.now() }).where(eq(liveChatConversations.id, id));
}

function toConversation(row: ConversationRow): LiveConversation {
  return { ...row, lastMessage: "", unread: 0 };
}
