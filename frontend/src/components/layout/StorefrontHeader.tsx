"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/src/hooks/cart";
import { useStoreSettings } from "@/src/hooks/store-settings";
import { telHref } from "@/src/lib/store-settings";
import ThemeToggle from "@/src/components/common/ThemeToggle";
import { hidesStorefrontChrome } from "@/src/constants/shared/internal-routes";
import { HEADER, HEADER_CATEGORIES, QUICK_SEARCH_TAGS } from "@/src/constants/shared/header";

type HeaderCustomer = {
  name?: string;
  username?: string;
  avatarUrl?: string;
};

export default function StorefrontHeader() {
  const pathname = usePathname();
  const { count } = useCart();
  const { hotline } = useStoreSettings();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [customer, setCustomer] = useState<HeaderCustomer | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let requestVersion = 0;

    const refreshAccount = async () => {
      const version = ++requestVersion;
      try {
        const response = await fetch("/api/account/me", { cache: "no-store", credentials: "same-origin" });
        const data = await response.json() as { customer?: HeaderCustomer };
        if (version === requestVersion) setCustomer(data.customer || null);
      } catch {
        if (version === requestVersion) setCustomer(null);
      }
    };

    const handleAccountChange = (event: Event) => {
      const detail = event instanceof CustomEvent ? event.detail as { customer?: HeaderCustomer | null } | undefined : undefined;
      if (detail && Object.prototype.hasOwnProperty.call(detail, "customer")) {
        requestVersion += 1;
        setCustomer(detail.customer || null);
        return;
      }
      void refreshAccount();
    };

    void refreshAccount();
    window.addEventListener("huy-account-change", handleAccountChange);
    return () => window.removeEventListener("huy-account-change", handleAccountChange);
  }, []);

  const customerName = customer?.name?.trim() || customer?.username?.trim() || "";

  if (hidesStorefrontChrome(pathname)) {
    return null;
  }

  return (
    <header className="cps-header sf-header">
      <div className="sf-utility">
        <div className="sf-shell sf-utility-inner">
          <ul className="sf-promises" aria-label={HEADER.promisesLabel}>
            {HEADER.promises.map((item) => <li key={item.text}><Icon name={item.icon} />{item.text}</li>)}
          </ul>
          <nav className="sf-utility-links" aria-label={HEADER.quickLinksLabel}>
            <Link href="/bao-hanh"><Icon name="shield" />{HEADER.warrantyLookup}</Link>
            {hotline && <a href={telHref(hotline)}><Icon name="phone" />{hotline}</a>}
          </nav>
        </div>
      </div>

      <div className="sf-main">
        <div className="sf-shell sf-main-inner">
          <Link href="/" className="sf-logo" aria-label={HEADER.logoLabel}>
            <Image src="/brand/if-techshop-logo.png" alt={HEADER.logoAlt} width={116} height={60} priority unoptimized />
          </Link>

          <button
            type="button"
            className={`sf-category-button${showCategoryMenu ? " is-open" : ""}`}
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            aria-expanded={showCategoryMenu}
            aria-controls="sf-category-menu"
          >
            <Icon name="grid" />
            <span>{HEADER.categories}</span>
          </button>

          <div className="sf-search" ref={searchRef}>
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  router.push(`/tim-kiem?q=${encodeURIComponent(searchQuery.trim())}`);
                  setShowDropdown(false);
                }
              }}
            >
              <Icon name="search" />
              <input
                type="search"
                aria-label={HEADER.searchLabel}
                placeholder={HEADER.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
              />
              <button type="submit" className="sf-search-submit">{HEADER.searchSubmit}</button>
            </form>

            {showDropdown && (
              <div className="sf-search-dropdown cps-search-dropdown">
                <span>{HEADER.popularSearches}</span>
                <div>
                  {QUICK_SEARCH_TAGS.map((tag) => (
                    <Link key={tag} href={quickTagHref(tag)} onClick={() => setShowDropdown(false)}>
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <nav className="sf-actions cps-header-actions" aria-label={HEADER.accountAndCart}>
            <ThemeToggle compact />
            <Link href="/member" className="sf-action">
              <Icon name="box" />
              <span>{HEADER.orders}</span>
            </Link>
            <Link href="/gio-hang" className="sf-action" aria-label={count > 0 ? HEADER.cartWithCount(count) : HEADER.cart}>
              <span className="sf-action-icon">
                <Icon name="cart" />
                {count > 0 && <span className="sf-cart-badge cps-cart-badge">{count > 99 ? "99+" : count}</span>}
              </span>
              <span>{HEADER.cart}</span>
            </Link>
            <Link
              href="/member"
              className="sf-action sf-account"
              aria-label={customerName ? HEADER.accountOf(customerName) : HEADER.memberLogin}
              title={customerName || HEADER.memberLogin}
            >
              {customer?.avatarUrl ? (
                <Image className="sf-avatar" src={customer.avatarUrl} alt="" width={28} height={28} unoptimized />
              ) : (
                <Icon name="user" />
              )}
              <span className="sf-account-name">{customerName || HEADER.login}</span>
            </Link>
          </nav>
        </div>
      </div>

      {showCategoryMenu && (
        <div id="sf-category-menu" className="sf-category-menu cps-header-cat-dropdown">
          <div className="sf-shell sf-category-grid">
            {HEADER_CATEGORIES.map((cat) => (
              <Link key={cat.href} href={cat.href} onClick={() => setShowCategoryMenu(false)}>
                <span aria-hidden="true">{cat.icon}</span>
                <div>
                  <strong>{cat.label}</strong>
                  <small>{cat.sub}</small>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function quickTagHref(tag: string) {
  if (tag.includes("iPhone")) return "/iphone";
  if (tag.includes("MacBook")) return "/macbook";
  if (tag.includes("OPPO")) return "/android";
  if (tag.includes("Fujifilm") || tag.includes("Sony") || tag.includes("DJI") || tag.includes("Canon")) return "/may-anh";
  if (tag.includes("Laptop")) return "/laptop";
  return "/phu-kien";
}

const ICON_PATHS: Record<string, string> = {
  badge: "M12 3l2.4 1.8 3 .1.9 2.9 2.4 1.8-.9 2.9.9 2.9-2.4 1.8-.9 2.9-3 .1L12 21l-2.4-1.8-3-.1-.9-2.9-2.4-1.8.9-2.9-.9-2.9 2.4-1.8.9-2.9 3-.1L12 3zm-3 9l2 2 4-4",
  truck: "M3 6h11v9H3zM14 9h4l3 3v3h-7M7.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
  card: "M3 6h18v12H3zM3 10h18M7 15h4",
  shield: "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3zm-3 9l2 2 4-4",
  phone: "M5 4h3l2 5-2.5 1.5a11 11 0 005 5L14 13l5 2v3a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z",
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  search: "M11 18a7 7 0 100-14 7 7 0 000 14zm9 2l-4-4",
  box: "M3 7l9-4 9 4v10l-9 4-9-4V7zm0 0l9 4 9-4M12 11v10",
  cart: "M3 4h2l2.4 11h10.8L21 8H6.2M9 20a1 1 0 100-2 1 1 0 000 2zm9 0a1 1 0 100-2 1 1 0 000 2z",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0",
};

function Icon({ name }: { name: keyof typeof ICON_PATHS }) {
  return (
    <svg className="sf-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
