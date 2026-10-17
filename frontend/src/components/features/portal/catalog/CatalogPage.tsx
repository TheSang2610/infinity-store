import React from "react";
import Link from "next/link";
import type { Product } from "@/src/lib/products";
import { getPublicProducts } from "@/src/services/data";
import CatalogCampaign from "@/src/components/features/portal/catalog/CatalogCampaign";
import { categoryCampaigns } from "@/src/constants/portal/category-campaigns";
import CatalogProductBrowser from "@/src/components/features/portal/catalog/CatalogProductBrowser";
import CategoryFamilyTiles from "@/src/components/features/portal/catalog/CategoryFamilyTiles";
import { canManageProducts, currentAdminUser } from "@/src/services/admin-auth";
import { CATALOG_PAGE } from "@/src/constants/portal/catalog";
export { default as ProductCard } from "@/src/components/features/portal/catalog/ProductCard";

const categoryNames: Record<string, string> = {
  "may-anh": CATALOG_PAGE.titleCamera,
  "phu-kien": CATALOG_PAGE.titleAccessories,
  iphone: CATALOG_PAGE.titleIphone,
  ipad: CATALOG_PAGE.titleIpad,
  macbook: CATALOG_PAGE.titleMacbook,
  "mac-mini-studio": CATALOG_PAGE.titleMacDesktop,
  imac: CATALOG_PAGE.titleImac,
  laptop: CATALOG_PAGE.titleLaptop,
  "laptop-cu": CATALOG_PAGE.titleUsedLaptop,
  android: CATALOG_PAGE.titleAndroid,
  audio: CATALOG_PAGE.titleAudio,
  smartwatch: CATALOG_PAGE.titleSmartwatch,
};

export async function CatalogPage({
  category,
  initialGroup,
  eyebrow,
  title,
  intro,
}: {
  eyebrow?: string;
  title?: string;
  intro?: string;
  initialGroup?: string;
  category: Product["category"];
}) {
  const [publicProducts, admin] = await Promise.all([
    getPublicProducts(category),
    currentAdminUser(),
  ]);
  // Backend da sap thu tu san pham theo danh muc.
  const list = publicProducts;
  const showProductEditor = canManageProducts(admin);
  const campaign = categoryCampaigns[category];
  const catTitle = title || categoryNames[category] || CATALOG_PAGE.titleDefault;

  return (
    <main
      className={`catalog-storefront catalog-storefront-${category}`}
      style={{
        backgroundColor: "#f4f4f4",
        minHeight: "80vh",
        paddingBottom: "50px",
      }}
    >
      <div className="cps-container shell" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 12px" }}>
        {/* Breadcrumb Navigation */}
        <nav
          className="cps-breadcrumb"
          aria-label={CATALOG_PAGE.breadcrumbLabel}
          style={{
            fontSize: "12.5px",
            color: "#64748b",
            padding: "12px 0 8px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          <Link href="/" style={{ color: "#0071e3", textDecoration: "none", fontWeight: 500 }}>
            {CATALOG_PAGE.home}</Link>
          <span style={{ color: "#94a3b8" }}>›</span>
          <span style={{ color: "#1e293b", fontWeight: 600 }}>{catTitle}</span>
        </nav>

        {(category === "iphone" || category === "ipad" || category === "macbook") && (
          <CategoryFamilyTiles category={category} />
        )}

        <CatalogCampaign category={category} />

        <section className="catalog-products-section" id="catalog-products" style={{ padding: "10px 0" }}>
          {/* Category Header Banner */}
          <header
            className="catalog-products-heading cps-catalog-heading"
            style={{
              background: "#ffffff",
              borderRadius: "10px",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
              marginBottom: "16px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span
                  style={{
                    background: "#f0f7ff",
                    color: "#0071e3",
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    border: "1px solid #bae6fd",
                  }}
                >
                  {eyebrow || CATALOG_PAGE.genuineBadge}
                </span>
                <span style={{ fontSize: "12px", color: "#64748b" }}>{CATALOG_PAGE.deliveryBadge}</span>
              </div>
              <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "2px 0 4px" }}>
                {campaign?.sectionTitle ?? catTitle}
              </h1>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                {intro || campaign?.sectionNote || CATALOG_PAGE.intro}
              </p>
            </div>

            <div
              className="catalog-count"
              style={{
                background: "#f0f7ff",
                border: "1px solid #bae6fd",
                borderRadius: "8px",
                padding: "8px 16px",
                textAlign: "center",
              }}
            >
              <strong style={{ fontSize: "18px", color: "#0071e3", display: "block" }}>{list.length}</strong>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>{CATALOG_PAGE.products}</span>
            </div>
          </header>

          {campaign?.offers?.length ? (
            <div
              className="catalog-offers"
              aria-label={CATALOG_PAGE.offersLabel}
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginBottom: "16px",
                fontSize: "12px",
              }}
            >
              <strong style={{ color: "#0071e3", alignSelf: "center" }}>{CATALOG_PAGE.offersPrefix}</strong>
              {campaign.offers.map((offer, index) => (
                <span
                  className={index === 0 ? "is-primary" : ""}
                  key={offer}
                  style={{
                    background: index === 0 ? "#0071e3" : "#ffffff",
                    color: index === 0 ? "#ffffff" : "#334155",
                    border: "1px solid #bae6fd",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontWeight: 600,
                  }}
                >
                  {offer}
                </span>
              ))}
            </div>
          ) : null}

          {(category === "iphone" || category === "macbook") && (
            <aside
              className="student-promotion"
              aria-label={CATALOG_PAGE.studentOfferLabel}
              style={{
                background: "#f0f7ff",
                border: "1px dashed #0071e3",
                borderRadius: "8px",
                padding: "10px 14px",
                marginBottom: "16px",
                fontSize: "12px",
              }}
            >
              <div>
                <span style={{ color: "#0071e3", fontWeight: 800 }}>{CATALOG_PAGE.studentOfferTitle}</span>
                <strong style={{ color: "#0f172a" }}>{CATALOG_PAGE.studentOfferDiscount}</strong>
              </div>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "11.5px" }}>
                {CATALOG_PAGE.studentOfferTerms}</p>
            </aside>
          )}

          <CatalogProductBrowser
            products={list}
            category={category}
            initialGroup={initialGroup}
            canManageProducts={showProductEditor}
          />
        </section>
      </div>
    </main>
  );
}
