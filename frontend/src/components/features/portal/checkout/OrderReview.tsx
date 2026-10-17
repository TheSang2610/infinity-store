"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useCart, type CartLine } from "@/src/hooks/cart";
import { formatOrderMoney, moneyToNumber, productUnitPrice } from "@/src/lib/order-pricing";
import type { Product } from "@/src/lib/products";
import { CHECKOUT_STEP_PARAM } from "@/src/constants/portal/checkout-step";
import { ORDER_REVIEW } from "@/src/constants/portal/checkout";

type VoucherQuote = { code: string; discount: number; subtotal: number };
type CheckoutLine = Pick<CartLine, "productSlug" | "productName" | "image" | "ram" | "storage" | "color" | "unitPrice" | "quantity">;

export default function OrderReview({ products }: { products: Product[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const cart = useCart();
  const [directQuantity, setDirectQuantity] = useState(1);
  const [voucherInput, setVoucherInput] = useState("");
  const [voucher, setVoucher] = useState<VoucherQuote | null>(null);
  const [voucherMessage, setVoucherMessage] = useState("");

  const requestedSlug = params.get("may") || "";
  const requestedRam = params.get("ram") || "";
  const requestedStorage = params.get("dung-luong") || "";
  const requestedColor = params.get("mau") || "";
  const requestedProduct = products.find((product) => product.slug === requestedSlug);
  const directLine = useMemo<CheckoutLine | null>(() => {
    if (!requestedProduct) return null;
    const variant = findVariant(requestedProduct, requestedRam, requestedStorage, requestedColor);
    return {
      productSlug: requestedProduct.slug,
      productName: requestedProduct.name,
      image: variant?.image || requestedProduct.image,
      ram: requestedRam || variant?.ram || "",
      storage: requestedStorage || variant?.storage || requestedProduct.storageOptions?.[0] || "",
      color: requestedColor || variant?.color || requestedProduct.colorOptions?.[0]?.name || "",
      unitPrice: productUnitPrice(requestedProduct, requestedStorage, requestedColor, requestedRam),
      quantity: directQuantity,
    };
  }, [directQuantity, requestedColor, requestedProduct, requestedRam, requestedStorage]);
  const lines = directLine ? [directLine] : cart.items;
  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const productSavings = lines.reduce((sum, line) => {
    const product = products.find((item) => item.slug === line.productSlug);
    const original = originalUnitPrice(product, line.ram, line.storage, line.color);
    return sum + Math.max(0, original - line.unitPrice) * line.quantity;
  }, 0);
  const activeVoucher = voucher?.subtotal === subtotal ? voucher : null;
  const total = Math.max(0, subtotal - (activeVoucher?.discount || 0));
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  async function applyVoucher() {
    setVoucherMessage("");
    try {
      const response = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucherInput, subtotal }),
      });
      const result = await response.json() as { code?: string; discount?: number; message?: string };
      if (!response.ok) throw new Error(result.message || ORDER_REVIEW.invalidVoucher);
      const nextVoucher = { code: result.code || voucherInput.toUpperCase(), discount: Number(result.discount) || 0, subtotal };
      setVoucher(nextVoucher);
      setVoucherInput(nextVoucher.code);
      setVoucherMessage(ORDER_REVIEW.voucherApplied(formatOrderMoney(nextVoucher.discount)));
    } catch (error) {
      setVoucher(null);
      setVoucherMessage(error instanceof Error ? error.message : ORDER_REVIEW.invalidVoucher);
    }
  }

  // Thanh toán tập trung ở giỏ hàng: sản phẩm "Mua ngay" được thêm vào giỏ rồi mở thẳng bước thanh toán.
  // Khách chưa đăng nhập sẽ thấy hộp đăng nhập; đăng nhập xong quay lại đúng bước này và giỏ tự nhận sản phẩm.
  function continueToPayment() {
    if (!lines.length || total <= 0) return;
    if (directLine) {
      const { quantity, ...item } = directLine;
      cart.addItem(item, quantity);
    }
    router.push(`/gio-hang?${CHECKOUT_STEP_PARAM}=thanh-toan`);
  }

  if (!lines.length) {
    return <section className="quick-order-empty"><span>◫</span><h2>{ORDER_REVIEW.emptyTitle}</h2><p>{ORDER_REVIEW.emptyText}</p><Link href="/iphone">{ORDER_REVIEW.chooseProducts}</Link></section>;
  }

  return (
    <div className="quick-order-layout">
      <section className="quick-order-products" aria-label={ORDER_REVIEW.itemsLabel}>
        <header><h2>{ORDER_REVIEW.itemsTitle}</h2><span>{itemCount} {ORDER_REVIEW.products}</span></header>
        <div className="quick-order-list">
          {lines.map((line) => {
            const product = products.find((item) => item.slug === line.productSlug);
            const original = originalUnitPrice(product, line.ram, line.storage, line.color);
            const key = `${line.productSlug}-${line.ram}-${line.storage}-${line.color}`;
            return <article className="quick-order-item" key={key}>
              <div className="quick-order-image"><Image src={line.image} alt={line.productName} width={130} height={130} unoptimized /></div>
              <div className="quick-order-info">
                <span>{product?.brand || "Infinity Store"}</span>
                <h3>{line.productName}</h3>
                <p>{[line.ram && `${line.ram} RAM`, line.storage, line.color].filter(Boolean).join(" · ") || ORDER_REVIEW.standardVersion}</p>
                <Link href={`/san-pham/${line.productSlug}`}>{ORDER_REVIEW.viewProduct}</Link>
              </div>
              <div className="quick-order-price">
                <strong>{formatOrderMoney(line.unitPrice * line.quantity)}</strong>
                {original > line.unitPrice && <del>{formatOrderMoney(original * line.quantity)}</del>}
                <small>{ORDER_REVIEW.unitPrice}{formatOrderMoney(line.unitPrice)}</small>
                <div className="quick-order-quantity" aria-label={ORDER_REVIEW.quantityOf(line.productName)}>
                  <button type="button" aria-label={ORDER_REVIEW.decrease} onClick={() => directLine ? setDirectQuantity((value) => Math.max(1, value - 1)) : cart.updateQuantity(lineKey(line), line.quantity - 1)}>−</button>
                  <b>{line.quantity}</b>
                  <button type="button" aria-label={ORDER_REVIEW.increase} onClick={() => directLine ? setDirectQuantity((value) => Math.min(10, value + 1)) : cart.updateQuantity(lineKey(line), line.quantity + 1)}>+</button>
                </div>
              </div>
            </article>;
          })}
        </div>
      </section>

      <aside className="quick-order-summary">
        <span className="quick-order-summary-kicker">{ORDER_REVIEW.summaryEyebrow}</span>
        <h2>{ORDER_REVIEW.priceDetails}</h2>
        <dl>
          <div><dt>{ORDER_REVIEW.subtotalOpen}{itemCount} {ORDER_REVIEW.subtotalClose}</dt><dd>{formatOrderMoney(subtotal)}</dd></div>
          {productSavings > 0 && <div className="is-discount"><dt>{ORDER_REVIEW.productDiscount}</dt><dd>−{formatOrderMoney(productSavings)}</dd></div>}
          {activeVoucher && <div className="is-discount"><dt>{ORDER_REVIEW.codePrefix}{activeVoucher.code}</dt><dd>−{formatOrderMoney(activeVoucher.discount)}</dd></div>}
          <div><dt>{ORDER_REVIEW.paymentFee}</dt><dd className="is-free">{ORDER_REVIEW.free}</dd></div>
        </dl>
        <div className="quick-order-voucher">
          <label htmlFor="quick-order-voucher">{ORDER_REVIEW.voucher}</label>
          <div><input id="quick-order-voucher" value={voucherInput} onChange={(event) => setVoucherInput(event.target.value.toUpperCase())} placeholder={ORDER_REVIEW.voucherPlaceholder} /><button type="button" onClick={applyVoucher} disabled={!voucherInput.trim()}>{ORDER_REVIEW.apply}</button></div>
          {voucherMessage && <p className={activeVoucher ? "is-success" : "is-error"}>{voucherMessage}</p>}
        </div>
        <div className="quick-order-total"><span>{ORDER_REVIEW.total}</span><strong>{formatOrderMoney(total)}</strong><small>{ORDER_REVIEW.totalNote}</small></div>
        <button type="button" className="quick-order-continue" onClick={continueToPayment}>{ORDER_REVIEW.continue}<span>→</span></button>
        <Link className="quick-order-back" href={directLine ? `/san-pham/${directLine.productSlug}` : "/gio-hang"}>{ORDER_REVIEW.back}</Link>
      </aside>
    </div>
  );
}

function normalize(value?: string) { return (value || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase(); }
function findVariant(product: Product, ram: string, storage: string, color: string) {
  return product.variants?.find((variant) => (!ram || normalize(variant.ram) === normalize(ram)) && (!storage || normalize(variant.storage) === normalize(storage)) && (!color || normalize(variant.color) === normalize(color)))
    || product.variants?.find((variant) => (!ram || normalize(variant.ram) === normalize(ram)) && (!storage || normalize(variant.storage) === normalize(storage)));
}
function originalUnitPrice(product: Product | undefined, ram: string, storage: string, color: string) {
  if (!product) return 0;
  const variant = findVariant(product, ram, storage, color);
  return moneyToNumber(variant?.price || product.oldPrice || product.price);
}
function lineKey(line: CheckoutLine) { return [line.productSlug, line.ram, line.storage, line.color].map((value) => value.trim().toLowerCase()).join("|"); }
