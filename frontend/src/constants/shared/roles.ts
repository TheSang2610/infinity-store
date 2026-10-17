// Ten vai tro nhan vien (truoc day moi trang tu viet mot ham roleLabel rieng, ten lech nhau).

export const ROLE_LABELS: Record<string, string> = {
  owner: "Giám đốc",
  manager: "Quản lý chi nhánh",
  sales: "Nhân viên bán hàng",
  consultant: "Nhân viên tư vấn",
  warranty: "Nhân viên bảo hành",
  repair: "Nhân viên sửa chữa",
  inventory: "Nhân viên kho",
};

/** Ban ngan cho the nhan vien, o loc. */
export const ROLE_SHORT_LABELS: Record<string, string> = {
  owner: "Giám đốc",
  manager: "Quản lý",
  sales: "Bán hàng",
  consultant: "Tư vấn",
  warranty: "Bảo hành",
  repair: "Sửa chữa",
  inventory: "Kho",
};

export function roleLabel(role: string) {
  return ROLE_LABELS[role] ?? ROLE_LABELS.sales;
}

export function roleShortLabel(role: string) {
  return ROLE_SHORT_LABELS[role] ?? ROLE_SHORT_LABELS.sales;
}
