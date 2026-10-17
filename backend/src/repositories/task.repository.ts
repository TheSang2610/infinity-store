import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { workTaskReports, workTasks } from "../db/schema";
import type { AdminUser, WorkReport, WorkTask } from "../types";

/** Viec can duyet len dau, roi dang lam, roi moi giao, roi da xong. */
const STATUS_ORDER = sql`CASE ${workTasks.status} WHEN 'review' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'assigned' THEN 2 ELSE 3 END`;

export async function createWorkTask(input: Omit<WorkTask, "id" | "status" | "createdAt" | "updatedAt">) {
  const now = Date.now();
  const id = randomUUID();
  await getDb().insert(workTasks).values({
    id,
    title: clean(input.title, 160),
    description: clean(input.description, 3000),
    priority: normalizePriority(input.priority),
    dueDate: cleanDate(input.dueDate),
    status: "assigned",
    branchId: input.branchId,
    branchName: clean(input.branchName, 140),
    assignedTo: input.assignedTo,
    assignedName: clean(input.assignedName, 120),
    createdBy: input.createdBy,
    createdByName: clean(input.createdByName, 120),
    attachmentKey: input.attachmentKey,
    attachmentName: clean(input.attachmentName, 180),
    attachmentType: clean(input.attachmentType, 100),
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

/** Giam doc thay het; quan ly thay viec cua chi nhanh minh; nhan vien chi thay viec duoc giao. */
export async function getWorkTasks(user: AdminUser) {
  const scope = user.role === "owner"
    ? undefined
    : user.role === "manager"
      ? or(
        eq(workTasks.branchId, user.branchId),
        and(eq(workTasks.branchId, ""), sql`lower(${workTasks.branchName}) = lower(${user.branch})`),
        eq(workTasks.assignedTo, user.id),
      )
      : eq(workTasks.assignedTo, user.id);
  return getDb().select().from(workTasks).where(scope).orderBy(STATUS_ORDER, workTasks.dueDate, desc(workTasks.createdAt));
}

export async function getWorkTask(id: string): Promise<WorkTask | undefined> {
  const [row] = await getDb().select().from(workTasks).where(eq(workTasks.id, id)).limit(1);
  return row;
}

export function canAccessTask(user: AdminUser, task: WorkTask) {
  if (user.role === "owner") return true;
  if (user.role === "manager") {
    return task.branchId === user.branchId
      || (!task.branchId && normalize(task.branchName) === normalize(user.branch))
      || task.assignedTo === user.id;
  }
  return task.assignedTo === user.id;
}

/** Bao cao tien do; 100% hoac chu dong gui duyet thi chuyen sang "cho duyet". */
export async function addWorkReport(input: Omit<WorkReport, "id" | "createdAt"> & { taskStatus: string }) {
  const now = Date.now();
  const progress = Math.min(100, Math.max(0, Math.round(input.progress)));
  const status = input.taskStatus === "review" || progress >= 100 ? "review" : "in_progress";
  await getDb().transaction(async (tx) => {
    await tx.insert(workTaskReports).values({
      id: randomUUID(),
      taskId: input.taskId,
      authorId: input.authorId,
      authorName: clean(input.authorName, 120),
      message: clean(input.message, 3000),
      progress,
      attachmentKey: input.attachmentKey,
      attachmentName: clean(input.attachmentName, 180),
      attachmentType: clean(input.attachmentType, 100),
      createdAt: now,
    });
    await tx.update(workTasks).set({ status, updatedAt: now }).where(eq(workTasks.id, input.taskId));
  });
}

export async function completeWorkTask(id: string) {
  await getDb().update(workTasks).set({ status: "completed", updatedAt: Date.now() }).where(eq(workTasks.id, id));
}

export async function getWorkReports(taskIds: string[]): Promise<WorkReport[]> {
  if (!taskIds.length) return [];
  return getDb().select().from(workTaskReports).where(inArray(workTaskReports.taskId, taskIds)).orderBy(desc(workTaskReports.createdAt));
}

/** Tep dinh kem cua viec hoac cua bao cao, kem viec goc de kiem quyen xem. */
export async function getTaskFile(kind: "task" | "report", id: string) {
  if (kind === "task") {
    const task = await getWorkTask(id);
    return task ? { task, key: task.attachmentKey, name: task.attachmentName, type: task.attachmentType } : undefined;
  }
  const [report] = await getDb().select().from(workTaskReports).where(eq(workTaskReports.id, id)).limit(1);
  const task = report ? await getWorkTask(report.taskId) : undefined;
  return report && task ? { task, key: report.attachmentKey, name: report.attachmentName, type: report.attachmentType } : undefined;
}

function clean(value: string, max: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}
function cleanDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}
function normalizePriority(value: string) {
  return value === "urgent" || value === "high" || value === "low" ? value : "normal";
}
function normalize(value: string) {
  return value.trim().toLocaleLowerCase("vi-VN");
}
