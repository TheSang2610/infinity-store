import { getManagedVouchers } from "@/src/services/data";
import { deleteVoucherAction, saveVoucherAction, toggleVoucherAction } from "@/src/actions/admin/vouchers";
import { formatMoney } from "@/src/lib/admin/format";
import { requireOwnerPage } from "@/src/services/admin-auth";
import { VOUCHERS_PAGE } from "@/src/constants/admin/pages";

export const dynamic = "force-dynamic";
export default async function VoucherPage({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  await requireOwnerPage("/admin/vouchers"); const query = await searchParams; const vouchers = await getManagedVouchers().catch(() => []);
  return <><div className="admin-topline"><div><span>{VOUCHERS_PAGE.eyebrow}</span><h1>{VOUCHERS_PAGE.title}</h1></div></div>
    {query.status && <p className="admin-alert success">{VOUCHERS_PAGE.saved}</p>}{query.error && <p className="admin-alert error">{query.error}</p>}
    <section className="admin-card"><div className="admin-card-head"><div><span>{VOUCHERS_PAGE.createEyebrow}</span><h2>{VOUCHERS_PAGE.createTitle}</h2></div></div><form action={saveVoucherAction} className="admin-form-grid">
      <label className="admin-field">{VOUCHERS_PAGE.code}<input name="code" required placeholder="INFINITY10" /></label>
      <label className="admin-field">{VOUCHERS_PAGE.discountType}<select name="type" defaultValue="percent"><option value="percent">{VOUCHERS_PAGE.percent}</option><option value="fixed">{VOUCHERS_PAGE.fixedAmount}</option></select></label>
      <label className="admin-field">{VOUCHERS_PAGE.value}<input name="value" required inputMode="numeric" placeholder="10" /></label>
      <label className="admin-field">{VOUCHERS_PAGE.minOrder}<input name="minOrder" inputMode="numeric" placeholder="8000000" /></label>
      <label className="admin-field">{VOUCHERS_PAGE.maxDiscount}<input name="maxDiscount" inputMode="numeric" placeholder={VOUCHERS_PAGE.maxDiscountPlaceholder} /></label>
      <label className="admin-field">{VOUCHERS_PAGE.usageLimit}<input name="usageLimit" inputMode="numeric" placeholder={VOUCHERS_PAGE.usageLimitPlaceholder} /></label>
      <label className="admin-field">{VOUCHERS_PAGE.startsAt}<input name="startsAt" type="date" /></label><label className="admin-field">{VOUCHERS_PAGE.endsAt}<input name="expiresAt" type="date" /></label>
      <label className="admin-check admin-span-2"><input name="active" type="checkbox" defaultChecked /> {VOUCHERS_PAGE.activateNow}</label><button className="admin-button admin-button-primary admin-span-2">{VOUCHERS_PAGE.create}</button>
    </form></section>
    <section className="admin-card"><div className="admin-card-head"><div><span>{vouchers.length} {VOUCHERS_PAGE.codesSuffix}</span><h2>{VOUCHERS_PAGE.listTitle}</h2></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{VOUCHERS_PAGE.codeColumn}</th><th>{VOUCHERS_PAGE.offer}</th><th>{VOUCHERS_PAGE.minOrder}</th><th>{VOUCHERS_PAGE.used}</th><th>{VOUCHERS_PAGE.validity}</th><th>{VOUCHERS_PAGE.status}</th><th>{VOUCHERS_PAGE.actions}</th></tr></thead><tbody>{vouchers.map((voucher) => <tr key={voucher.id}><td><strong>{voucher.code}</strong></td><td>{voucher.type === "percent" ? `${voucher.value}%` : formatMoney(voucher.value)}{voucher.maxDiscount > 0 && <span>{VOUCHERS_PAGE.maxPrefix}{formatMoney(voucher.maxDiscount)}</span>}</td><td>{formatMoney(voucher.minOrder)}</td><td>{voucher.usedCount}/{voucher.usageLimit || "∞"}</td><td><span>{voucher.startsAt ? new Date(voucher.startsAt).toLocaleDateString("vi-VN") : "Ngay"}</span>{voucher.expiresAt ? new Date(voucher.expiresAt).toLocaleDateString("vi-VN") : VOUCHERS_PAGE.noExpiry}</td><td><span className={`admin-badge ${voucher.active ? "status-active" : "status-inactive"}`}>{voucher.active ? VOUCHERS_PAGE.enabled : VOUCHERS_PAGE.disabled}</span></td><td><div className="admin-row-actions"><form action={toggleVoucherAction}><input type="hidden" name="id" value={voucher.id} /><input type="hidden" name="active" value={String(!voucher.active)} /><button>{voucher.active ? VOUCHERS_PAGE.disable : VOUCHERS_PAGE.enable}</button></form><form action={deleteVoucherAction}><input type="hidden" name="id" value={voucher.id} /><button>{VOUCHERS_PAGE.delete}</button></form></div></td></tr>)}</tbody></table>{!vouchers.length && <div className="admin-empty-state">{VOUCHERS_PAGE.empty}</div>}</div></section></>;
}
