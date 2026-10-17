import type { Metadata } from "next";
import { currentCustomer } from "@/src/services/customer-auth";
import { preorderProducts } from "@/src/constants/portal/preorder-products";
import { getBranches } from "@/src/services/data";
import IPhone18ProShowcase from "@/src/components/features/portal/preorder/IPhone18ProShowcase";
import MacBookProShowcase from "@/src/components/features/portal/preorder/MacBookProShowcase";
import "@/src/components/features/portal/preorder/macbook-pro-apple.css";
import { PREORDER_PAGE } from "@/src/constants/portal/pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: PREORDER_PAGE.metaTitle,
  description: PREORDER_PAGE.metaDescription,
  openGraph: {
    title: PREORDER_PAGE.ogTitle,
    description: PREORDER_PAGE.ogDescription,
    images: ["/apple-iphone-18-pro/hero-iphone-18-pro.jpg"],
  },
};

interface PreorderPageProps {
  searchParams?: Promise<{ device?: string }> | { device?: string };
}

export default async function PreorderPage({ searchParams }: PreorderPageProps) {
  const [resolvedParams, branches, customer] = await Promise.all([
    searchParams ? Promise.resolve(searchParams) : Promise.resolve({ device: "iphone" }),
    getBranches(false).catch(() => []),
    currentCustomer().catch(() => undefined),
  ]);

  const device = resolvedParams?.device === "macbook" ? "macbook" : "iphone";
  const branchList = branches.map(({ id, name, address, phone, hours }) => ({
    id,
    name,
    address,
    phone,
    hours,
  }));
  const customerInfo = customer ? { name: customer.name, phone: customer.phone, email: customer.email } : undefined;

  return (
    <main className="preorder-apple-page" style={{ backgroundColor: "#000000", minHeight: "100vh" }}>
      {device === "macbook" ? (
        <MacBookProShowcase
          branches={branchList}
          customer={customerInfo}
          allProducts={preorderProducts}
        />
      ) : (
        <IPhone18ProShowcase
          branches={branchList}
          customer={customerInfo}
        />
      )}
    </main>
  );
}
