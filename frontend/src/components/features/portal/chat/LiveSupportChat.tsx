"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { LIVE_SUPPORT_CHAT } from "@/src/constants/portal/chat";

type Message = { id: string; sender: string; senderName: string; text: string; createdAt: number };
type Session = { conversationId: string; token: string; name: string; branchName?: string };
type Branch = { id: string; name: string; address: string; hours: string };
const KEY = "huy-live-chat-v1";

export default function LiveSupportChat({ online, onActiveChange }: { online: boolean; onActiveChange: (active: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const selectedBranch = branches.find((branch) => branch.id === branchId);

  useEffect(() => { const timer = window.setTimeout(() => { try { const saved = JSON.parse(localStorage.getItem(KEY) || "null"); if (saved?.conversationId && saved?.token) setSession(saved); } catch { localStorage.removeItem(KEY); } }, 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => { onActiveChange(open); }, [open, onActiveChange]);
  useEffect(() => { if (!open || session || branches.length) return; let active = true; void fetch("/api/live-chat?branches=1", { cache: "no-store" }).then((response) => response.json()).then((data) => { if (active) setBranches(data.branches || []); }).catch(() => { if (active) setError(LIVE_SUPPORT_CHAT.branchesFailed); }); return () => { active = false; }; }, [open, session, branches.length]);
  useEffect(() => { if (!open || !session) return; let active = true; const load = async () => { try { const response = await fetch(`/api/live-chat?conversationId=${encodeURIComponent(session.conversationId)}&token=${encodeURIComponent(session.token)}`, { cache: "no-store" }); if (!response.ok) return; const data = await response.json(); if (!active) return; setMessages((current) => JSON.stringify(current) === JSON.stringify(data.messages || []) ? current : (data.messages || [])); if (data.conversation?.branchName && data.conversation.branchName !== session.branchName) { const next = { ...session, branchName: data.conversation.branchName }; localStorage.setItem(KEY, JSON.stringify(next)); setSession(next); } } catch { /* polling retries automatically */ } }; void load(); const timer = setInterval(load, 3000); return () => { active = false; clearInterval(timer); }; }, [open, session]);
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  async function start(event: FormEvent) {
    event.preventDefault(); setSending(true); setError("");
    const response = await fetch("/api/live-chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "start", name, phone, branchId }) });
    const data = await response.json(); setSending(false);
    if (!response.ok) { setError(data.message); return; }
    const next = { conversationId: data.id, token: data.token, name, branchName: data.branchName };
    localStorage.setItem(KEY, JSON.stringify(next)); setSession(next);
  }
  async function send(event: FormEvent) {
    event.preventDefault(); if (!session || !text.trim()) return;
    const value = text.trim(); setText(""); setSending(true);
    const response = await fetch("/api/live-chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...session, text: value }) });
    setSending(false); if (!response.ok) setText(value);
  }

  if (!open) return <button className={`live-consult-bubble ${online ? "is-online" : "is-offline"}`} type="button" onClick={() => setOpen(true)}><span className="live-consult-icon">✦</span><span><strong>{LIVE_SUPPORT_CHAT.launcherTitle}</strong><small><i />{online ? LIVE_SUPPORT_CHAT.launcherOnline : LIVE_SUPPORT_CHAT.launcherOffline}</small></span><b>›</b></button>;
  return <section className="live-chat-panel" role="dialog" aria-label={LIVE_SUPPORT_CHAT.launcherTitle}>
    <header><div><strong>{LIVE_SUPPORT_CHAT.title}</strong><span><i />{online ? LIVE_SUPPORT_CHAT.online : LIVE_SUPPORT_CHAT.offline}</span></div><button type="button" onClick={() => setOpen(false)} aria-label={LIVE_SUPPORT_CHAT.close}>×</button></header>
    {!session ? <form className="live-chat-register" onSubmit={start}><div className="live-chat-welcome"><b>{LIVE_SUPPORT_CHAT.pickBranchTitle}</b><p>{LIVE_SUPPORT_CHAT.pickBranchText}</p></div><label>{LIVE_SUPPORT_CHAT.branch}<select value={branchId} onChange={(event) => setBranchId(event.target.value)} required><option value="">{LIVE_SUPPORT_CHAT.chooseBranch}</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>{selectedBranch && <div className="live-chat-branch-preview"><strong>{selectedBranch.name}</strong><span>{selectedBranch.address}</span><small>{LIVE_SUPPORT_CHAT.hoursPrefix}{selectedBranch.hours}</small></div>}<label>{LIVE_SUPPORT_CHAT.name}<input value={name} onChange={(event) => setName(event.target.value)} placeholder={LIVE_SUPPORT_CHAT.namePlaceholder} required minLength={2}/></label><label>{LIVE_SUPPORT_CHAT.phone}<input value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="09xxxxxxxx" inputMode="tel" required/></label>{error && <p className="live-chat-error">{error}</p>}<button disabled={sending || !branchId}>{sending ? LIVE_SUPPORT_CHAT.connecting : LIVE_SUPPORT_CHAT.connect}</button><small>{LIVE_SUPPORT_CHAT.privacy}</small></form> : <><div className="live-chat-customer"><span>{LIVE_SUPPORT_CHAT.servingPrefix}<strong>{session.name}</strong></span><small>{session.branchName || LIVE_SUPPORT_CHAT.branchHandling}</small></div><div className="live-chat-messages" ref={list}>{messages.filter((message) => message.sender !== "system").map((message) => <article key={message.id} className={`is-${message.sender}`}><small>{message.sender === "admin" ? message.senderName : LIVE_SUPPORT_CHAT.you}</small><p>{message.text}</p><time>{new Date(message.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</time></article>)}{!messages.some((message) => message.sender === "admin") && <div className="live-chat-waiting">{LIVE_SUPPORT_CHAT.forwardedPrefix}{session.branchName || LIVE_SUPPORT_CHAT.branchWord}{LIVE_SUPPORT_CHAT.forwardedSuffix}</div>}</div><form className="live-chat-composer" onSubmit={send}><input value={text} onChange={(event) => setText(event.target.value)} placeholder={LIVE_SUPPORT_CHAT.messagePlaceholder} maxLength={500}/><button disabled={sending || !text.trim()}>↑</button></form></>}
  </section>;
}
