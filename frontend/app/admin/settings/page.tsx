import { requireOwnerPage } from "@/src/services/admin-auth";
import { getEditableStoreSettings } from "@/src/services/data";
import { saveStoreSettingsAction } from "@/src/actions/admin/settings";
import { SETTINGS_TEXT as T } from "@/src/constants/admin/settings-page";

export const dynamic = "force-dynamic";

export default async function StoreSettingsPage({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  await requireOwnerPage("/admin/settings");
  const [settings, query] = await Promise.all([getEditableStoreSettings(), searchParams]);
  const text = (name: keyof typeof T.fields, value: string, extra: { wide?: boolean; type?: string; inputMode?: "tel" | "numeric" | "email" } = {}) => (
    <label className={`admin-field${extra.wide ? " admin-hr-wide" : ""}`}>
      <span>{T.fields[name]}</span>
      <input name={name} type={extra.type ?? "text"} inputMode={extra.inputMode} defaultValue={value} />
    </label>
  );

  return <>
    <div className="admin-topline"><div><span>{T.eyebrow}</span><h1>{T.title}</h1><p className="admin-subtitle">{T.subtitle}</p></div></div>
    {query.status && <p className="admin-alert success">{T.saved}</p>}
    {query.error && <p className="admin-alert error">{query.error}</p>}

    <form action={saveStoreSettingsAction} className="admin-card admin-hr-profile-form">
      <fieldset><legend>{T.sections.general}</legend><div className="admin-hr-form-grid">
        {text("storeName", settings.storeName)}
        {text("email", settings.email, { type: "email", inputMode: "email" })}
        {text("companyName", settings.companyName, { wide: true })}
        {text("businessLicense", settings.businessLicense, { wide: true })}
        {text("officeAddress", settings.officeAddress, { wide: true })}
      </div></fieldset>

      <fieldset><legend>{T.sections.contact}</legend><div className="admin-hr-form-grid">
        {text("hotline", settings.hotline, { inputMode: "tel" })}
        {text("hotlineHours", settings.hotlineHours)}
        {text("supportHotline", settings.supportHotline, { inputMode: "tel" })}
        {text("supportHours", settings.supportHours)}
        {text("complaintHotline", settings.complaintHotline, { inputMode: "tel" })}
        {text("complaintHours", settings.complaintHours)}
        {text("consultPhone", settings.consultPhone, { inputMode: "tel" })}
        {text("zaloPhone", settings.zaloPhone, { inputMode: "tel" })}
      </div></fieldset>

      <fieldset><legend>{T.sections.showrooms}</legend><div className="admin-hr-form-grid">
        <label className="admin-field admin-hr-wide">
          <span>{T.fields.showrooms}</span>
          <textarea name="showrooms" rows={3} defaultValue={settings.showrooms.map((item) => `${item.name} | ${item.address}`).join("\n")} />
          <small>{T.hints.lines}</small>
        </label>
        <label className="admin-field admin-hr-wide">
          <span>{T.fields.socialLinks}</span>
          <textarea name="socialLinks" rows={3} defaultValue={settings.socialLinks.map((item) => `${item.label} | ${item.url}`).join("\n")} />
        </label>
      </div></fieldset>

      <fieldset><legend>{T.sections.payment}</legend><div className="admin-hr-form-grid">
        <label className="admin-field">
          <span>{T.fields.bankCode}</span>
          <input name="bankCode" defaultValue={settings.bank.code} autoComplete="off" />
          <small>{T.hints.bankCode}</small>
        </label>
        {text("bankName", settings.bank.name)}
        {text("bankAccountNumber", settings.bank.accountNumber, { inputMode: "numeric" })}
        {text("bankAccountName", settings.bank.accountName)}
        {text("momoPhone", settings.momo.phone, { inputMode: "tel" })}
        {text("momoAccountName", settings.momo.accountName)}
        <p className="admin-hr-wide"><small>{T.hints.payment}</small></p>
      </div></fieldset>

      <fieldset><legend>{T.sections.invoice}</legend><div className="admin-hr-form-grid">
        {text("sellerName", settings.invoiceSeller.name)}
        {text("sellerTaxCode", settings.invoiceSeller.taxCode, { inputMode: "numeric" })}
        {text("sellerAddress", settings.invoiceSeller.address, { wide: true })}
        {text("sellerPhone", settings.invoiceSeller.phone, { inputMode: "tel" })}
      </div></fieldset>

      <div className="admin-form-actions"><button className="admin-button admin-button-primary" type="submit">{T.save}</button></div>
    </form>
  </>;
}
