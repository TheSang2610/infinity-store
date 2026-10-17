/** Trang nội bộ (quản trị, quản lý, nhân viên) tự có khung riêng — không hiện header, footer, chatbot hay thanh điều hướng của cửa hàng. */
const INTERNAL_PREFIXES = ["/admin", "/quan-ly", "/manager", "/manger", "/staff"];

/** Trang có giao diện riêng toàn màn hình (đặt trước) cũng ẩn khung cửa hàng. */
const STANDALONE_PREFIXES = ["/dat-truoc"];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.startsWith(`${prefix}-`));
}

export function isInternalPath(pathname: string | null | undefined) {
  return matchesPrefix(pathname ?? "", INTERNAL_PREFIXES);
}

export function hidesStorefrontChrome(pathname: string | null | undefined) {
  return isInternalPath(pathname) || matchesPrefix(pathname ?? "", STANDALONE_PREFIXES);
}
