"use client";

import { CHECKOUT } from "@/src/constants/portal/checkout";
import type { Branch, Customer } from "../checkout-model";
import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";

type ContactSectionProps = {
  customer: Customer | null;
  isStoreVisit: boolean;
  branchId: string;
  setBranchId: Dispatch<SetStateAction<string>>;
  branches: Branch[];
  selectedBranch: Branch;
  includeAppleCare: boolean;
  setIncludeAppleCare: Dispatch<SetStateAction<boolean>>;
  includeVAT: boolean;
  setIncludeVAT: Dispatch<SetStateAction<boolean>>;
  vatCompany: string;
  setVatCompany: Dispatch<SetStateAction<string>>;
  vatTaxId: string;
  setVatTaxId: Dispatch<SetStateAction<string>>;
  vatAddress: string;
  setVatAddress: Dispatch<SetStateAction<string>>;
};

export default function ContactSection({ customer, isStoreVisit, branchId, setBranchId, branches, selectedBranch, includeAppleCare, setIncludeAppleCare, includeVAT, setIncludeVAT, vatCompany, setVatCompany, vatTaxId, setVatTaxId, vatAddress, setVatAddress }: ContactSectionProps) {
  return (
    <section className="co-card" aria-labelledby="co-contact">
      <div className="co-card-head">
        <h2 id="co-contact">
          <span>2</span> {CHECKOUT.recipient}</h2>
        {customer ? (
          <em className="co-member">✓ {customer.email}</em>
        ) : (
          <Link href="/member" className="co-link">
            {CHECKOUT.loginToFill}</Link>
        )}
      </div>

      <div className="co-fields">
        <label className="co-field">
          <span>{CHECKOUT.nameRequired}</span>
          <input name="name" required defaultValue={customer?.name} placeholder={CHECKOUT.namePlaceholder} autoComplete="name" />
        </label>
        <label className="co-field">
          <span>{CHECKOUT.phoneRequired}</span>
          <input
            name="phone"
            required
            type="tel"
            defaultValue={customer?.phone}
            pattern="[0-9 +]{9,15}"
            placeholder="0901 234 567"
            autoComplete="tel"
          />
        </label>
        <label className="co-field is-wide">
          <span>{CHECKOUT.invoiceEmail}</span>
          <input name="email" type="email" defaultValue={customer?.email} placeholder="email@domain.com" autoComplete="email" />
        </label>

        {isStoreVisit ? (
          <label className="co-field is-wide">
            <span>{CHECKOUT.branchRequired}</span>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} required>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} — {b.address}
                </option>
              ))}
            </select>
            {selectedBranch && (
              <small>
                {selectedBranch.hours} · Hotline {selectedBranch.phone}
              </small>
            )}
          </label>
        ) : (
          <label className="co-field is-wide">
            <span>{CHECKOUT.addressRequired}</span>
            <input
              name="address"
              required
              placeholder={CHECKOUT.addressPlaceholder}
              autoComplete="street-address"
            />
          </label>
        )}

        <label className="co-field is-wide">
          <span>{CHECKOUT.note}</span>
          <input
            name="note"
            placeholder={isStoreVisit ? CHECKOUT.visitNotePlaceholder : CHECKOUT.deliveryNotePlaceholder}
          />
        </label>
      </div>

      <div className="co-extras">
        <label className="co-toggle">
          <input type="checkbox" checked={includeAppleCare} onChange={(e) => setIncludeAppleCare(e.target.checked)} />
          <span>
            <strong>{CHECKOUT.appleCareTitle}</strong>
            <small>{CHECKOUT.appleCareText}</small>
          </span>
          <b>{CHECKOUT.appleCarePrice}</b>
        </label>
        <label className="co-toggle">
          <input type="checkbox" checked={includeVAT} onChange={(e) => setIncludeVAT(e.target.checked)} />
          <span>
            <strong>{CHECKOUT.vatTitle}</strong>
            <small>{CHECKOUT.vatText}</small>
          </span>
        </label>
        {includeVAT && (
          <div className="co-fields co-vat">
            <label className="co-field is-wide">
              <span>{CHECKOUT.companyName}</span>
              <input value={vatCompany} onChange={(e) => setVatCompany(e.target.value)} placeholder={CHECKOUT.companyPlaceholder} />
            </label>
            <label className="co-field">
              <span>{CHECKOUT.taxCode}</span>
              <input value={vatTaxId} onChange={(e) => setVatTaxId(e.target.value)} placeholder="0312345678" />
            </label>
            <label className="co-field">
              <span>{CHECKOUT.invoiceAddress}</span>
              <input value={vatAddress} onChange={(e) => setVatAddress(e.target.value)} placeholder={CHECKOUT.invoiceAddressPlaceholder} />
            </label>
          </div>
        )}
      </div>
    </section>
  );
}
