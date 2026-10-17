import Link from "next/link";
import Image from "next/image";
import { CatalogPage } from "@/src/components/features/portal/catalog/CatalogPage";
import { MACBOOK_PAGE } from "@/src/constants/portal/pages";

export const dynamic = "force-dynamic";

export default function MacbookPage() {
  return (
    <>
      <div style={{ background: "#05070a", borderBottom: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff" }}>
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "56px", height: "38px", position: "relative", flexShrink: 0 }}>
              <Image
                src="/apple-macbook-pro/hero-macbook-pro.jpg"
                alt={MACBOOK_PAGE.promoTitle}
                fill
                sizes="56px"
                style={{ objectFit: "cover", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)" }}
              />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 750, color: "#2997ff", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "2px" }}>
                {MACBOOK_PAGE.promoChips}</div>
              <strong style={{ fontSize: "15px", color: "#f5f5f7" }}>
                {MACBOOK_PAGE.promoHeadline}</strong>
            </div>
          </div>

          <Link
            href="/dat-truoc"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 22px",
              borderRadius: "999px",
              background: "#0071e3",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(0, 113, 227, 0.35)",
              transition: "all 0.2s ease",
            }}
          >
            <span>{MACBOOK_PAGE.promoCta}</span>
            <span>→</span>
          </Link>
        </div>
      </div>
      <CatalogPage category="macbook" />
    </>
  );
}
