import type { Metadata } from "next";
import { CatalogPage } from "@/src/components/features/portal/catalog/CatalogPage";
import { MAC_DESKTOP_PAGE } from "@/src/constants/portal/pages";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Mac mini & Mac Studio",
  description: MAC_DESKTOP_PAGE.metaDescription,
};

export default function MacMiniStudioPage() {
  return <CatalogPage category="mac-mini-studio" />;
}
