import { BanksObject } from "vietnam-qr-pay";
import { APPLE_PAY_PAYMENT, BANK_TRANSFER_PREFIX, INSTALLMENT_PAYMENT, MOMO_PREFIX } from "../constants/payment";
import * as repo from "../repositories/store-settings.repository";
import type { PaymentMethodLabels, PublicStoreSettings, StoreSettings } from "../types";
import { badRequest } from "../utils/http";

// Thong tin cua hang doc tu CSDL (trang quan tri > Cai dat cua hang), khong viet cung trong code.
// Giu trong bo nho 30 giay: trang nao cung can, khong doc CSDL moi request.

const CACHE_MS = 30_000;
let cached: { value: StoreSettings; expiresAt: number } | undefined;

export function emptyStoreSettings(): StoreSettings {
  return {
    storeName: "", companyName: "", businessLicense: "", officeAddress: "", email: "",
    hotline: "", hotlineHours: "", supportHotline: "", supportHours: "", complaintHotline: "", complaintHours: "",
    consultPhone: "", zaloPhone: "", showrooms: [], socialLinks: [],
    bank: { code: "", name: "", accountNumber: "", accountName: "" },
    momo: { phone: "", accountName: "" },
    invoiceSeller: { name: "", taxCode: "", address: "", phone: "" },
  };
}

export async function getStoreSettings(): Promise<StoreSettings> {
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const value = normalize(await repo.findStoreSettings());
  cached = { value, expiresAt: Date.now() + CACHE_MS };
  return value;
}

export async function getPublicStoreSettings(): Promise<PublicStoreSettings> {
  const settings = await getStoreSettings();
  return { ...settings, paymentMethods: paymentMethodLabels(settings) };
}

export function paymentMethodLabels(settings: StoreSettings): PaymentMethodLabels {
  return {
    bankTransfer: `${BANK_TRANSFER_PREFIX} ${settings.bank.name} 24/7 - ${settings.bank.accountNumber}`,
    momo: `${MOMO_PREFIX} - ${settings.momo.phone}`,
    applePay: APPLE_PAY_PAYMENT,
    installment: INSTALLMENT_PAYMENT,
  };
}

/** Ma BIN VietQR cua ngan hang nhan tien; chua cau hinh thi bao loi ro rang. */
export function bankBin(settings: StoreSettings) {
  const bank = BanksObject[settings.bank.code as keyof typeof BanksObject];
  if (!bank || !settings.bank.accountNumber) throw badRequest("Cửa hàng chưa cấu hình tài khoản nhận chuyển khoản.");
  return bank.bin;
}

/** Link nhan tien MoMo de tao ma QR. */
export function momoReceiveLink(settings: StoreSettings) {
  if (!settings.momo.phone) throw badRequest("Cửa hàng chưa cấu hình ví MoMo nhận tiền.");
  return `https://nhantien.momo.vn/${settings.momo.phone}`;
}

export async function updateStoreSettings(input: unknown, updatedBy: string) {
  const value = validate(input);
  await repo.saveStoreSettings(value, updatedBy);
  cached = undefined;
  return value;
}

export async function seedStoreSettings(value: StoreSettings) {
  await repo.insertStoreSettingsIfMissing(normalize(value));
  cached = undefined;
}

/** Chi dung trong test. */
export function clearStoreSettingsCache() {
  cached = undefined;
}

function validate(input: unknown): StoreSettings {
  const value = normalize(input);
  if (!value.storeName) throw badRequest("Vui lòng nhập tên cửa hàng.");
  if (value.bank.code && !(value.bank.code in BanksObject)) throw badRequest("Mã ngân hàng không có trong danh sách VietQR.");
  if (value.bank.accountNumber && !/^[0-9]{6,20}$/.test(value.bank.accountNumber)) throw badRequest("Số tài khoản chỉ gồm 6-20 chữ số.");
  if (value.momo.phone && !/^0[0-9]{9}$/.test(value.momo.phone)) throw badRequest("Số MoMo phải gồm 10 chữ số, bắt đầu bằng 0.");
  if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) throw badRequest("Email cửa hàng chưa đúng định dạng.");
  for (const link of value.socialLinks) {
    if (!/^https:\/\//.test(link.url)) throw badRequest(`Liên kết "${link.label}" phải bắt đầu bằng https://.`);
  }
  return value;
}

/** Ep moi truong ve dung kieu va do dai; truong thieu thi de rong. */
function normalize(input: unknown): StoreSettings {
  const raw = asObject(input);
  const bank = asObject(raw.bank);
  const momo = asObject(raw.momo);
  const seller = asObject(raw.invoiceSeller);
  return {
    storeName: str(raw.storeName, 80),
    companyName: str(raw.companyName),
    businessLicense: str(raw.businessLicense, 300),
    officeAddress: str(raw.officeAddress, 300),
    email: str(raw.email, 120),
    hotline: str(raw.hotline, 30),
    hotlineHours: str(raw.hotlineHours, 60),
    supportHotline: str(raw.supportHotline, 30),
    supportHours: str(raw.supportHours, 60),
    complaintHotline: str(raw.complaintHotline, 30),
    complaintHours: str(raw.complaintHours, 60),
    consultPhone: str(raw.consultPhone, 30),
    zaloPhone: str(raw.zaloPhone, 30).replace(/\D/g, ""),
    showrooms: asList(raw.showrooms)
      .map((item) => ({ name: str(item.name, 80), address: str(item.address, 300) }))
      .filter((item) => item.address),
    socialLinks: asList(raw.socialLinks)
      .map((item) => ({ label: str(item.label, 40), url: str(item.url, 300) }))
      .filter((item) => item.label && item.url),
    bank: {
      code: str(bank.code, 40).toLowerCase(),
      name: str(bank.name, 60),
      accountNumber: str(bank.accountNumber, 30).replace(/\s/g, ""),
      accountName: str(bank.accountName, 120),
    },
    momo: { phone: str(momo.phone, 20).replace(/\D/g, ""), accountName: str(momo.accountName, 120) },
    invoiceSeller: {
      name: str(seller.name, 120),
      taxCode: str(seller.taxCode, 20).replace(/[^0-9-]/g, ""),
      address: str(seller.address, 300),
      phone: str(seller.phone, 30),
    },
  };
}

function str(value: unknown, max = 200) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asList(value: unknown) {
  return Array.isArray(value) ? value.slice(0, 10).map(asObject) : [];
}
