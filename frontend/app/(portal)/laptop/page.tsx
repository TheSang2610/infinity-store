import type { Metadata } from "next";
import { CatalogPage } from "@/src/components/features/portal/catalog/CatalogPage";
import { LAPTOP_PAGE } from "@/src/constants/portal/pages";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: LAPTOP_PAGE.metaTitle,
  description: LAPTOP_PAGE.metaDescription,
};

export default function LaptopPage() {
  return (
    <CatalogPage
      eyebrow={LAPTOP_PAGE.eyebrow}
      title={LAPTOP_PAGE.title}
      intro={LAPTOP_PAGE.intro}
      category="laptop"
    />
  );
}

