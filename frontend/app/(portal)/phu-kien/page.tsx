import type { Metadata } from "next";
import { CatalogPage } from "@/src/components/features/portal/catalog/CatalogPage";
import { ACCESSORIES_PAGE } from "@/src/constants/portal/pages";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: ACCESSORIES_PAGE.metaTitle,
  description: ACCESSORIES_PAGE.metaDescription,
};

export default function PhuKienPage() {
  return (
    <CatalogPage
      eyebrow={ACCESSORIES_PAGE.eyebrow}
      title={ACCESSORIES_PAGE.title}
      intro={ACCESSORIES_PAGE.intro}
      category="phu-kien"
    />
  );
}
