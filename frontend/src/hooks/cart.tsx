"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type CartLine = {
  key: string;
  productSlug: string;
  productName: string;
  image: string;
  ram: string;
  storage: string;
  color: string;
  unitPrice: number;
  quantity: number;
};

type CartContextValue = {
  items: CartLine[];
  count: number;
  subtotal: number;
  isLoggedIn: boolean;
  openLoginModal: () => void;
  addItem: (item: Omit<CartLine, "key" | "quantity">, quantity?: number) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
};

const defaultCartContext: CartContextValue = {
  items: [],
  count: 0,
  subtotal: 0,
  isLoggedIn: false,
  openLoginModal: () => {},
  addItem: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
};

type GlobalWithCart = typeof globalThis & {
  __INFINITY_CART_CONTEXT__?: React.Context<CartContextValue | null>;
};

const CartContext =
  (globalThis as GlobalWithCart).__INFINITY_CART_CONTEXT__ ||
  ((globalThis as GlobalWithCart).__INFINITY_CART_CONTEXT__ = createContext<CartContextValue | null>(null));

// Moi tai khoan mot gio rieng: "infinity-cart-v1:<ma khach>". Tat trinh duyet roi dang nhap
// lai van con gio; dang xuat thi gio an di (van luu, dang nhap lai la hien), tai khoan khac
// tren cung may khong thay gio cua nhau. Gio nam o trinh duyet nen khong theo sang may khac.
const STORAGE_PREFIX = "infinity-cart-v1:";
// Gio cu luu chung cho ca trinh duyet (truoc khi tach theo tai khoan; "huy-apple" la ten ban
// goc): gan cho tai khoan dang nhap dau tien tren may roi xoa.
const LEGACY_STORAGE_KEYS = ["infinity-cart-v1", "huy-apple-cart-v1"];
const PENDING_ITEM_KEY = "infinity-pending-cart-item";


import CartToast from "@/src/components/layout/CartToast";
import SmemberLoginModal from "@/src/components/features/portal/account/SmemberLoginModal";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  // Gio dang hien la cua tai khoan nao (null = chua nap / da dang xuat). Chi ghi xuong khi
  // biet chu cua gio, de khong ghi nham gio nguoi nay vao khoa cua nguoi khac.
  const [owner, setOwner] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [lastAdded, setLastAdded] = useState<CartLine | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const isLoggedIn = Boolean(customerId);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/account/me");
      const data = await res.json();
      setCustomerId(customerIdOf(data?.customer));
    } catch {
      setCustomerId(null);
    }
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => { void checkAuth(); }, 0);
    const handleAuthChange = (event: Event) => {
      // Su kien dang nhap / dang xuat mang san thong tin khach: doi gio ngay, khong cho
      // goi /api/account/me xong (dang xuat thi gio bien mat lien).
      const detail = (event as CustomEvent<{ customer?: unknown } | undefined>).detail;
      if (detail && "customer" in detail) {
        setCustomerId(customerIdOf(detail.customer));
        setAuthChecked(true);
      }
      void checkAuth();
    };
    window.addEventListener("huy-account-change", handleAuthChange);
    return () => {
      window.clearTimeout(task);
      window.removeEventListener("huy-account-change", handleAuthChange);
    };
  }, [checkAuth]);

  // Gio da doi chieu voi may chu cho tai khoan nao (null = chua xong). serverOk = may chu
  // tra loi duoc; false (mat mang, may chu chua chay migration gio hang...) thi gio chi
  // luu o trinh duyet nhu truoc, khong bao loi len trang.
  const [syncedFor, setSyncedFor] = useState<string | null>(null);
  const serverOk = useRef(false);

  // Doi tai khoan (hoac dang xuat): hien ngay ban luu o trinh duyet, roi lay gio tren may chu.
  useEffect(() => {
    if (!authChecked) return;
    let cancelled = false;
    const task = window.setTimeout(async () => {
      if (!customerId) {
        setItems([]);
        setOwner(null);
        setSyncedFor(null);
        return;
      }
      setItems(readCart(customerId));
      setOwner(customerId);
      setSyncedFor(null);
      const remote = await fetchServerCart();
      if (cancelled) return;
      serverOk.current = remote !== null;
      // May chu la ban chinh (dang nhap may nao cung giong nhau). Gio may chu con trong ma
      // trinh duyet dang co gio cu thi giu gio cu - effect ben duoi se day len may chu.
      if (remote?.length) setItems(remote);
      setSyncedFor(customerId);
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(task);
    };
  }, [authChecked, customerId]);

  // Moi thay doi: luu ban sao o trinh duyet ngay, gui len may chu sau 0,4 giay (gom cac lan
  // bam +/- lien tiep thanh mot yeu cau).
  useEffect(() => {
    if (!owner) return;
    writeCart(owner, items);
    if (syncedFor !== owner || !serverOk.current) return;
    const task = window.setTimeout(() => { void pushServerCart(items); }, 400);
    return () => window.clearTimeout(task);
  }, [items, owner, syncedFor]);

  // Resume the exact product the customer selected before the login prompt.
  // Keeping this in sessionStorage lets the intent survive the /member round-trip.
  // Doi doi chieu may chu xong moi gop, khong thi gio may chu tra ve se de mat mon nay.
  useEffect(() => {
    if (!owner || syncedFor !== owner) return;
    const task = window.setTimeout(() => {
      try {
        const pending = JSON.parse(sessionStorage.getItem(PENDING_ITEM_KEY) || "null") as CartLine | null;
        if (!validCartLine(pending)) return;
        setItems((current) => mergeCartLine(current, pending));
        setLastAdded(pending);
        setShowLoginModal(false);
        sessionStorage.removeItem(PENDING_ITEM_KEY);
      } catch {
        sessionStorage.removeItem(PENDING_ITEM_KEY);
      }
    }, 0);
    return () => window.clearTimeout(task);
  }, [owner, syncedFor]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
    isLoggedIn,
    openLoginModal() { setShowLoginModal(true); },
    addItem(item, quantity = 1) {
      const key = cartKey(item);
      const safeQty = Math.min(10, Math.max(1, quantity));
      const newItem: CartLine = { ...item, key, quantity: safeQty };
      if (!isLoggedIn || !owner) {
        sessionStorage.setItem(PENDING_ITEM_KEY, JSON.stringify(newItem));
        setShowLoginModal(true);
        return;
      }
      setItems((current) => {
        const updated = mergeCartLine(current, newItem);
        // Ghi ngay (khong doi effect) de chuyen trang lien sau khi bam van con mon vua them.
        writeCart(owner, updated);
        return updated;
      });
      setLastAdded(newItem);
    },
    updateQuantity(key, quantity) { setItems((current) => current.map((item) => item.key === key ? { ...item, quantity: Math.min(10, Math.max(1, quantity)) } : item)); },
    removeItem(key) { setItems((current) => current.filter((item) => item.key !== key)); },
    clearCart() { setItems([]); },
  }), [items, isLoggedIn, owner]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartToast item={lastAdded} totalCount={value.count} onClose={() => setLastAdded(null)} />
      <SmemberLoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  return context || defaultCartContext;
}

