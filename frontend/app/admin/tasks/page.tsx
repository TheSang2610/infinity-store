import Link from "next/link";
import { requireAdminPage } from "@/src/services/admin-auth";
import { getAdminUsers, getWorkReports, getWorkTasks } from "@/src/services/data";

import { completeTaskAction, createTaskAction, reportTaskAction } from "@/src/actions/admin/tasks";
import { roleShortLabel } from "@/src/constants/shared/roles";
import { TASKS_PAGE } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  const [user, query] = await Promise.all([requireAdminPage("/admin/tasks"), searchParams]);
  const canAssign = user.role === "owner" || user.role === "manager";
  const [tasks, allUsers] = await Promise.all([getWorkTasks().catch(() => []), canAssign ? getAdminUsers().catch(() => []) : Promise.resolve([])]);
  const reports = await getWorkReports(tasks.map((task) => task.id)).catch(() => []);
  const assignees = allUsers.filter((item) => item.active && item.role !== "owner" && (user.role === "owner" || (item.branchId === user.branchId && item.role !== "manager")));
  const reportMap = new Map<string, typeof reports>();
  reports.forEach((report) => reportMap.set(report.taskId, [...(reportMap.get(report.taskId) || []), report]));
  const active = tasks.filter((task) => task.status !== "completed").length;
  const reviewing = tasks.filter((task) => task.status === "review").length;
  const overdue = tasks.filter((task) => task.status !== "completed" && task.dueDate && task.dueDate < today()).length;

  return <>
    <div className="admin-topline"><div><span>{TASKS_PAGE.workEyebrow}</span><h1>{TASKS_PAGE.title}</h1><p className="admin-subtitle">{user.role === "owner" ? TASKS_PAGE.ownerText : user.role === "manager" ? TASKS_PAGE.managerText(user.branch) : TASKS_PAGE.staffText}</p></div>{user.role !== "owner" && <Link className="admin-button" href={user.role === "manager" ? "/manager" : "/staff"}>{TASKS_PAGE.backToWork}</Link>}</div>
    {query.status === "created" && <p className="admin-alert success">{TASKS_PAGE.assigned}</p>}
    {query.status === "reported" && <p className="admin-alert success">{TASKS_PAGE.reported}</p>}
    {query.status === "completed" && <p className="admin-alert success">{TASKS_PAGE.completed}</p>}
    {query.error && <p className="admin-alert error">{query.error}</p>}

    <section className="work-task-kpis"><TaskMetric label={TASKS_PAGE.totalTasks} value={tasks.length} note={TASKS_PAGE.inProgressCount(active)} /><TaskMetric label={TASKS_PAGE.pendingReview} value={reviewing} note={TASKS_PAGE.pendingReviewNote} /><TaskMetric label={TASKS_PAGE.overdue} value={overdue} note={TASKS_PAGE.overdueNote} /></section>

    {canAssign && <section className="admin-card work-task-create">
      <div className="admin-card-head"><div><span>{TASKS_PAGE.newEyebrow}</span><h2>{TASKS_PAGE.taskInfo}</h2></div><small>{TASKS_PAGE.fileHint}</small></div>
      <form action={createTaskAction}>
        <label className="admin-field work-task-title"><span>{TASKS_PAGE.taskName}</span><input name="title" minLength={3} maxLength={160} placeholder={TASKS_PAGE.taskNamePlaceholder} required /></label>
        <label className="admin-field"><span>{TASKS_PAGE.assignee}</span><select name="assignedTo" required><option value="">{TASKS_PAGE.chooseEmployee}</option>{assignees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} · {roleShortLabel(employee.role)} · {employee.branch}</option>)}</select></label>
        <label className="admin-field"><span>{TASKS_PAGE.priority}</span><select name="priority" defaultValue="normal"><option value="low">{TASKS_PAGE.priorityLow}</option><option value="normal">{TASKS_PAGE.priorityNormal}</option><option value="high">Cao</option><option value="urgent">{TASKS_PAGE.priorityUrgent}</option></select></label>
        <label className="admin-field"><span>{TASKS_PAGE.deadline}</span><input type="date" name="dueDate" min={today()} /></label>
        <label className="admin-field work-task-description"><span>{TASKS_PAGE.description}</span><textarea name="description" rows={4} maxLength={3000} placeholder={TASKS_PAGE.descriptionPlaceholder} /></label>
        <label className="admin-field work-task-file"><span>{TASKS_PAGE.taskFile}</span><input type="file" name="attachment" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.jpg,.jpeg,.png,.webp" /><small>{TASKS_PAGE.taskFileHint}</small></label>
        <button className="admin-button admin-button-primary" type="submit">{TASKS_PAGE.assign}</button>
      </form>
    </section>}

    <section className="work-task-list">
      <div className="work-task-section-title"><div><span>{tasks.length} {TASKS_PAGE.tasksEyebrow}</span><h2>{canAssign ? TASKS_PAGE.trackTasks : TASKS_PAGE.myTasks}</h2></div></div>
      {tasks.map((task) => {
        const taskReports = reportMap.get(task.id) || [];
        return <article className={`admin-card work-task-card priority-${task.priority}`} key={task.id}>
          <header><div><span className={`work-task-priority priority-${task.priority}`}>{priorityLabel(task.priority)}</span><span className={`admin-badge work-status-${task.status}`}>{statusLabel(task.status)}</span></div><time>{task.dueDate ? TASKS_PAGE.dueOn(formatDate(task.dueDate)) : TASKS_PAGE.noDeadline}</time></header>
          <div className="work-task-main"><div><h3>{task.title}</h3><p>{task.description || TASKS_PAGE.noDescription}</p><div className="work-task-meta"><span>♙ <strong>{task.assignedName}</strong></span><span>⌂ {task.branchName || TASKS_PAGE.noBranch}</span><span>{TASKS_PAGE.assignedByPrefix}{task.createdByName}</span></div>{task.attachmentKey && <Link className="work-file-link" href={`/api/admin/task-files/task/${task.id}`}>{TASKS_PAGE.downloadPrefix}{task.attachmentName}</Link>}</div><strong className="work-task-progress">{taskReports[0]?.progress ?? 0}<small>%</small></strong></div>
          {taskReports.length > 0 && <section className="work-report-history"><h4>{TASKS_PAGE.latestReport}</h4>{taskReports.slice(0, 3).map((report) => <article key={report.id}><span>{report.authorName.slice(0, 1).toUpperCase()}</span><div><strong>{report.authorName}<small>{new Date(report.createdAt).toLocaleString("vi-VN")}</small></strong><p>{report.message}</p>{report.attachmentKey && <Link href={`/api/admin/task-files/report/${report.id}`}>↧ {report.attachmentName}</Link>}</div><b>{report.progress}%</b></article>)}</section>}
          {task.status !== "completed" && <footer><form action={reportTaskAction} className="work-report-form"><input type="hidden" name="taskId" value={task.id} /><label className="admin-field"><span>{TASKS_PAGE.progressReport}</span><textarea name="message" rows={2} placeholder={TASKS_PAGE.reportPlaceholder} /></label><label className="admin-field"><span>{TASKS_PAGE.percentDone}</span><input type="number" name="progress" min="0" max="100" defaultValue={taskReports[0]?.progress ?? 0} /></label><label className="admin-field"><span>{TASKS_PAGE.submitStatus}</span><select name="taskStatus" defaultValue="in_progress"><option value="in_progress">{TASKS_PAGE.inProgress}</option><option value="review">{TASKS_PAGE.submitForReview}</option></select></label><label className="admin-field"><span>{TASKS_PAGE.reportFile}</span><input type="file" name="reportAttachment" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.jpg,.jpeg,.png,.webp" /></label><button className="admin-button admin-button-primary" type="submit">{TASKS_PAGE.sendReport}</button></form>{canAssign && <form action={completeTaskAction} className="work-complete-form"><input type="hidden" name="taskId" value={task.id} /><button className="admin-button" type="submit">{TASKS_PAGE.approve}</button></form>}</footer>}
        </article>;
      })}
      {!tasks.length && <div className="admin-card admin-empty-state">{TASKS_PAGE.empty}</div>}
    </section>
  </>;
}

function TaskMetric({ label, value, note }: { label: string; value: number; note: string }) { return <article><span>{label}</span><strong>{value}</strong><small>{note}</small></article>; }
function priorityLabel(value: string) { if (value === "urgent") return TASKS_PAGE.priorityUrgent; if (value === "high") return TASKS_PAGE.priorityHigh; if (value === "low") return TASKS_PAGE.priorityLowLabel; return TASKS_PAGE.priorityNormal; }
function statusLabel(value: string) { if (value === "in_progress") return TASKS_PAGE.inProgress; if (value === "review") return TASKS_PAGE.pendingReview; if (value === "completed") return TASKS_PAGE.statusDone; return TASKS_PAGE.statusAssigned; }
function formatDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN"); }
function today() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date()); }
