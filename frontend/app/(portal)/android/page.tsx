import type { Metadata } from "next"; import { CatalogPage } from "@/src/components/features/portal/catalog/CatalogPage";
import { ANDROID_PAGE } from "@/src/constants/portal/pages";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title:ANDROID_PAGE.metaTitle, description:ANDROID_PAGE.metaDescription };
export default function Page(){return <CatalogPage category="android"/>}
