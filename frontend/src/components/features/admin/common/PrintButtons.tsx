"use client";
import { PRINT_BUTTONS } from "@/src/constants/admin/components";

export default function PrintButtons() {
  function printDocument(type: "order" | "invoice") {
    document.body.dataset.printDocument = type;
    window.print();
    delete document.body.dataset.printDocument;
  }

  return (
    <>
      <button className="admin-button" type="button" onClick={() => printDocument("order")}>{PRINT_BUTTONS.order}</button>
      <button className="admin-button admin-button-primary" type="button" onClick={() => printDocument("invoice")}>{PRINT_BUTTONS.invoice}</button>
    </>
  );
}
