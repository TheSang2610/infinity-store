import Link from "next/link";
import { getPublicProducts } from "@/src/services/data";
import StorefrontHero from "@/src/components/features/portal/home/StorefrontHero";
import StorefrontCommitments from "@/src/components/features/portal/home/StorefrontCommitments";
import StorefrontFlashSale from "@/src/components/features/portal/home/StorefrontFlashSale";
import StorefrontProductBlock from "@/src/components/features/portal/home/StorefrontProductBlock";
import HomeCategoryBento from "@/src/components/features/portal/home/HomeCategoryBento";
import StudentOfferBanner from "@/src/components/features/portal/home/StudentOfferBanner";
import UpcomingAppleLaunchPoster from "@/src/components/features/portal/home/UpcomingAppleLaunchPoster";
import VisualCategoryMenu from "@/src/components/features/portal/home/VisualCategoryMenu";
import HomeProductShowcases from "@/src/components/features/portal/home/HomeProductShowcases";
import { HOME_PAGE } from "@/src/constants/portal/pages";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getPublicProducts();

  const formatted = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    category: p.category,
    brand: p.brand,
    image: p.image,
    price: p.price,
    salePrice: p.salePrice,
    sellingPrice: p.sellingPrice,
    badge: p.badge,
    specs: p.specs,
    condition: p.condition,
  }));

  const cameras = formatted.filter((p) => p.category === "may-anh");

  return (
    <main id="main-content" className="storefront-refresh premium-home">
      <section className="premium-home-hero" aria-label={HOME_PAGE.featuredLabel}>
        <div className="shop-intro cps-container">
          <div className="shop-intro-brand">
            <span>INFINITY STORE</span>
            <p>{HOME_PAGE.tagline}</p>
          </div>
          <Link href="/tu-van">
            {HOME_PAGE.consult}<span aria-hidden="true">↗</span>
          </Link>
        </div>
        <StorefrontHero />
      </section>

      <section className="premium-home-navigation" aria-label={HOME_PAGE.exploreLabel}>
        <StorefrontCommitments />
        <VisualCategoryMenu />
      </section>

      <HomeCategoryBento />

      <section className="premium-home-products" aria-label={HOME_PAGE.curatedEyebrow}>
        <StorefrontFlashSale products={formatted} />
        <HomeProductShowcases products={formatted} />
      </section>

      <section className="premium-home-editorial" aria-label={HOME_PAGE.curatedTitle}>
        <UpcomingAppleLaunchPoster />
        <StudentOfferBanner />
      </section>

      <section className="premium-home-creative" aria-label={HOME_PAGE.creativeEyebrow}>
        <StorefrontProductBlock
          title={HOME_PAGE.creativeTitle}
          viewAllHref="/may-anh"
          filterTabs={[
            { label: HOME_PAGE.all, filterKey: "all" },
            { label: "FUJIFILM", filterKey: "fujifilm" },
            { label: "SONY", filterKey: "sony" },
            { label: "CANON", filterKey: "canon" },
            { label: "DJI", filterKey: "dji" },
          ]}
          products={cameras}
        />
      </section>

      <section className="premium-home-closing cps-container" aria-label={HOME_PAGE.servicesLabel}>
        <div className="cps-tradein-banner">
          <div className="cps-tradein-content">
            <span>{HOME_PAGE.tradeInEyebrow}</span>
            <h3>{HOME_PAGE.tradeInTitle}</h3>
            <p>
              {HOME_PAGE.tradeInText}</p>
          </div>
          <div className="premium-home-closing-actions">
            <Link href="/tra-gop" className="cps-tradein-cta">{HOME_PAGE.tradeInCta}</Link>
            <Link href="/tu-van" className="premium-home-advice">{HOME_PAGE.askAdvice}<span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
