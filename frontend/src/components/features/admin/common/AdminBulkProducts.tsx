"use client";

import { useRef, useState } from "react";
import { bulkDeleteProductsAction } from "@/src/actions/admin/orders-products";
import { BULK_PRODUCTS } from "@/src/constants/admin/components";

export default function AdminBulkProducts({ children }: { children: React.ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<HTMLInputElement>(null);

  const updateSelection = () => {
    const inputs = Array.from(containerRef.current?.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name="ids"]') ?? []);
    const selected = inputs.filter((input) => input.checked);
    setSelectedIds(selected.map((input) => input.value));
    if (selectionRef.current) {
      selectionRef.current.checked = inputs.length > 0 && selected.length === inputs.length;
      selectionRef.current.indeterminate = selected.length > 0 && selected.length < inputs.length;
    }
  };

  return (
    <div ref={containerRef} onChange={updateSelection}>
      <form action={bulkDeleteProductsAction} onSubmit={(event) => {
        if (!selectedIds.length || !confirm(BULK_PRODUCTS.confirmDelete(selectedIds.length))) event.preventDefault();
      }}>
        {selectedIds.map((id) => <input key={id} type="hidden" name="ids" value={id} />)}
        <div className="admin-bulkbar">
          <label className="pp-select-page"><input ref={selectionRef} type="checkbox" aria-label={BULK_PRODUCTS.selectAllLabel} onChange={(event) => {
            containerRef.current?.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name="ids"]').forEach((input) => { input.checked = event.target.checked; });
          }} /> {BULK_PRODUCTS.selectPage}</label>
          <span role="status">{selectedIds.length ? BULK_PRODUCTS.selectedCount(selectedIds.length) : BULK_PRODUCTS.hint}</span>
          <button type="submit" className="admin-button admin-button-danger" disabled={!selectedIds.length}>{BULK_PRODUCTS.deleteSelected}</button>
        </div>
      </form>
      {children}
    </div>
  );
}
