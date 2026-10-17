import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/src/services/admin-auth";
import AdminProductForm from "@/src/components/features/admin/products/AdminProductForm";
import { PRODUCT_NEW_PAGE } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ error?: string; status?: string }> }) {
  const [query, user] = await Promise.all([searchParams, requireAdminPage("/admin/products/new")]);
  if (user.role === "inventory") redirect("/admin/inventory");
  return (
    <>
      <div className="admin-topline">
        <div><span>{PRODUCT_NEW_PAGE.breadcrumb}</span><h1>{PRODUCT_NEW_PAGE.title}</h1></div>
        <Link className="admin-button" href="/admin/products">{PRODUCT_NEW_PAGE.back}</Link>
      </div>
      {query.error && <p className="admin-alert error">{query.error}</p>}
      {query.status && <p className="admin-alert success">{PRODUCT_NEW_PAGE.saved}</p>}
      <AdminProductForm />
    </>
  );
}
