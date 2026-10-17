// Ten phuong thuc thanh toan luu trong don hang. Phan co so tai khoan / so MoMo tao tu
// cai dat cua hang (services/store-settings.service.ts > paymentMethodLabels).

/** Don chuyen khoan nhan biet bang tien to nay (ke ca don cu luu "Chuyển khoản Techcombank 24/7 - ..."). */
export const BANK_TRANSFER_PREFIX = "Chuyển khoản";
export const MOMO_PREFIX = "MoMo";
export const APPLE_PAY_PAYMENT = "Apple Pay - xác nhận với cửa hàng";
export const INSTALLMENT_PAYMENT = "Trả góp qua công ty tài chính";
/** Den cua hang xem may: khong thu tien online. */
export const NO_PAYMENT = "Không áp dụng - yêu cầu tư vấn";
