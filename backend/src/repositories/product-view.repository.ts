import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { products, productViews } from "../db/schema";

const DEDUPE_MS = 30 * 60 * 1000;

/** Ghi mot luot xem; cung khach xem lai trong 30 phut thi khong tinh them. */
export async function recordProductView(productSlug: string, visitorId: string) {
  const [recent] = await getDb().select({ id: productViews.id }).from(productViews).where(and(
    eq(productViews.productSlug, productSlug),
    eq(productViews.visitorId, visitorId),
    gte(productViews.viewedAt, Date.now() - DEDUPE_MS),
  )).limit(1);
  if (recent) return false;
  await getDb().insert(productViews).values({ id: randomUUID(), productSlug, visitorId, viewedAt: Date.now() });
  return true;
}

export async function getProductViewStats() {
  const day = 24 * 60 * 60 * 1000;
  const vietnamOffset = 7 * 60 * 60 * 1000;
  const startOfToday = Math.floor((Date.now() + vietnamOffset) / day) * day - vietnamOffset;
  const counts = { views: sql<number>`count(*)::int`, visitors: sql<number>`count(DISTINCT ${productViews.visitorId})::int` };
  const db = getDb();
  const [[summary], [today], top] = await Promise.all([
    db.select(counts).from(productViews),
    db.select(counts).from(productViews).where(gte(productViews.viewedAt, startOfToday)),
    db.select({ slug: productViews.productSlug, name: sql<string>`COALESCE(${products.name}, ${productViews.productSlug})`, ...counts })
      .from(productViews)
      .leftJoin(products, eq(products.slug, productViews.productSlug))
      .groupBy(productViews.productSlug, products.name)
      .orderBy(desc(sql`count(*)`))
      .limit(8),
  ]);
  return {
    totalViews: summary?.views ?? 0,
    uniqueVisitors: summary?.visitors ?? 0,
    todayViews: today?.views ?? 0,
    todayVisitors: today?.visitors ?? 0,
    products: top,
  };
}
