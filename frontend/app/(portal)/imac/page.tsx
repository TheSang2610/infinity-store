import type { Metadata } from "next";
import { CatalogPage } from "@/src/components/features/portal/catalog/CatalogPage";
import { IMAC_PAGE } from "@/src/constants/portal/pages";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "iMac",
  description: IMAC_PAGE.metaDescription,
};

export default function ImacPage() {
  return <CatalogPage category="imac" />;
}
