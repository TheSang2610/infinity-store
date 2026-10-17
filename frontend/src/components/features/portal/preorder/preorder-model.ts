// Kieu du lieu dung chung cua cac trang dat truoc (iPhone 18 Pro, MacBook Pro).

export type Branch = { id: string; name: string; address: string; phone: string; hours: string };
export type CustomerInfo = { name: string; phone: string; email: string };
/** Ket qua dat truoc tra ve tu /api/preorders. */
export type PreorderResult = { orderCode: string; branch: Branch };
