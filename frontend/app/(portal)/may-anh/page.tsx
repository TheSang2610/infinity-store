import type { Metadata } from "next";
import { CatalogPage } from "@/src/components/features/portal/catalog/CatalogPage";
import { CAMERA_PAGE } from "@/src/constants/portal/pages";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: CAMERA_PAGE.metaTitle,
  description: CAMERA_PAGE.metaDescription,
};

export default function MayAnhPage() {
  return (
    <CatalogPage
      eyebrow={CAMERA_PAGE.eyebrow}
      title={CAMERA_PAGE.title}
      intro={CAMERA_PAGE.intro}
      category="may-anh"
    />
  );
}

