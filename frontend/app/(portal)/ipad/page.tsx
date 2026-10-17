import { CatalogPage } from "@/src/components/features/portal/catalog/CatalogPage";
import { IPAD_PAGE } from "@/src/constants/portal/pages";

export const dynamic = "force-dynamic";

export default function IpadPage(){
  return <CatalogPage eyebrow="Apple iPad" title={IPAD_PAGE.tagline} intro={IPAD_PAGE.intro} category="ipad" />;
}
