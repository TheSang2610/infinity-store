import LiveChatInbox from "@/src/components/features/admin/live-chat/LiveChatInbox";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/src/services/admin-auth";
import { LIVE_CHAT_PAGE } from "@/src/constants/admin/pages";
export const dynamic="force-dynamic";
export default async function Page(){const user=await requireAdminPage("/admin/live-chat");if(!["owner","manager","consultant"].includes(user.role))redirect("/staff");return <><div className="admin-topline"><div><span>{LIVE_CHAT_PAGE.inboxPrefix}{user.role==="owner"?LIVE_CHAT_PAGE.allBranches:user.branch}</span><h1>{LIVE_CHAT_PAGE.title}</h1><p className="admin-subtitle">{user.role==="owner"?LIVE_CHAT_PAGE.ownerText:LIVE_CHAT_PAGE.managerText(user.branch)}</p></div><div className="admin-live-indicator"><i/>{LIVE_CHAT_PAGE.onlineHours}</div></div><LiveChatInbox/></>}