function customerIdOf(customer: unknown) {
  if (!customer || typeof customer !== "object") return null;
  const id = (customer as { id?: unknown }).id;
  return typeof id === "string" && id ? id : null;
}

/** Gio tren may chu; null = khong lay duoc (loi mang / may chu) -> chi dung ban trong trinh duyet. */
async function fetchServerCart(): Promise<CartLine[] | null> {
  try {
    const res = await fetch("/api/account/cart", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { items?: unknown };
    return Array.isArray(data.items) ? data.items.filter(validCartLine) : null;
  } catch {
    return null;
  }
}

async function pushServerCart(items: CartLine[]) {
  try {
    await fetch("/api/account/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
      keepalive: true,
    });
  } catch {
    // Lan thay doi sau se gui lai ca gio; ban trong trinh duyet van con.
  }
}

function readCart(customerId: string): CartLine[] {
  try {
    const key = STORAGE_PREFIX + customerId;
    let raw = localStorage.getItem(key);
    if (raw === null) {
      // Lan dau tai khoan nay dang nhap tren may: nhan gio cu luu chung (neu co).
      raw = LEGACY_STORAGE_KEYS.map((legacy) => localStorage.getItem(legacy)).find((value) => value !== null) ?? null;
    }
    LEGACY_STORAGE_KEYS.forEach((legacy) => localStorage.removeItem(legacy));
    const saved = JSON.parse(raw || "[]");
    return Array.isArray(saved) ? saved.filter(validCartLine) : [];
  } catch {
    // Du lieu hong hoac trinh duyet chan localStorage: bat dau gio trong.
    return [];
  }
}

function writeCart(customerId: string, items: CartLine[]) {
  try {
    localStorage.setItem(STORAGE_PREFIX + customerId, JSON.stringify(items));
  } catch {
    // Het dung luong / che do rieng tu: gio van dung duoc trong phien hien tai.
  }
}

function cartKey(item: Pick<CartLine, "productSlug" | "ram" | "storage" | "color">) {
  return [item.productSlug, item.ram, item.storage, item.color].map((value) => value.trim().toLowerCase()).join("|");
}

function validCartLine(item: unknown): item is CartLine {
  if (!item || typeof item !== "object") return false;
  const line = item as Partial<CartLine>;
  return Boolean(line.key && line.productSlug && line.productName && Number(line.unitPrice) > 0 && Number(line.quantity) > 0);
}

function mergeCartLine(items: CartLine[], incoming: CartLine) {
  const existing = items.find((line) => line.key === incoming.key);
  if (!existing) return [...items, incoming];
  return items.map((line) => line.key === incoming.key
    ? { ...line, quantity: Math.min(10, line.quantity + incoming.quantity) }
    : line);
}
