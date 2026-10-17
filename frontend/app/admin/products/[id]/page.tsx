import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireAdminPage } from "@/src/services/admin-auth";
import { getManagedProductById } from "@/src/services/data";
import AdminProductForm from "@/src/components/features/admin/products/AdminProductForm";
import { PRODUCT_EDIT_PAGE } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string; error?: string }> }) {
  const [{ id }, query, user] = await Promise.all([params, searchParams, requireAdminPage("/admin/products")]);
  if (user.role === "inventory") redirect("/admin/inventory");
  const product = await getManagedProductById(id);
  if (!product) notFound();

  return (
    <>
      <div className="admin-topline">
        <div><span>{PRODUCT_EDIT_PAGE.breadcrumb}</span><h1>{PRODUCT_EDIT_PAGE.title}</h1></div>
        <div className="admin-row-actions">
          <Link className="admin-button" href={`/san-pham/${product.slug}`}>{PRODUCT_EDIT_PAGE.viewInStore}</Link>
          <Link className="admin-button" href="/admin/products">{PRODUCT_EDIT_PAGE.back}</Link>
        </div>
      </div>
      {query.status && <p className="admin-alert success">{PRODUCT_EDIT_PAGE.saved}</p>}
      {query.error && <p className="admin-alert error">{query.error}</p>}
      <AdminProductForm product={product} />
    </>
  );
}
