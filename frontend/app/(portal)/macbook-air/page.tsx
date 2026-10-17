import { CatalogPage } from "@/src/components/features/portal/catalog/CatalogPage";
import { MACBOOK_AIR_PAGE } from "@/src/constants/portal/pages";

export const dynamic = "force-dynamic";

export default function MacbookAirPage() {
  return (
    <CatalogPage
      category="macbook"
      initialGroup="air"
      title={MACBOOK_AIR_PAGE.title}
      eyebrow={MACBOOK_AIR_PAGE.eyebrow}
      intro={MACBOOK_AIR_PAGE.intro}
    />
  );
}
