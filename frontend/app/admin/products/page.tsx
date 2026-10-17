import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/src/services/admin-auth";
import { getManagedProducts } from "@/src/services/data";
import AdminBulkProducts from "@/src/components/features/admin/common/AdminBulkProducts";
import { toggleAdminProductAction } from "@/src/actions/admin/orders-products";
import { statusLabel } from "@/src/lib/admin/format";
import { filterProducts, productSummary, pageHref, pagination, type ProductListQuery } from "@/src/lib/admin/product-list";
import { PRODUCTS_PAGE } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";
const pageSize = 12;
const categoryNames: Record<string, string> = { iphone: "iPhone", android: "Android", ipad: "iPad", tablet: PRODUCTS_PAGE.categoryTablet, macbook: "MacBook", "macbook-air": "MacBook Air", "macbook-pro": "MacBook Pro", laptop: "Laptop", "laptop-cu": PRODUCTS_PAGE.categoryUsedLaptop, "may-anh": PRODUCTS_PAGE.categoryCamera, "phu-kien": PRODUCTS_PAGE.categoryAccessories, audio: PRODUCTS_PAGE.categoryAudio, smartwatch: PRODUCTS_PAGE.categoryWatch, imac: "iMac", "mac-mini-studio": "Mac mini & Studio" };
const number = (value: number) => new Intl.NumberFormat("vi-VN").format(value);
const money = (value: number) => value ? `${number(value)} ₫` : PRODUCTS_PAGE.contactPrice;

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<ProductListQuery> }) {
  const [query, user] = await Promise.all([searchParams, requireAdminPage("/admin/products")]);
  if (user.role === "inventory") redirect("/admin/inventory");
  const allProducts = await getManagedProducts();
  const feedback = ["saved", "updated", "deleted"].includes(query.status ?? "") ? query.status : "";
  const selectedStatus = feedback ? "" : query.status ?? "";
  const cleanQuery = { ...query, status: selectedStatus };
  const products = filterProducts(allProducts, cleanQuery);
  const pageCount = Math.max(1, Math.ceil(products.length / pageSize));
  const requestedPage = Number(query.page);
  const page = Math.min(pageCount, Math.max(1, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1));
  const visible = products.slice((page - 1) * pageSize, page * pageSize);
  const categories = [...new Set(allProducts.map((product) => product.category))].sort();
  const summaries = allProducts.map(productSummary);
  const active = summaries.filter((item) => item.status === "active").length;
  const lowStock = summaries.filter((item) => item.stock > 0 && item.stock <= 3).length;
  const outOfStock = summaries.filter((item) => item.stock <= 0).length;
  const totalStock = summaries.reduce((sum, item) => sum + item.stock, 0);
  const activePercent = allProducts.length ? Math.round(active / allProducts.length * 100) : 0;
  const hasFilters = Boolean(query.q || query.category || selectedStatus || query.stock);
  const pages = pagination(page, pageCount);

  return (
    <div className="products-premium">
      <nav className="pp-breadcrumb" aria-label={PRODUCTS_PAGE.breadcrumbLabel}><Link href="/admin">{PRODUCTS_PAGE.admin}</Link><span>/</span><span>{PRODUCTS_PAGE.products}</span></nav>
      <header className="pp-heading">
        <div><span className="pp-eyebrow">INFINITY · CATALOG MANAGEMENT</span><h1>{PRODUCTS_PAGE.title}<span>.</span></h1><p>{PRODUCTS_PAGE.text}</p></div>
        <Link className="pp-button pp-button-primary" href="/admin/products/new"><span aria-hidden="true">＋</span> {PRODUCTS_PAGE.addProduct}</Link>
      </header>
      {feedback && <p className="pp-feedback" role="status">✓ {feedback === "deleted" ? PRODUCTS_PAGE.deleted : feedback === "updated" ? PRODUCTS_PAGE.statusUpdated : PRODUCTS_PAGE.saved}</p>}
      <section className="pp-overview" aria-label={PRODUCTS_PAGE.overviewLabel}>
        <div className="pp-overview-feature"><span className="pp-eyebrow">{PRODUCTS_PAGE.overviewEyebrow}</span><div className="pp-total"><strong>{number(allProducts.length)}</strong><span>{PRODUCTS_PAGE.models}</span></div><div className="pp-catalog-health"><span>{categories.length} {PRODUCTS_PAGE.categories}</span><span>{activePercent}{PRODUCTS_PAGE.percentSelling}</span></div><div className="pp-health-track" aria-hidden="true"><span style={{ width: `${activePercent}%` }} /></div></div>
        <Link href="/admin/products?status=active" className="pp-stat"><span className="pp-stat-label"><i className="pp-dot pp-dot-green" />{PRODUCTS_PAGE.selling}<span aria-hidden="true">↗</span></span><strong>{number(active)}</strong><small>{PRODUCTS_PAGE.sellingText}</small></Link>
        <Link href="/admin/products?stock=low" className="pp-stat"><span className="pp-stat-label"><i className="pp-dot pp-dot-amber" />{PRODUCTS_PAGE.lowStock}<span aria-hidden="true">↗</span></span><strong>{number(lowStock)}</strong><small>{PRODUCTS_PAGE.lowStockText}</small></Link>
        <Link href="/admin/products?stock=out" className="pp-stat"><span className="pp-stat-label"><i className="pp-dot pp-dot-red" />{PRODUCTS_PAGE.outOfStock}<span aria-hidden="true">↗</span></span><strong>{number(outOfStock)}</strong><small>{PRODUCTS_PAGE.outOfStockText}</small></Link>
      </section>
      <section className="pp-workspace" aria-labelledby="pp-list-title">
        <div className="pp-workspace-heading"><div><h2 id="pp-list-title">{PRODUCTS_PAGE.libraryTitle}<span>{number(products.length)}</span></h2><p>{PRODUCTS_PAGE.libraryText}</p></div><span className="pp-stock-total">{PRODUCTS_PAGE.totalStock}<strong>{number(totalStock)}</strong></span></div>
        <nav className="pp-status-tabs" aria-label={PRODUCTS_PAGE.statusTabs}>
          {[["", PRODUCTS_PAGE.all], ["active", PRODUCTS_PAGE.statusSelling], ["inactive", PRODUCTS_PAGE.statusHidden], ["draft", PRODUCTS_PAGE.statusDraft]].map(([value, label]) => <Link key={value} href={pageHref(cleanQuery, 1, value)} aria-current={selectedStatus === value ? "page" : undefined}>{label}<span>{value ? summaries.filter((item) => item.status === value).length : allProducts.length}</span></Link>)}
        </nav>
        <form className="pp-filters" action="/admin/products" key={JSON.stringify(cleanQuery)}>
          {selectedStatus && <input type="hidden" name="status" value={selectedStatus} />}
          <label className="pp-search"><span>{PRODUCTS_PAGE.searchLabel}</span><input name="q" type="search" defaultValue={query.q} placeholder={PRODUCTS_PAGE.searchPlaceholder} /></label>
          <label><span>{PRODUCTS_PAGE.category}</span><select name="category" defaultValue={query.category ?? ""}><option value="">{PRODUCTS_PAGE.allCategories}</option>{categories.map((category) => <option key={category} value={category}>{categoryNames[category] || category}</option>)}</select></label>
          <label><span>{PRODUCTS_PAGE.stock}</span><select name="stock" defaultValue={query.stock ?? ""}><option value="">{PRODUCTS_PAGE.anyStock}</option><option value="out">{PRODUCTS_PAGE.outOfStockFilter}</option><option value="low">{PRODUCTS_PAGE.lowStockFilter}</option></select></label>
          <label><span>{PRODUCTS_PAGE.sort}</span><select name="sort" defaultValue={query.sort ?? "updated"}><option value="updated">{PRODUCTS_PAGE.sortUpdated}</option><option value="name">{PRODUCTS_PAGE.sortName}</option><option value="price">{PRODUCTS_PAGE.sortPriceDesc}</option><option value="stock">{PRODUCTS_PAGE.sortStockAsc}</option></select></label>
          <button className="pp-button pp-filter-submit" type="submit">{PRODUCTS_PAGE.apply}</button>
        </form>
        {hasFilters && <div className="pp-applied-filters"><span>{PRODUCTS_PAGE.filtering}</span>{query.q && <b>“{query.q}”</b>}{query.category && <b>{categoryNames[query.category] || query.category}</b>}{selectedStatus && <b>{statusLabel(selectedStatus)}</b>}{query.stock && <b>{query.stock === "out" ? PRODUCTS_PAGE.outOfStockFilter : PRODUCTS_PAGE.lowStock}</b>}<Link href="/admin/products">{PRODUCTS_PAGE.clearFilters}</Link></div>}
        <AdminBulkProducts key={`${page}-${visible.map((product) => product.id).join("-")}`}>
          <div className="admin-table-wrap pp-table-wrap" tabIndex={0} role="region" aria-label={PRODUCTS_PAGE.tableLabel}>
            <table className="admin-table admin-product-model-table pp-table">
              <thead><tr><th scope="col"><span className="pp-sr-only">{PRODUCTS_PAGE.selectProduct}</span></th><th scope="col">{PRODUCTS_PAGE.productModel}</th><th scope="col">{PRODUCTS_PAGE.config}</th><th scope="col">{PRODUCTS_PAGE.priceFrom}</th><th scope="col">{PRODUCTS_PAGE.stock}</th><th scope="col">{PRODUCTS_PAGE.status}</th><th scope="col">{PRODUCTS_PAGE.actions}</th></tr></thead>
              <tbody>{visible.map((product) => {
                const { variants, stock, price, status } = productSummary(product);
                return <tr key={product.id}>
                  <td><input type="checkbox" name="ids" value={product.id} aria-label={PRODUCTS_PAGE.selectProductLabel(product.name)} /></td>
                  <td><div className="admin-product-model-cell pp-product-cell"><div className="pp-product-image">{product.image ? <Image src={product.image} alt="" width={56} height={56} unoptimized /> : <span aria-hidden="true">◇</span>}</div><div><span className="pp-product-brand">{product.brand || categoryNames[product.category] || product.category}</span><Link href={`/admin/products/${product.id}`}>{product.name}</Link><small>{product.sku || product.slug}</small></div></div></td>
                  <td><span className="pp-variant-count">{variants.length || 1} {PRODUCTS_PAGE.configs}</span><small className="pp-variant-detail">{variants.length ? variants.slice(0, 2).map((variant) => [variant.ram, variant.storage, variant.color].filter(Boolean).join(" / ")).join(" · ") : PRODUCTS_PAGE.standardConfig}</small></td>
                  <td><strong className="pp-price">{money(price)}</strong><small>{variants.length > 1 ? PRODUCTS_PAGE.lowestPriceHint : PRODUCTS_PAGE.currentPrice}</small></td>
                  <td><span className={`pp-stock ${stock <= 0 ? "pp-stock-out" : stock <= 3 ? "pp-stock-low" : ""}`}><i aria-hidden="true" />{number(stock)} <small>{PRODUCTS_PAGE.productsUnit}</small></span><small>{stock <= 0 ? PRODUCTS_PAGE.needsRestock : stock <= 3 ? PRODUCTS_PAGE.lowStock : PRODUCTS_PAGE.readyToSell}</small></td>
                  <td><span className={`pp-status pp-status-${status}`}><i aria-hidden="true" />{statusLabel(status)}</span></td>
                  <td><div className="pp-row-actions"><Link href={`/admin/products/${product.id}`} aria-label={PRODUCTS_PAGE.editProduct(product.name)}>{PRODUCTS_PAGE.editPrefix}<span aria-hidden="true">↗</span></Link><form action={toggleAdminProductAction}><input type="hidden" name="id" value={product.id} /><input type="hidden" name="slug" value={product.slug} /><input type="hidden" name="active" value={String(!product.active)} /><button type="submit" aria-label={`${product.active ? PRODUCTS_PAGE.hide : PRODUCTS_PAGE.show} ${product.name}`}>{product.active ? PRODUCTS_PAGE.hide : PRODUCTS_PAGE.show}</button></form></div></td>
                </tr>;
              })}</tbody>
            </table>
            {!visible.length && <div className="pp-empty"><span aria-hidden="true">◇</span><h3>{hasFilters ? PRODUCTS_PAGE.noMatchTitle : PRODUCTS_PAGE.emptyTitle}</h3><p>{hasFilters ? PRODUCTS_PAGE.noMatchText : PRODUCTS_PAGE.emptyText}</p><Link className="pp-button" href={hasFilters ? "/admin/products" : "/admin/products/new"}>{hasFilters ? PRODUCTS_PAGE.clearFiltersShort : PRODUCTS_PAGE.addProduct}</Link></div>}
          </div>
        </AdminBulkProducts>
        <footer className="pp-table-footer"><p>{PRODUCTS_PAGE.showingPrefix}<strong>{products.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, products.length)}</strong> trong {number(products.length)} {PRODUCTS_PAGE.productsUnit}</p><nav className="pp-pagination" aria-label={PRODUCTS_PAGE.pagination}>{page > 1 && <Link href={pageHref(cleanQuery, page - 1)} aria-label={PRODUCTS_PAGE.previousPage}>←</Link>}{pages.map((value, index) => <span key={value}>{index > 0 && value - pages[index - 1] > 1 && <span className="pp-page-gap">…</span>}<Link href={pageHref(cleanQuery, value)} aria-current={page === value ? "page" : undefined} aria-label={`Trang ${value}`}>{value}</Link></span>)}{page < pageCount && <Link href={pageHref(cleanQuery, page + 1)} aria-label={PRODUCTS_PAGE.nextPage}>→</Link>}</nav></footer>
      </section>
      <p className="pp-footnote">INFINITY RETAIL <span>{PRODUCTS_PAGE.footer}</span></p>
    </div>
  );
}
