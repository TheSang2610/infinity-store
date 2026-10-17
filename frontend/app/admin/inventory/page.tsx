import Image from "next/image";
import Link from "next/link";
import { requireInventoryPage } from "@/src/services/admin-auth";
import { getBranches, getBranchInventory, getInventoryMovements } from "@/src/services/data";

import { adjustInventoryAction } from "@/src/actions/admin/inventory";
import { INVENTORY_PAGE } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";
const pageSize = 24;

type InventoryQuery = { branch?: string; q?: string; stock?: string; page?: string; status?: string; error?: string };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<InventoryQuery> }) {
  const [user, query, branches] = await Promise.all([requireInventoryPage(), searchParams, getBranches(false).catch(() => [])]);
  const selectedBranchId = user.role === "owner" ? (branches.some((item) => item.id === query.branch) ? query.branch! : branches[0]?.id || "") : user.branchId;
  const branch = branches.find((item) => item.id === selectedBranchId);
  const [allItems, movements] = branch
    ? await Promise.all([getBranchInventory(branch.id), getInventoryMovements(branch.id)])
    : [[], []];
  const keyword = (query.q || "").trim().toLocaleLowerCase("vi-VN").slice(0, 100);
  const stockFilter = query.stock === "out" || query.stock === "low" || query.stock === "available" ? query.stock : "";
  const filtered = allItems.filter(({ product, quantity }) => {
    if (keyword && !`${product.name} ${product.sku || ""} ${product.brand}`.toLocaleLowerCase("vi-VN").includes(keyword)) return false;
    if (stockFilter === "out" && quantity !== 0) return false;
    if (stockFilter === "low" && (quantity <= 0 || quantity > 3)) return false;
    if (stockFilter === "available" && quantity <= 0) return false;
    return true;
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(pageCount, Math.max(1, Number(query.page) || 1));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalUnits = allItems.reduce((sum, item) => sum + item.quantity, 0);
  const statusMessage = query.status === "receive" ? INVENTORY_PAGE.imported : query.status === "issue" ? INVENTORY_PAGE.exported : query.status === "count" ? INVENTORY_PAGE.counted : "";

  return <>
    <div className="admin-topline inventory-heading">
      <div><span>{INVENTORY_PAGE.eyebrow}</span><h1>{INVENTORY_PAGE.title}</h1><p className="admin-subtitle">{INVENTORY_PAGE.text}</p></div>
      {branch && <div className="inventory-branch-chip"><span>{INVENTORY_PAGE.currentBranch}</span><strong>{branch.code} · {branch.name}</strong></div>}
    </div>
    {statusMessage && <p className="admin-alert success">{statusMessage}</p>}
    {query.error && <p className="admin-alert error">{query.error}</p>}
    {!branch && <p className="admin-alert error">{INVENTORY_PAGE.noBranch}</p>}

    <form className="admin-toolbar inventory-toolbar">
      {user.role === "owner" && <select name="branch" defaultValue={selectedBranchId}>{branches.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select>}
      <input name="q" defaultValue={query.q || ""} placeholder={INVENTORY_PAGE.searchPlaceholder} />
      <select name="stock" defaultValue={stockFilter}><option value="">{INVENTORY_PAGE.allStock}</option><option value="available">{INVENTORY_PAGE.inStock}</option><option value="low">{INVENTORY_PAGE.lowStockFilter}</option><option value="out">{INVENTORY_PAGE.outOfStock}</option></select>
      <button className="admin-button" type="submit">{INVENTORY_PAGE.filter}</button>
      <Link className="admin-button" href={user.role === "owner" && selectedBranchId ? `/admin/inventory?branch=${encodeURIComponent(selectedBranchId)}` : "/admin/inventory"}>{INVENTORY_PAGE.reset}</Link>
    </form>

    <section className="admin-report-kpis inventory-kpis">
      <InventoryMetric icon="▦" label={INVENTORY_PAGE.productCode} value={String(allItems.length)} note={INVENTORY_PAGE.codesNote} />
      <InventoryMetric icon="■" label={INVENTORY_PAGE.totalQuantity} value={totalUnits.toLocaleString("vi-VN")} note={INVENTORY_PAGE.atBranch(branch?.name || INVENTORY_PAGE.branchWord)} />
      <InventoryMetric icon="△" label={INVENTORY_PAGE.lowStock} value={String(allItems.filter((item) => item.quantity > 0 && item.quantity <= 3).length)} note={INVENTORY_PAGE.lowStockNote} />
      <InventoryMetric icon="×" label={INVENTORY_PAGE.outOfStock} value={String(allItems.filter((item) => item.quantity === 0).length)} note={INVENTORY_PAGE.outOfStockNote} />
    </section>

    <section className="admin-card inventory-directory">
      <div className="admin-card-head"><div><span>{filtered.length} {INVENTORY_PAGE.matchingProducts}</span><h2>{INVENTORY_PAGE.listTitle}</h2></div><small>{INVENTORY_PAGE.legend}</small></div>
      <div className="admin-table-wrap"><table className="admin-table inventory-table"><thead><tr><th>{INVENTORY_PAGE.product}</th><th>SKU</th><th>{INVENTORY_PAGE.systemStock}</th><th>{INVENTORY_PAGE.branchStock}</th><th>{INVENTORY_PAGE.lastUpdated}</th><th>{INVENTORY_PAGE.adjust}</th></tr></thead><tbody>{visible.map(({ product, quantity, updatedAt }) => <tr key={product.id}>
        <td><div className="inventory-product"><Image src={product.image} alt="" width={48} height={48} unoptimized /><span><strong>{product.name}</strong><small>{product.brand} · {product.category}</small></span></div></td>
        <td>{product.sku || product.slug}</td>
        <td>{product.stock ?? 0}</td>
        <td><strong className={`inventory-quantity ${quantity === 0 ? "is-out" : quantity <= 3 ? "is-low" : ""}`}>{quantity}</strong></td>
        <td>{updatedAt ? formatTimestamp(updatedAt) : INVENTORY_PAGE.notCounted}</td>
        <td><form action={adjustInventoryAction} className="inventory-adjust-form"><input type="hidden" name="branchId" value={selectedBranchId}/><input type="hidden" name="productId" value={product.id}/><select name="operation" aria-label={INVENTORY_PAGE.adjustLabel(product.name)}><option value="receive">{INVENTORY_PAGE.import}</option><option value="issue">{INVENTORY_PAGE.export}</option><option value="count">{INVENTORY_PAGE.count}</option></select><input name="quantity" type="number" min="0" max="100000" step="1" defaultValue="1" required aria-label={INVENTORY_PAGE.quantityLabel(product.name)}/><input name="note" maxLength={240} placeholder={INVENTORY_PAGE.reference} aria-label={INVENTORY_PAGE.noteLabel(product.name)}/><button type="submit">{INVENTORY_PAGE.update}</button></form></td>
      </tr>)}</tbody></table>{!visible.length && <div className="admin-empty-state">{INVENTORY_PAGE.empty}</div>}</div>
      {pageCount > 1 && <div className="admin-pagination">{Array.from({ length: pageCount }, (_, index) => <Link key={index} className={page === index + 1 ? "is-active" : ""} href={pageHref(query, selectedBranchId, index + 1)}>{index + 1}</Link>)}</div>}
    </section>

    <section className="admin-card inventory-history">
      <div className="admin-card-head"><div><span>{movements.length} {INVENTORY_PAGE.recentTransactions}</span><h2>{INVENTORY_PAGE.historyTitle}</h2></div><small>{INVENTORY_PAGE.historyText}</small></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{INVENTORY_PAGE.time}</th><th>{INVENTORY_PAGE.product}</th><th>{INVENTORY_PAGE.operation}</th><th>{INVENTORY_PAGE.quantity}</th><th>{INVENTORY_PAGE.beforeAfter}</th><th>{INVENTORY_PAGE.actor}</th><th>{INVENTORY_PAGE.note}</th></tr></thead><tbody>{movements.map((item) => <tr key={item.id}><td>{formatTimestamp(item.createdAt)}</td><td><strong>{item.productName}</strong></td><td><span className={`inventory-operation is-${item.operation}`}>{operationLabel(item.operation)}</span></td><td>{item.quantity}</td><td><strong>{item.beforeQuantity} → {item.afterQuantity}</strong></td><td>{item.actorName}</td><td>{item.note || "—"}</td></tr>)}</tbody></table>{!movements.length && <div className="admin-empty-state">{INVENTORY_PAGE.noHistory}</div>}</div>
    </section>
  </>;
}

function InventoryMetric({ icon, label, value, note }: { icon: string; label: string; value: string; note: string }) { return <article><i>{icon}</i><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>; }
function operationLabel(value: string) { if (value === "issue") return INVENTORY_PAGE.opExport; if (value === "count") return INVENTORY_PAGE.opCount; return INVENTORY_PAGE.opImport; }
function formatTimestamp(value: number) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value)); }
function pageHref(query: InventoryQuery, branchId: string, page: number) { const params = new URLSearchParams(); if (branchId) params.set("branch", branchId); if (query.q) params.set("q", query.q); if (query.stock) params.set("stock", query.stock); params.set("page", String(page)); return `/admin/inventory?${params.toString()}`; }
