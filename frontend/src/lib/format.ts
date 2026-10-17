/** Tien VND dang "12.345.000đ" (lam tron, khong am). Truoc day moi trang tu viet mot ban. */
export function formatVnd(value: number) {
  return `${Math.max(0, Math.round(value || 0)).toLocaleString("vi-VN")}đ`;
}
