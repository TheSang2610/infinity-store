import type { Metadata } from "next";
import WarrantyLookup from "@/src/components/features/portal/warranty/WarrantyLookup";
import { WARRANTY_PAGE } from "@/src/constants/portal/pages";

export const metadata: Metadata = {
  title: WARRANTY_PAGE.metaTitle,
  description: WARRANTY_PAGE.metaDescription,
};

export default function WarrantyPage() {
  return <main className="warranty-page shell">
    <WarrantyLookup />
  </main>;
}
