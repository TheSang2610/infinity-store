import type { ManagedProduct, ProductCategory } from "../types";
import { consolidatePublicProducts, isRemovedCategory, publicFamilyKey, sortByCatalogOrder } from "./product-catalog.service";
import * as repo from "../repositories/product.repository";

/** Danh sach hien tren cua hang: da gop bien the; trang danh muc xep theo thu tu da luu. */
export async function getPublicProducts(category?: ProductCategory): Promise<ManagedProduct[]> {
  const list = consolidatePublicProducts(await repo.findActiveProducts(category));
  return category ? sortByCatalogOrder(list) : list;
}

export async function getPublicProductBySlug(slug: string): Promise<ManagedProduct | undefined> {
  let target = await repo.findActiveBySlug(slug);
  if (!target) {
    // Link dang "iphone-17" trong khi CSDL chi co "iphone-17-256gb".
    target = (await repo.findActiveBySlugPrefix(slug)).find((item) => publicFamilyKey(item.slug) === slug);
  }
  if (!target || isRemovedCategory(target.category)) return undefined;

  const family = publicFamilyKey(target.slug);
  const members = (await repo.findActiveInCategory(target.category)).filter((item) => publicFamilyKey(item.slug) === family);
  return consolidatePublicProducts(members)[0];
}

/** Danh sach cho trang quan tri: ban ghi goc trong CSDL. */
export async function getManagedProducts() {
  return repo.findAllProducts();
}

export async function getManagedProductById(id: string) {
  return repo.findProductById(id);
}
