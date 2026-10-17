"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createBotReply } from "@/src/lib/chatbot/engine";
import type { ChatContext, ChatMessage, ChatProduct } from "@/src/lib/chatbot/types";
import type { AdvisorResult, AdvisorState } from "@/src/lib/chatbot/advisor";
import type { ConsultResult } from "@/src/lib/chatbot/consult";
import { CHATBOT_OPENING, CHATBOT_QUICK_REPLIES, fillStoreInfo } from "@/src/constants/portal/chatbot-knowledge";
import { useStoreSettings } from "@/src/hooks/store-settings";
import LiveSupportChat from "@/src/components/features/portal/chat/LiveSupportChat";
import { hidesStorefrontChrome, isInternalPath } from "@/src/constants/shared/internal-routes";
import { LOCAL_CHATBOT } from "@/src/constants/portal/chat";

const STORAGE_KEY = "huy-apple-local-chat-v1";
const INITIAL_MESSAGE: ChatMessage = {
  id: "chatbot-welcome",
  role: "bot",
  text: CHATBOT_OPENING,
  createdAt: 0,
  intent: "greeting",
  confidence: 1,
};

type StoredChat = { messages: ChatMessage[]; context: ChatContext };

export default function LocalChatbot({ products }: { products: ChatProduct[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [context, setContext] = useState<ChatContext>({});
  const [typing, setTyping] = useState(false);
  const [ready, setReady] = useState(false);
  const [staffOnline, setStaffOnline] = useState(false);
  const store = useStoreSettings();
  const contactPhone = store.zaloPhone || store.hotline;
  const storeInfo = {
    bankName: store.bank.name, storeName: store.storeName,
    storeAddress: store.showrooms[0]?.address || store.officeAddress, contactPhone,
  };
  const [liveActive, setLiveActive] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateStatus = () => setStaffOnline(isVietnamSupportHours());
    updateStatus();
    const timer = window.setInterval(updateStatus, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as StoredChat | null;
        if (saved && Array.isArray(saved.messages)) {
          const validMessages = saved.messages.filter(validMessage).slice(-40);
          if (validMessages.length) setMessages(validMessages);
          if (saved.context && typeof saved.context === "object") setContext(saved.context);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages: messages.slice(-40), context } satisfies StoredChat));
  }, [context, messages, ready]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, typing]);

  const quickReplies = useMemo<readonly string[]>(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "bot" && last.quickReplies?.length) return last.quickReplies;
    const showDefaults = messages.length <= 2 || last?.intent === "unknown" || last?.intent === "products";
    return showDefaults ? CHATBOT_QUICK_REPLIES : [];
  }, [messages]);

  if (isInternalPath(pathname)) return null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(input);
  }

  function sendMessage(rawMessage: string) {
    const text = rawMessage.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
    if (!text || typing) return;

    const reply = createBotReply(text, products, context);
    const userMessage: ChatMessage = { id: newId(), role: "user", text, createdAt: 0 };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setContext(reply.context);
    setTyping(true);

    window.setTimeout(async () => {
      if (reply.consult) {
        const consult = await fetchConsultation(reply.consult);
        if (consult) {
          setContext((current) => ({ ...current, advisor: consult.advisor }));
          const base = { role: "bot" as const, createdAt: Date.now(), intent: reply.intent, confidence: reply.confidence };
          const priceMessage: ChatMessage = { ...base, id: newId(), text: consult.text, prices: consult.prices, link: consult.link };
          const stockMessage: ChatMessage = { ...base, id: newId(), text: consult.availability, branches: consult.branches };
          const adviceMessage: ChatMessage = { ...base, id: newId(), text: consult.advice, quickReplies: consult.quickReplies };
          const focused = reply.consultFocus === "availability"
            ? [{ ...stockMessage, link: consult.link, quickReplies: consult.quickReplies }]
            : reply.consultFocus === "price"
              ? [{ ...priceMessage, quickReplies: consult.quickReplies }]
              : [priceMessage, stockMessage, adviceMessage];
          setMessages((current) => [...current, ...focused]);
          setTyping(false);
          return;
        }
      }
      let resolvedText = reply.orderCode ? await lookupOrderStatus(reply.orderCode, contactPhone) : fillStoreInfo(reply.text, storeInfo);
      let suggestions: ChatMessage["products"];
      let replies = reply.quickReplies;
      if (reply.recommend) {
        const result = await fetchRecommendations(reply.recommend, contactPhone);
        resolvedText = result.text;
        suggestions = result.products;
        replies = result.quickReplies;
        setContext((current) => ({
          ...current,
          advisor: { ...current.advisor, shownMin: result.shownMin, shownMax: result.shownMax },
        }));
      }
      const botMessage: ChatMessage = {
        id: newId(),
        role: "bot",
        text: resolvedText,
        createdAt: Date.now(),
        intent: reply.intent,
        confidence: reply.confidence,
        link: reply.link,
        products: suggestions,
        quickReplies: replies,
      };
      setMessages((current) => [...current, botMessage]);
      setTyping(false);
    }, 650 + Math.min(550, text.length * 7));
  }

  function clearConversation() {
    setMessages([INITIAL_MESSAGE]);
    setContext({});
    setTyping(false);
    localStorage.removeItem(STORAGE_KEY);
  }

  if (hidesStorefrontChrome(pathname)) return null;

  return (
    <aside className={`local-chatbot${open ? " is-open" : ""}`} aria-label={LOCAL_CHATBOT.dialogLabel}>
      {open ? (
        <section className="chatbot-panel" role="dialog" aria-modal="false" aria-labelledby="chatbot-title">
          <header className="chatbot-header">
            <div className="chatbot-brand-mark" aria-hidden="true">
              <Image src="/chatbot/consultant-avatar.png" alt="" width={52} height={52} unoptimized />
            </div>
            <div>
              <strong id="chatbot-title">{LOCAL_CHATBOT.title}</strong>
              <span><i aria-hidden="true" />{LOCAL_CHATBOT.online}</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={LOCAL_CHATBOT.minimizeLabel} title={LOCAL_CHATBOT.minimize}>−</button>
            <button type="button" onClick={() => setOpen(false)} aria-label={LOCAL_CHATBOT.closeLabel} title={LOCAL_CHATBOT.close}>×</button>
          </header>

          <div className="chatbot-messages" ref={listRef} aria-live="polite" aria-busy={typing}>
            <div className="chatbot-local-note">{LOCAL_CHATBOT.disclaimer}</div>
            {messages.map((message) => (
              <article key={message.id} className={`chatbot-message is-${message.role}`}>
                {message.role === "bot" && <Image className="chatbot-avatar" src="/chatbot/consultant-avatar.png" alt="" width={28} height={28} unoptimized />}
                <div>
                  <p>{message.text}</p>
                  {message.prices && message.prices.length > 0 && (
                    <table className="chatbot-price-table">
                      <tbody>
                        {message.prices.map((row) => (
                          <tr key={row.label}>
                            <th scope="row">{row.label}</th>
                            <td>{row.oldPrice && <del>{row.oldPrice}</del>}<strong>{row.price}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {message.branches && message.branches.length > 0 && (
                    <ul className="chatbot-branches">
                      {message.branches.map((branch) => (
                        <li key={branch.name}>
                          <strong>📍 {branch.name}</strong>
                          <span>{branch.address}</span>
                          <small>{branch.detail}</small>
                          {branch.phone && <a href={`tel:${branch.phone}`}>{LOCAL_CHATBOT.callPrefix}{branch.phone}</a>}
                        </li>
                      ))}
                    </ul>
                  )}
                  {message.link && <Link href={message.link.href} onClick={() => setOpen(false)}>{message.link.label}<span aria-hidden="true">→</span></Link>}
                  {message.products && message.products.length > 0 && (
                    <ul className="chatbot-suggestions">
                      {message.products.map((product, index) => (
                        <li key={product.slug}>
                          <Link href={`/san-pham/${product.slug}`} onClick={() => setOpen(false)}>
                            <span className="chatbot-suggestion-thumb">
                              {product.image ? <Image src={product.image} alt="" width={56} height={56} unoptimized /> : <b>{index + 1}</b>}
                            </span>
                            <span className="chatbot-suggestion-body">
                              <strong>{product.name}</strong>
                              <em>{product.price}</em>
                              <small>{product.reason}</small>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
            {typing && (
              <article className="chatbot-message is-bot is-typing" aria-label={LOCAL_CHATBOT.typing}>
                <Image className="chatbot-avatar" src="/chatbot/consultant-avatar.png" alt="" width={28} height={28} unoptimized />
                <div><i /><i /><i /></div>
              </article>
            )}
          </div>

          {quickReplies.length > 0 && !typing && (
            <div className="chatbot-quick-replies" aria-label={LOCAL_CHATBOT.suggestions}>
              {quickReplies.map((reply) => <button key={reply} type="button" onClick={() => sendMessage(reply)} disabled={typing}>{reply}</button>)}
            </div>
          )}

          <form className="chatbot-composer" onSubmit={submit}>
            <label className="sr-only" htmlFor="chatbot-input">{LOCAL_CHATBOT.inputLabel}</label>
            <input id="chatbot-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder={LOCAL_CHATBOT.inputPlaceholder} maxLength={300} autoComplete="off" />
            <button type="submit" disabled={!input.trim() || typing} aria-label={LOCAL_CHATBOT.sendLabel} title={LOCAL_CHATBOT.send}>↑</button>
          </form>
          <button className="chatbot-reset" type="button" onClick={clearConversation}>{LOCAL_CHATBOT.clear}</button>
        </section>
      ) : (
        <div className="chatbot-launchers">
          <LiveSupportChat online={staffOnline} onActiveChange={setLiveActive} />
          {!liveActive && <button className="chatbot-launcher" type="button" onClick={() => setOpen(true)} aria-label={LOCAL_CHATBOT.openLabel}>
            <span className="chatbot-launcher-icon" aria-hidden="true">
              <Image src="/chatbot/consultant-avatar.png" alt="" width={54} height={54} unoptimized />
            </span>
            <span><strong>{LOCAL_CHATBOT.title}</strong><small>{LOCAL_CHATBOT.launcherHint}</small></span>
            <i aria-hidden="true" />
          </button>}
        </div>
      )}
    </aside>
  );
}

async function fetchConsultation(slug: string): Promise<ConsultResult | undefined> {
  try {
    const response = await fetch(`/api/chatbot/product?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (!response.ok) return undefined;
    const result = await response.json() as ConsultResult;
    if (typeof result.text !== "string" || typeof result.advice !== "string") return undefined;
    return {
      ...result,
      prices: Array.isArray(result.prices) ? result.prices.slice(0, 6) : [],
      branches: Array.isArray(result.branches) ? result.branches.slice(0, 4) : [],
      quickReplies: Array.isArray(result.quickReplies) ? result.quickReplies : [],
    };
  } catch {
    return undefined;
  }
}

async function fetchRecommendations(query: AdvisorState, contactPhone: string): Promise<AdvisorResult> {
  try {
    const response = await fetch("/api/chatbot/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("recommend failed");
    const result = await response.json() as AdvisorResult;
    return {
      text: String(result.text || ""),
      products: Array.isArray(result.products) ? result.products.slice(0, 3) : [],
      shownMin: result.shownMin,
      shownMax: result.shownMax,
      quickReplies: Array.isArray(result.quickReplies) ? result.quickReplies : [],
    };
  } catch {
    return {
      text: LOCAL_CHATBOT.recommendFailed(contactPhone),
      products: [],
      quickReplies: [LOCAL_CHATBOT.restart, LOCAL_CHATBOT.contact],
    };
  }
}

async function lookupOrderStatus(orderCode: string, contactPhone: string) {
  try {
    const response = await fetch(`/api/orders/status?orderCode=${encodeURIComponent(orderCode)}`, { cache: "no-store" });
    const result = await response.json() as { status?: string; paymentStatus?: string; message?: string };
    if (!response.ok) return result.message || LOCAL_CHATBOT.orderNotFound;
    return LOCAL_CHATBOT.orderStatus(orderCode, orderStatusLabel(result.status), paymentStatusLabel(result.paymentStatus));
  } catch {
    return LOCAL_CHATBOT.orderLookupFailed(contactPhone);
  }
}

function orderStatusLabel(status?: string) {
  return ({ pending: LOCAL_CHATBOT.orderPending, confirmed: LOCAL_CHATBOT.orderConfirmed, processing: LOCAL_CHATBOT.orderProcessing, shipping: LOCAL_CHATBOT.orderShipping, delivered: LOCAL_CHATBOT.orderDelivered, cancelled: LOCAL_CHATBOT.orderCancelled, returned: LOCAL_CHATBOT.orderReturned } as Record<string, string>)[status ?? ""] || LOCAL_CHATBOT.orderChecking;
}

function paymentStatusLabel(status?: string) {
  return ({ not_required: LOCAL_CHATBOT.paymentNotRequired, unpaid: LOCAL_CHATBOT.paymentUnpaid, paid: LOCAL_CHATBOT.paymentPaid, pending: LOCAL_CHATBOT.paymentChecking, failed: LOCAL_CHATBOT.paymentFailed, refunded: LOCAL_CHATBOT.paymentRefunded } as Record<string, string>)[status ?? ""] || LOCAL_CHATBOT.paymentUnknown;
}

function validMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<ChatMessage>;
  const validProducts = message.products === undefined || (Array.isArray(message.products) && message.products.every((product) => product && typeof product.slug === "string" && typeof product.name === "string"));
  const validRows = (message.prices === undefined || Array.isArray(message.prices)) && (message.branches === undefined || Array.isArray(message.branches));
  const validReplies = message.quickReplies === undefined || (Array.isArray(message.quickReplies) && message.quickReplies.every((reply) => typeof reply === "string"));
  return (message.role === "user" || message.role === "bot") && typeof message.id === "string" && typeof message.text === "string" && message.text.length <= 2000 && validProducts && validReplies && validRows;
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isVietnamSupportHours() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
  const totalMinutes = hour * 60 + minute;
  return totalMinutes >= 8 * 60 && totalMinutes < 22 * 60;
}
