import Link from "next/link";
import type { Product } from "@/src/lib/products";
import ShopProductCard from "@/src/components/features/portal/catalog/ShopProductCard";
import { PRODUCT_CARD } from "@/src/constants/portal/catalog";

/** Thẻ sản phẩm ở danh mục, tìm kiếm và gợi ý giỏ hàng: ảnh, tên, giá. */
export default function ProductCard({
  product,
  canManage = false,
}: {
  product: Product;
  canManage?: boolean;
}) {
  if (!product) return null;
  return (
    <ShopProductCard product={product}>
      {canManage && (
        <Link
          className="storefront-product-edit"
          href={`/admin/products/edit?slug=${encodeURIComponent(product.slug)}`}
          aria-label={PRODUCT_CARD.editLabel(product.name)}
          title={PRODUCT_CARD.edit}
        >
          <span aria-hidden="true">✎</span>
        </Link>
      )}
    </ShopProductCard>
  );
}
