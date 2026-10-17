import ShopProductCard, { cardPricing, type ShopCardProduct } from "@/src/components/features/portal/catalog/ShopProductCard";
import { FLASH_SALE } from "@/src/constants/portal/home";

/** Sản phẩm đang giảm giá thật (giá bán thấp hơn giá gốc trong dữ liệu cửa hàng). Ẩn khi không có. */
export default function StorefrontFlashSale({ products }: { products: ShopCardProduct[] }) {
  const discounted = products
    .map((product) => ({ product, percent: cardPricing(product).discountPercent }))
    .filter((item) => item.percent > 0)
    .sort((left, right) => right.percent - left.percent)
    .slice(0, 5);
  if (!discounted.length) return null;

  return (
    <section className="cps-container shop-deals" aria-labelledby="shop-deals-title">
      <header className="shop-deals-head">
        <div>
          <p className="shop-eyebrow">{FLASH_SALE.eyebrow}</p>
          <h2 id="shop-deals-title">{FLASH_SALE.title}</h2>
        </div>
      </header>
      <div className="shop-deals-grid">
        {discounted.map(({ product }) => <ShopProductCard key={product.slug} product={product} />)}
      </div>
    </section>
  );
}
