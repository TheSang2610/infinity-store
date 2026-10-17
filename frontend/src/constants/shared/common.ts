// Chu hien thi cua cac component dung chung (giao dien sang/toi, con dau, gio hang, thanh dieu huong...).

export const THEME_TOGGLE = {
  toLight: "Chuyển sang giao diện sáng",
  toDark: "Chuyển sang giao diện tối",
  usingDark: "Đang dùng chế độ tối",
  usingLight: "Đang dùng chế độ sáng",
  dark: "Chế độ tối",
  light: "Chế độ sáng",
} as const;

export const DOCUMENT_STAMP = {
  collected: "ĐÃ THU TIỀN",
  disbursed: "ĐÃ GIẢI NGÂN",
  collectedBrand: "INFINITY STORE",
  disbursedBrand: "INFINITY COMPANY",
  confirmed: "ĐÃ XÁC NHẬN",
  onDate: (date: string) => ` ngày ${date}`,
} as const;

export const ROLE_CROWN = {
  owner: "Giám đốc, vương miện vàng",
  manager: "Quản lý, vương miện bạc",
  staff: "Nhân viên, vương miện đồng",
} as const;

export const PWA_INSTALL = "Cài ứng dụng Infinity Store";

export const CART_TOAST = {
  added: "Đã thêm vào giỏ hàng!",
  close: "Đóng thông báo",
  countBefore: "Giỏ hàng hiện có ",
  countAfter: " sản phẩm",
  viewCart: "Xem giỏ hàng",
  checkout: "Thanh toán ngay →",
} as const;

export const CART_HEADER_LINK = {
  label: (count: number) => `Giỏ hàng có ${count} sản phẩm`,
  cart: "Giỏ hàng",
} as const;

export const MOBILE_APP_NAV = {
  label: "Điều hướng ứng dụng",
  items: [
    { label: "Trang chủ", href: "/", icon: "home" },
    { label: "Sản phẩm", href: "/iphone", icon: "shop" },
    { label: "Giỏ hàng", href: "/gio-hang", icon: "cart" },
    { label: "Bảo hành", href: "/bao-hanh", icon: "shield" },
    { label: "Member", href: "/member", icon: "user" },
  ],
} as const;

export const ADMIN_MOBILE_NAV = {
  label: "Đầy đủ chức năng quản lý",
  title: "Chức năng",
  hint: "Vuốt để xem tất cả",
} as const;

export const BUSINESS_PORTAL = {
  company: "Infinity Company",
  managerPortal: "Cổng quản lý chi nhánh",
  staffPortal: "Cổng làm việc nhân viên",
  viewStore: "↗ Xem cửa hàng",
  logoutWithIcon: "⇥ Đăng xuất",
  logout: "Đăng xuất",
} as const;
