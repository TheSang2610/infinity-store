"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { CartLine } from "@/src/hooks/cart";
import { CART_TOAST } from "@/src/constants/shared/common";

interface CartToastProps {
  item: CartLine | null;
  totalCount: number;
  onClose: () => void;
}

export default function CartToast({ item, totalCount, onClose }: CartToastProps) {
  // Portal chỉ render phía trình duyệt; useSyncExternalStore tránh setState đồng bộ trong effect.
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);
  // Toast hiển thị cho tới khi chính item đó bị ẩn (hết giờ hoặc người dùng đóng).
  const [hiddenItem, setHiddenItem] = useState<CartLine | null>(null);
  const visible = Boolean(item) && hiddenItem !== item;
  // Đang ở giỏ hàng/thanh toán thì sản phẩm đã hiện ngay trên trang — không cần thông báo che màn hình.
  const onCartPage = usePathname()?.startsWith("/gio-hang") ?? false;

  useEffect(() => {
    if (!item) return;
    const timer = setTimeout(() => {
      setHiddenItem(item);
      setTimeout(onClose, 300);
    }, 4500);
    return () => clearTimeout(timer);
  }, [item, onClose]);

  if (!mounted || !item || onCartPage) return null;

  const formattedPrice = item.unitPrice
    ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.unitPrice)
    : "";

  const variantText = [item.storage, item.color].filter(Boolean).join(" · ");

  const toastContent = (
    <div
      role="status"
      aria-live="polite"
      className={`cart-toast-wrapper ${visible ? "is-visible" : "is-hiding"}`}
    >
      <div className="cart-toast-card">
        {/* Top Header: Success Badge & Close Button */}
        <div className="cart-toast-header">
          <div className="cart-toast-badge">
            <span className="cart-toast-check" aria-hidden="true">✓</span>
            <strong>{CART_TOAST.added}</strong>
          </div>
          <button
            type="button"
            className="cart-toast-close"
            onClick={() => {
              setHiddenItem(item);
              setTimeout(onClose, 300);
            }}
            aria-label={CART_TOAST.close}
          >
            ×
          </button>
        </div>

        {/* Product Details Row */}
        <div className="cart-toast-body">
          <div className="cart-toast-thumb">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.productName}
                width={52}
                height={52}
                style={{ objectFit: "contain" }}
                unoptimized
              />
            ) : (
              <div className="cart-toast-thumb-placeholder">📱</div>
            )}
          </div>
          <div className="cart-toast-info">
            <h4 className="cart-toast-title">{item.productName}</h4>
            {variantText && <p className="cart-toast-variant">{variantText}</p>}
            <p className="cart-toast-price">
              {formattedPrice} {item.quantity > 1 ? `× ${item.quantity}` : ""}
            </p>
          </div>
        </div>

        {/* Total Summary & Action Buttons */}
        <div className="cart-toast-footer">
          <span className="cart-toast-count">
            {CART_TOAST.countBefore}<strong>{totalCount}</strong>{CART_TOAST.countAfter}
          </span>
          <div className="cart-toast-actions">
            <Link
              href="/gio-hang"
              className="cart-toast-btn-secondary"
              onClick={() => {
                setHiddenItem(item);
                onClose();
              }}
            >
              {CART_TOAST.viewCart}
            </Link>
            <Link
              href="/dat-hang"
              className="cart-toast-btn-primary"
              onClick={() => {
                setHiddenItem(item);
                onClose();
              }}
            >
              {CART_TOAST.checkout}
            </Link>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="cart-toast-progress-bar" aria-hidden="true" />
      </div>
    </div>
  );

  return createPortal(toastContent, document.body);
}

function subscribeNothing() {
  return () => {};
}
