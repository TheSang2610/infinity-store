import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getPublicProducts } from "@/src/services/data";
import ProductDetailExperience from "@/src/components/features/portal/catalog/ProductDetailExperience";
import ProductViewTracker from "@/src/components/features/portal/catalog/ProductViewTracker";
import Link from "next/link";
import { canManageProducts, currentAdminUser } from "@/src/services/admin-auth";
import { PRODUCT_PAGE } from "@/src/constants/portal/pages";

export const dynamic = "force-dynamic";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params; const p=await getProductBySlug(slug); return p?{title:p.name,description:p.tagline}:{title:PRODUCT_PAGE.metaFallbackTitle};}
export default async function ProductPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const [product, admin] = await Promise.all([getProductBySlug(slug), currentAdminUser()]);
  if(!product) notFound();
  const canManage = canManageProducts(admin);

  // Fetch related products from same category, excluding current product
  let relatedProducts: typeof product[] = [];
  try {
    const categoryProducts = await getPublicProducts(product.category);
    relatedProducts = categoryProducts
      .filter((p) => p.slug !== product.slug)
      .slice(0, 4);

    // If not enough products in same category, get generic featured products
    if (relatedProducts.length < 3) {
      const generalProducts = await getPublicProducts();
      const additional = generalProducts
        .filter((p) => p.slug !== product.slug && !relatedProducts.some((rp) => rp.slug === p.slug))
        .slice(0, 4 - relatedProducts.length);
      relatedProducts = [...relatedProducts, ...additional];
    }
  } catch {
    relatedProducts = [];
  }

  return (
    <main className="product-page-main">
      <ProductViewTracker productSlug={product.slug} />
      {canManage && <aside className="storefront-edit-dock" aria-label={PRODUCT_PAGE.adminToolsLabel}>
        <div><span>{PRODUCT_PAGE.adminMode}</span><strong>{product.name}</strong></div>
        <Link href={`/admin/products/edit?slug=${encodeURIComponent(product.slug)}`}>{PRODUCT_PAGE.editProduct}</Link>
        <Link href="/admin/products">{PRODUCT_PAGE.productList}</Link>
      </aside>}
      <ProductDetailExperience product={product} relatedProducts={relatedProducts} canManage={canManage} />
    </main>
  );
}
