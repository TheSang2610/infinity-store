"use client";

import Link from "next/link";
import { useCart } from "@/src/hooks/cart";
import { CART_HEADER_LINK } from "@/src/constants/shared/common";

export default function CartHeaderLink() {
  const { count } = useCart();
  return <Link className="header-cart-link" href="/gio-hang" aria-label={CART_HEADER_LINK.label(count)}><span className="header-cart-icon" aria-hidden="true" /><strong>{CART_HEADER_LINK.cart}</strong><em>{count}</em></Link>;
}
