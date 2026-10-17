"use client";

import { ACCOUNT_PANEL } from "@/src/constants/portal/account";
import { FormEvent, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { SavedAddress } from "../account-model";

type AddressTabProps = {
  addresses: SavedAddress[];
  setAddresses: Dispatch<SetStateAction<SavedAddress[]>>;
};

export default function AddressTab({ addresses, setAddresses }: AddressTabProps) {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddrName, setNewAddrName] = useState("");
  const [newAddrPhone, setNewAddrPhone] = useState("");
  const [newAddrDetail, setNewAddrDetail] = useState("");
  const [newAddrCity, setNewAddrCity] = useState<string>(ACCOUNT_PANEL.cityHcm);
  const [newAddrDefault, setNewAddrDefault] = useState(false);
  const handleSaveAddress = (e: FormEvent) => {
    e.preventDefault();
    if (!newAddrName.trim() || !newAddrPhone.trim() || !newAddrDetail.trim()) return;
    const newAddr = {
      id: "addr-" + Date.now(),
      name: newAddrName.trim(),
      phone: newAddrPhone.trim(),
      address: newAddrDetail.trim(),
      city: newAddrCity,
      isDefault: newAddrDefault || addresses.length === 0,
    };
    const updated = newAddrDefault
      ? [newAddr, ...addresses.map((a) => ({ ...a, isDefault: false }))]
      : [...addresses, newAddr];
    setAddresses(updated);
    try {
      localStorage.setItem("inf_user_addresses", JSON.stringify(updated));
    } catch {}
    setShowAddressForm(false);
    setNewAddrName("");
    setNewAddrPhone("");
    setNewAddrDetail("");
  };
  const deleteAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    try {
      localStorage.setItem("inf_user_addresses", JSON.stringify(updated));
    } catch {}
  };
  const setDefaultAddress = (id: string) => {
    const updated = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    setAddresses(updated);
    try {
      localStorage.setItem("inf_user_addresses", JSON.stringify(updated));
    } catch {}
  };

  return (
    <div className="smem-section-card">
      <div className="smem-tab-header">
        <div>
          <h2>{ACCOUNT_PANEL.addressesTitle}</h2>
          <p>{ACCOUNT_PANEL.addressesText}</p>
        </div>
        <button
          type="button"
          className="smem-cta-btn"
          style={{ padding: "8px 16px", fontSize: "12.5px" }}
          onClick={() => setShowAddressForm(!showAddressForm)}
        >
          {showAddressForm ? ACCOUNT_PANEL.closeForm : ACCOUNT_PANEL.addAddress}
        </button>
      </div>

      {showAddressForm && (
        <form onSubmit={handleSaveAddress} style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
          <h4 style={{ margin: "0 0 14px", fontSize: "15px", color: "#0f172a" }}>{ACCOUNT_PANEL.newAddressTitle}</h4>
          <div className="smem-form-grid">
            <div className="smem-input-card">
              <label>{ACCOUNT_PANEL.recipientRequired}</label>
              <input required placeholder={ACCOUNT_PANEL.namePlaceholder} value={newAddrName} onChange={(e) => setNewAddrName(e.target.value)} />
            </div>
            <div className="smem-input-card">
              <label>{ACCOUNT_PANEL.recipientPhoneRequired}</label>
              <input required type="tel" placeholder="0987654321" value={newAddrPhone} onChange={(e) => setNewAddrPhone(e.target.value)} />
            </div>
            <div className="smem-input-card">
              <label>{ACCOUNT_PANEL.cityRequired}</label>
              <select value={newAddrCity} onChange={(e) => setNewAddrCity(e.target.value)}>
                <option value={ACCOUNT_PANEL.cityHcm}>{ACCOUNT_PANEL.cityHcm}</option>
                <option value={ACCOUNT_PANEL.cityHanoi}>{ACCOUNT_PANEL.cityHanoi}</option>
                <option value={ACCOUNT_PANEL.cityDanang}>{ACCOUNT_PANEL.cityDanang}</option>
                <option value={ACCOUNT_PANEL.cityCantho}>{ACCOUNT_PANEL.cityCantho}</option>
                <option value={ACCOUNT_PANEL.cityHaiphong}>{ACCOUNT_PANEL.cityHaiphong}</option>
                <option value={ACCOUNT_PANEL.cityBinhduong}>{ACCOUNT_PANEL.cityBinhduong}</option>
                <option value={ACCOUNT_PANEL.cityDongnai}>{ACCOUNT_PANEL.cityDongnai}</option>
              </select>
            </div>
            <div className="smem-input-card smem-form-full">
              <label>{ACCOUNT_PANEL.addressDetailRequired}</label>
              <input required placeholder={ACCOUNT_PANEL.addressDetailPlaceholder} value={newAddrDetail} onChange={(e) => setNewAddrDetail(e.target.value)} />
            </div>
            <div className="smem-form-full" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                id="defaultAddrCheck"
                checked={newAddrDefault}
                onChange={(e) => setNewAddrDefault(e.target.checked)}
              />
              <label htmlFor="defaultAddrCheck" style={{ fontSize: "13px", cursor: "pointer", color: "#334155" }}>
                {ACCOUNT_PANEL.setDefaultAddress}</label>
            </div>
          </div>
          <div className="smem-form-actions" style={{ display: "flex", gap: "10px" }}>
            <button type="submit" className="smem-cta-btn">{ACCOUNT_PANEL.saveAddress}</button>
            <button type="button" onClick={() => setShowAddressForm(false)} style={{ border: "1px solid #cbd5e1", background: "#fff", borderRadius: "8px", padding: "10px 18px", cursor: "pointer", fontSize: "13px" }}>{ACCOUNT_PANEL.cancel}</button>
          </div>
        </form>
      )}

      {addresses.length > 0 ? (
        <div className="smem-address-list">
          {addresses.map((addr) => (
            <div key={addr.id} className={`smem-address-card ${addr.isDefault ? "is-default" : ""}`}>
              <div className="smem-address-title-row">
                <h4>{addr.name}</h4>
                {addr.isDefault && <span className="smem-address-badge">{ACCOUNT_PANEL.default}</span>}
              </div>
              <p><strong>{ACCOUNT_PANEL.phoneLabel}</strong> {addr.phone}</p>
              <p><strong>{ACCOUNT_PANEL.addressLabel}</strong> {addr.address}, {addr.city}</p>
              <div className="smem-address-actions">
                {!addr.isDefault && (
                  <button type="button" onClick={() => setDefaultAddress(addr.id)} style={{ color: "#0284c7" }}>
                    {ACCOUNT_PANEL.makeDefault}</button>
                )}
                {addresses.length > 1 && (
                  <button type="button" onClick={() => deleteAddress(addr.id)} style={{ color: "#b91c1c" }}>
                    {ACCOUNT_PANEL.deleteAddress}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="smem-empty-box">
          <div className="smem-empty-icon">📍</div>
          <h3>{ACCOUNT_PANEL.noAddressesTitle}</h3>
          <p>{ACCOUNT_PANEL.noAddressesText}</p>
          <button type="button" className="smem-cta-btn" onClick={() => setShowAddressForm(true)}>
            {ACCOUNT_PANEL.addAddress}</button>
        </div>
      )}
    </div>
  );
}
