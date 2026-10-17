import Image from "next/image";
import Link from "next/link";
import { SHOP_PRODUCT_CARD } from "@/src/constants/portal/catalog";

export type ShopCardProduct = {
  slug: string;
  name: string;
  image: string;
  price?: string;
  sellingPrice?: string;
  salePrice?: string;
  condition?: string;
};

/** Giá bán thực tế và giá gốc (chỉ khi cửa hàng thật sự có giá gốc cao hơn). */
export function cardPricing(product: ShopCardProduct) {
  const current = product.salePrice || product.sellingPrice || product.price || "";
  const currentValue = moneyValue(current);
  const originalValue = moneyValue(product.price);
  const hasDiscount = currentValue > 0 && originalValue > currentValue;
  return {
    current: currentValue > 0 ? formatPrice(current) : SHOP_PRODUCT_CARD.contactForPrice,
    original: hasDiscount ? formatPrice(product.price ?? "") : "",
    discountPercent: hasDiscount ? Math.round(((originalValue - currentValue) / originalValue) * 100) : 0,
  };
}

/**
 * Thẻ sản phẩm dùng chung cho trang chủ, danh mục, tìm kiếm và gợi ý:
 * chỉ ảnh, tên và giá — thông số chi tiết nằm ở trang sản phẩm.
 */
export default function ShopProductCard({
  product,
  sizes = "(max-width: 700px) 46vw, (max-width: 1100px) 30vw, 230px",
  children,
}: {
  product: ShopCardProduct;
  sizes?: string;
  children?: React.ReactNode;
}) {
  const { current, original, discountPercent } = cardPricing(product);
  const tag = discountPercent > 0 ? `-${discountPercent}%` : product.condition === "like-new" ? "Like New" : "";
  return (
    <article className="shop-card">
      <Link className="shop-card-link" href={`/san-pham/${product.slug}`} aria-label={`${product.name} — ${current}`}>
        <div className="shop-card-media">
          {product.image ? (
            <Image src={product.image} alt="" fill sizes={sizes} unoptimized style={{ objectFit: "contain" }} />
          ) : (
            <span className="shop-card-empty">{SHOP_PRODUCT_CARD.noImage}</span>
          )}
          {tag && <span className={`shop-card-tag${discountPercent > 0 ? " is-discount" : ""}`}>{tag}</span>}
        </div>
        <h3 className="shop-card-name">{product.name}</h3>
        <p className="shop-card-price">
          <strong>{current}</strong>
          {original && <del>{original}</del>}
        </p>
      </Link>
      {children}
    </article>
  );
}

function moneyValue(value?: string) {
  return Number((value ?? "").replace(/\D/g, "")) || 0;
}

function formatPrice(value: string) {
  const trimmed = value.trim();
  if (/^từ/i.test(trimmed) || /[đ₫]$/.test(trimmed)) return trimmed.replace(/₫$/, "đ");
  const amount = moneyValue(trimmed);
  return amount ? `${new Intl.NumberFormat("vi-VN").format(amount)}đ` : trimmed;
}
