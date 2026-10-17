import type { Metadata } from "next";
import { CatalogPage } from "@/src/components/features/portal/catalog/CatalogPage";
import IPhone18ProAdBanner from "@/src/components/features/portal/home/IPhone18ProAdBanner";
import { IPHONE_PAGE } from "@/src/constants/portal/pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: IPHONE_PAGE.metaTitle,
  description: IPHONE_PAGE.metaDescription,
};

export default async function Page() {
  return (
    <>
      <IPhone18ProAdBanner variant="compact" />
      <CatalogPage category="iphone" />
    </>
  );
}
