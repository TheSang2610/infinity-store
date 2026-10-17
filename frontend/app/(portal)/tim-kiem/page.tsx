import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/src/components/features/portal/catalog/ProductCard";
import { getPublicProducts } from "@/src/services/data";
import { SEARCH_PAGE } from "@/src/constants/portal/pages";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: SEARCH_PAGE.metaTitle,
  description: SEARCH_PAGE.metaDescription,
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = cleanQuery((await searchParams).q);
  const products = await getPublicProducts();
  const normalizedQuery = normalize(query);
  const results = normalizedQuery
    ? products.filter((product) => normalize([
        product.name,
        product.slug,
        product.brand,
        product.category,
        product.tagline,
        ...(product.specs ?? []),
      ].filter(Boolean).join(" ")).includes(normalizedQuery))
    : [];

  return (
    <main className="store-search-page">
      <div className="store-search-shell">
        <nav className="store-search-breadcrumb" aria-label={SEARCH_PAGE.breadcrumb}>
          <Link href="/">{SEARCH_PAGE.home}</Link><span>›</span><span>{SEARCH_PAGE.search}</span>
        </nav>

        <section className="store-search-heading">
          <p>{SEARCH_PAGE.eyebrow}</p>
          <h1>{query ? SEARCH_PAGE.resultsFor(query) : SEARCH_PAGE.title}</h1>
          <form action="/tim-kiem" role="search">
            <input name="q" defaultValue={query} placeholder={SEARCH_PAGE.placeholder} autoFocus={!query} />
            <button type="submit">{SEARCH_PAGE.search}</button>
          </form>
          {query && <small>{SEARCH_PAGE.foundPrefix}{results.length} {SEARCH_PAGE.foundSuffix}</small>}
        </section>

        {query && results.length > 0 ? (
          <section className="store-search-grid" aria-label={SEARCH_PAGE.results}>
            {results.map((product) => <ProductCard key={product.slug} product={product} />)}
          </section>
        ) : query ? (
          <section className="store-search-empty">
            <span aria-hidden="true">⌕</span>
            <h2>{SEARCH_PAGE.emptyTitle}</h2>
            <p>{SEARCH_PAGE.emptyText}</p>
            <Link href="/">{SEARCH_PAGE.exploreFeatured}</Link>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function cleanQuery(value: string | undefined) {
  return String(value || "").trim().slice(0, 80);
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
