// Quy trinh trang thai don hang. Truoc day API nhan bat ky trang thai nao trong danh sach,
// nen don "Da giao" van doi nguoc ve "Cho xac nhan" duoc.
//
//   pending -> confirmed -> processing -> shipping -> delivered -> returned
//      |           |             |            |
//      +-----------+-------------+-> cancelled +-> returned (giao that bai, khach tra)
//
// Don den cua hang / thanh toan truoc khong qua buoc giao: confirmed / processing -> delivered.
// cancelled va returned la diem cuoi: ton kho va luot voucher da duoc tra lai, khong mo lai.

export const ORDER_STATUS_FLOW: Record<string, readonly string[]> = {
  pending: ["confirmed", "cancelled"],
  // Don rat cu luu "new" thay vi "pending".
  new: ["confirmed", "cancelled"],
  confirmed: ["processing", "shipping", "delivered", "cancelled"],
  processing: ["shipping", "delivered", "cancelled"],
  shipping: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

/** Trang thai ket thuc ma hang khong den tay khach: tra lai ton kho va luot voucher. */
export const STOCK_RELEASE_STATUSES: readonly string[] = ["cancelled", "returned"];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xác nhận",
  new: "Chờ xác nhận",
  confirmed: "Đã tiếp nhận",
  processing: "Đang xử lý",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
  returned: "Hoàn trả",
};

export function nextOrderStatuses(status: string): readonly string[] {
  return ORDER_STATUS_FLOW[status] ?? [];
}

export function canChangeOrderStatus(from: string, to: string) {
  return from === to || nextOrderStatuses(from).includes(to);
}
