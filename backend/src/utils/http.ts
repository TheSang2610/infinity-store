/** Loi co ma HTTP; thong diep duoc tra thang cho nguoi dung nen viet tieng Viet. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const badRequest = (message: string) => new HttpError(400, message);
export const unauthorized = (message = "Vui lòng đăng nhập.") => new HttpError(401, message);
export const forbidden = (message = "Bạn không có quyền thực hiện thao tác này.") => new HttpError(403, message);
export const notFound = (message = "Không tìm thấy dữ liệu.") => new HttpError(404, message);

/** Lay chuoi da cat khoang trang tu body/query; gia tri khac kieu thanh chuoi rong. */
export function text(value: unknown, maxLength = 600) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function nonNegativeInt(value: unknown) {
  return Math.max(0, Math.floor(Number(String(value ?? "").replace(/[^\d.-]/g, ""))) || 0);
}

/** So sanh hai lua chon (dung luong, mau...) bo qua khoang trang, dau va hoa thuong. */
export function sameOption(left?: string, right?: string) {
  return normalizeOption(left) === normalizeOption(right);
}

export function normalizeOption(value?: string) {
  return (value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d")
    .replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function slugify(raw: string) {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatMoney(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}
