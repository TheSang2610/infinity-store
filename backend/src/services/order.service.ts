import { preorderProducts } from "../constants/preorder-products";
import { calculateInstallmentPlan, DOWN_PAYMENT_OPTIONS, FINANCE_COMPANIES, INSTALLMENT_TERMS, MIN_INSTALLMENT_TOTAL } from "../utils/installment";
import { badRequest, sameOption, text } from "../utils/http";
import { productUnitPrice } from "../utils/order-pricing";
import type { Customer, ManagedOrder, ManagedProduct, OrderInput, OrderItem } from "../types";
import { getBranches } from "../repositories/branch.repository";
import { getPublicProducts } from "./product.service";
import { redeemVoucher, releaseVoucher, validateVoucher } from "../repositories/voucher.repository";
import { INSTALLMENT_PAYMENT, NO_PAYMENT } from "../constants/payment";
import { createOrder, generateOrderCode, getWarrantyOrder } from "../repositories/order.repository";
import { reserveStock, restoreStock } from "../repositories/stock.repository";
import { getStoreSettings, paymentMethodLabels } from "./store-settings.service";

const HOME_DELIVERY = "Giao hàng tận nơi";
const STORE_VISIT = "Đến cửa hàng xem máy";
const PAYMENT_FIRST = "Thanh toán trước - bổ sung giao nhận sau";
const FINANCE_RATES = new Map<string, number>(FINANCE_COMPANIES.map((company) => [company.name, company.monthlyRate]));
const MAX_ITEMS = 20;

type Payload = Record<string, unknown>;

/**
 * Dat hang. Ba kieu:
 * - Giao tan noi: bat buoc dia chi va thanh toan online (khong con COD).
 * - Den cua hang xem may: chon chi nhanh, khong thanh toan, khong dung voucher.
 * - Thanh toan truoc (chi chuyen khoan): bo sung thong tin giao nhan sau.
 * Gia luon tinh lai o may chu; ma don do may chu sinh.
 * Ton kho tru ngay luc dat (thieu hang thi bao loi); don bi huy / tra hang thi cong lai
 * (repositories/order.repository.ts > updateOrderStatus).
 */
export async function placeOrder(payload: Payload, customer: Customer | undefined) {
  const order = await normalizeOrder(payload, customer);
  await reserveStock(order.items);
  order.items = order.items.map((item) => ({ ...item, stockReserved: true }));

  const voucherReserved = Boolean(order.voucherCode);
  try {
    if (voucherReserved) await redeemVoucher(order.voucherCode);
  } catch (error) {
    await restoreStock(order.items);
    throw error;
  }
  try {
    const saved = await createOrder(order);
    return { ...saved, total: Number(order.total) || 0, discount: Number(order.discount) || 0 };
  } catch (error) {
    await restoreStock(order.items);
    if (voucherReserved) await releaseVoucher(order.voucherCode);
    throw error;
  }
}

async function normalizeOrder(payload: Payload, customer: Customer | undefined): Promise<OrderInput> {
  const requestedDelivery = text(payload.deliveryMethod);
  const isPaymentFirst = requestedDelivery === PAYMENT_FIRST;
  const isStoreVisit = requestedDelivery === STORE_VISIT;
  const customerName = text(payload.customerName) || (isPaymentFirst ? customer?.name || "Khách thanh toán trực tuyến" : "");
  const phone = text(payload.phone) || (isPaymentFirst ? customer?.phone || "Chưa cung cấp" : "");
  if (!customerName || !phone) throw badRequest("Vui lòng nhập họ tên, số điện thoại và sản phẩm cần đặt.");

  const products = await getPublicProducts();
  const requested = Array.isArray(payload.items) && payload.items.length
    ? payload.items
    : [{ productSlug: payload.productSlug, ram: payload.ram, storage: payload.storage, color: payload.color, quantity: payload.quantity }];
  const items = normalizeItems(requested, products);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const voucher = isStoreVisit ? { code: "", discount: 0 } : await validateVoucher(text(payload.voucherCode), subtotal);
  const total = subtotal - voucher.discount;

  const paymentMethod = isStoreVisit ? NO_PAYMENT : text(payload.paymentMethod);
  const branch = isStoreVisit ? (await getBranches(false)).find((item) => item.id === text(payload.branchId)) : undefined;
  if (isStoreVisit && !branch) throw badRequest("Vui lòng chọn chi nhánh muốn đến xem máy.");
  if (!isStoreVisit && !isPaymentFirst && requestedDelivery !== HOME_DELIVERY) throw badRequest("Đơn online phải chọn giao hàng tận nơi.");
  if (!isStoreVisit && !isPaymentFirst && text(payload.address).length < 5) throw badRequest("Vui lòng nhập địa chỉ giao hàng.");
  const payments = paymentMethodLabels(await getStoreSettings());
  if (!isStoreVisit && ![payments.bankTransfer, payments.momo, payments.applePay, payments.installment].includes(paymentMethod)) {
    throw badRequest("Vui lòng chọn phương thức thanh toán online hợp lệ. COD không còn được hỗ trợ.");
  }
  if (isPaymentFirst && paymentMethod !== payments.bankTransfer) throw badRequest("Phiên thanh toán nhanh chỉ hỗ trợ chuyển khoản ngân hàng.");
  const installment = paymentMethod === INSTALLMENT_PAYMENT ? normalizeInstallment(payload, total) : undefined;

  const first = items[0];
  const single = items.length === 1;
  return {
    orderCode: generateOrderCode("HA"),
    customerName,
    phone,
    email: text(payload.email),
    productSlug: single ? first.productSlug : "gio-hang",
    productName: single ? first.productName : `${items.length} sản phẩm trong giỏ hàng`,
    color: single ? first.color : "Nhiều màu",
    storage: single
      ? [first.ram && `${first.ram} RAM`, first.storage && `${first.storage} SSD`].filter(Boolean).join(" / ")
      : "Nhiều cấu hình",
    quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    deliveryMethod: isStoreVisit ? STORE_VISIT : isPaymentFirst ? PAYMENT_FIRST : HOME_DELIVERY,
    address: isStoreVisit ? branch?.address ?? "" : isPaymentFirst ? "Bổ sung sau khi thanh toán" : text(payload.address),
    paymentMethod,
    total: total > 0 ? String(total) : "",
    discount: String(voucher.discount),
    voucherCode: voucher.code,
    branchId: branch?.id ?? "",
    branchName: branch?.name ?? "",
    items,
    customerId: customer?.id ?? "",
    contactTime: text(payload.contactTime),
    note: text(payload.note),
    financeCompany: installment?.financeCompany ?? "",
    installmentName: installment?.installmentName ?? "",
    installmentPhone: installment?.installmentPhone ?? "",
    dateOfBirth: installment?.dateOfBirth ?? "",
    citizenId: installment?.citizenId ?? "",
    citizenIdIssueDate: installment?.citizenIdIssueDate ?? "",
    citizenIdIssuePlace: installment?.citizenIdIssuePlace ?? "",
    downPaymentPercent: installment?.downPaymentPercent ?? 0,
    downPaymentAmount: installment ? String(installment.plan.downPaymentAmount) : "",
    financedAmount: installment ? String(installment.plan.financedAmount) : "",
    installmentTerm: installment?.installmentTerm ?? 0,
    monthlyPayment: installment ? String(installment.plan.monthlyPayment) : "",
    estimatedInterest: installment ? String(installment.plan.interestAmount) : "",
  };
}

function normalizeInstallment(payload: Payload, total: number) {
  const financeCompany = text(payload.financeCompany);
  const installmentName = text(payload.installmentName);
  const installmentPhone = text(payload.installmentPhone);
  const dateOfBirth = cleanDate(payload.dateOfBirth, "ngày sinh");
  const citizenId = text(payload.citizenId).replace(/\D/g, "");
  const citizenIdIssueDate = cleanDate(payload.citizenIdIssueDate, "ngày cấp CCCD");
  const citizenIdIssuePlace = text(payload.citizenIdIssuePlace);
  const downPaymentPercent = Number(payload.downPaymentPercent);
  const installmentTerm = Number(payload.installmentTerm);

  const monthlyRate = FINANCE_RATES.get(financeCompany);
  if (monthlyRate === undefined) throw badRequest("Vui lòng chọn công ty tài chính cần tư vấn.");
  if (total < MIN_INSTALLMENT_TOTAL) throw badRequest("Trả góp qua công ty tài chính chỉ áp dụng cho đơn hàng từ 8.000.000đ.");
  if (!(DOWN_PAYMENT_OPTIONS as readonly number[]).includes(downPaymentPercent)
    || !(INSTALLMENT_TERMS as readonly number[]).includes(installmentTerm)) {
    throw badRequest("Vui lòng chọn mức trả trước và kỳ hạn hợp lệ.");
  }
  if (!installmentName || !/^[0-9 +]{9,15}$/.test(installmentPhone)) throw badRequest("Vui lòng nhập đúng họ tên và số điện thoại đăng ký trả góp.");
  if (!/^\d{12}$/.test(citizenId)) throw badRequest("Số CCCD phải gồm đúng 12 chữ số.");
  if (!citizenIdIssuePlace) throw badRequest("Vui lòng nhập nơi cấp CCCD.");
  if (citizenIdIssueDate < dateOfBirth) throw badRequest("Ngày cấp CCCD không thể trước ngày sinh.");
  if (payload.installmentConsent !== true) throw badRequest("Vui lòng đồng ý chuyển hồ sơ cho công ty tài chính đã chọn.");

  return {
    financeCompany, installmentName, installmentPhone, dateOfBirth, citizenId, citizenIdIssueDate,
    citizenIdIssuePlace, downPaymentPercent, installmentTerm,
    plan: calculateInstallmentPlan(total, downPaymentPercent, installmentTerm, monthlyRate),
  };
}

function normalizeItems(rawItems: unknown[], products: ManagedProduct[]): OrderItem[] {
  if (!rawItems.length || rawItems.length > MAX_ITEMS) throw badRequest(`Giỏ hàng phải có từ 1 đến ${MAX_ITEMS} sản phẩm.`);
  return rawItems.map((raw) => {
    const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const productSlug = text(input.productSlug);
    const product = products.find((item) => item.slug === productSlug);
    if (!product) throw badRequest("Có sản phẩm trong giỏ không còn được bán.");

    const ram = text(input.ram);
    const storage = text(input.storage);
    const color = text(input.color);
    const quantity = Math.min(10, Math.max(1, Math.floor(Number(input.quantity)) || 1));
    const variants = product.variants ?? [];
    if (product.storageOptions?.length && !product.storageOptions.some((option) => sameOption(option, storage))) {
      throw badRequest(`Dung lượng của ${product.name} không hợp lệ.`);
    }
    const rams = variants.map((variant) => variant.ram).filter(Boolean);
    if (rams.length && !rams.some((option) => sameOption(option, ram))) throw badRequest(`RAM của ${product.name} không hợp lệ.`);
    const matching = variants.filter((variant) => (!ram || sameOption(variant.ram, ram)) && (!storage || sameOption(variant.storage, storage)));
    const colors = matching.map((variant) => variant.color).filter(Boolean);
    if (colors.length && !colors.some((option) => sameOption(option, color))) throw badRequest(`Màu của ${product.name} không hợp lệ.`);

    const unitPrice = productUnitPrice(product, storage, color, ram);
    if (unitPrice <= 0) throw badRequest(`${product.name} chưa có giá hợp lệ.`);
    const image = matching.find((variant) => sameOption(variant.color, color))?.image || product.image;
    return { productSlug, productName: product.name, ram, storage, color, quantity, unitPrice, image };
  });
}

/** Dang ky dat truoc may sap ra mat: khong thu coc, nhan may tai chi nhanh. */
export async function placePreorder(body: Payload, customer: Customer | undefined) {
  const product = preorderProducts.find((item) => item.id === text(body.productId, 60));
  if (!product) throw badRequest("Sản phẩm đặt trước không hợp lệ.");
  const configuration = text(body.configuration, 100);
  const color = text(body.color, 60);
  if (!configuration || !color) throw badRequest("Vui lòng chọn đúng cấu hình và màu sắc mong muốn.");

  const customerName = text(body.customerName, 100).replace(/\s+/g, " ");
  const phone = text(body.phone, 20).replace(/[ .-]/g, "");
  const email = text(body.email, 160).toLowerCase();
  if (customerName.length < 2 || !/^\+?\d{9,12}$/.test(phone)) throw badRequest("Vui lòng nhập đúng họ tên và số điện thoại liên hệ.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw badRequest("Địa chỉ email không hợp lệ.");

  const branch = (await getBranches(false)).find((item) => item.id === text(body.branchId, 60));
  if (!branch) throw badRequest("Vui lòng chọn một chi nhánh đang hoạt động để nhận máy.");

  const quantity = Math.min(5, Math.max(1, Math.floor(Number(body.quantity)) || 1));
  const contactTime = text(body.contactTime, 60) || "Bất kỳ thời gian nào";
  const customerNote = text(body.note, 500);
  const productSlug = `preorder-${product.id}`;
  const order: OrderInput = {
    orderCode: generateOrderCode("DT"),
    customerName,
    phone,
    email,
    productSlug,
    productName: product.name,
    color,
    storage: configuration,
    quantity,
    deliveryMethod: STORE_VISIT,
    address: branch.address,
    paymentMethod: NO_PAYMENT,
    total: "",
    discount: "",
    voucherCode: "",
    items: [{ productSlug, productName: product.name, ram: "", storage: configuration, color, quantity, unitPrice: 0, image: product.image }],
    customerId: customer?.id ?? "",
    contactTime,
    note: [
      "[ĐẶT TRƯỚC · KHÔNG THU CỌC]",
      `Nhóm sản phẩm: ${product.familyLabel}`,
      `Thời gian liên hệ: ${contactTime}`,
      customerNote && `Ghi chú khách hàng: ${customerNote}`,
    ].filter(Boolean).join("\n"),
    financeCompany: "", installmentName: "", installmentPhone: "", dateOfBirth: "", citizenId: "",
    citizenIdIssueDate: "", citizenIdIssuePlace: "", downPaymentPercent: 0, downPaymentAmount: "",
    financedAmount: "", installmentTerm: 0, monthlyPayment: "", estimatedInterest: "",
    branchId: branch.id,
    branchName: branch.name,
  };
  const saved = await createOrder(order);
  return {
    ...saved,
    paymentRequired: false,
    branch: { id: branch.id, name: branch.name, address: branch.address, phone: branch.phone, hours: branch.hours },
  };
}

/** Thong tin bao hanh cong khai (khong lo dia chi, CCCD cua khach). */
export async function lookupWarranty(orderCode: string, phone: string) {
  const order = await getWarrantyOrder(orderCode, phone);
  return order ? publicWarranty(order) : undefined;
}

function publicWarranty(order: ManagedOrder) {
  const startDate = order.warrantyStartDate || order.invoiceDate;
  return {
    orderCode: order.orderCode,
    productName: order.productName,
    items: order.items.map(({ productName, ram, storage, color, quantity }) => ({ productName, ram, storage, color, quantity })),
    orderStatus: order.status,
    invoiceNumber: order.invoiceNumber,
    warrantyMonths: order.warrantyMonths,
    warrantyStartDate: startDate,
    warrantyEndDate: warrantyEndDate(startDate, order.warrantyMonths),
    warrantySerials: order.warrantySerials,
    warrantyPolicy: order.warrantyPolicy,
    branchName: order.branchName,
  };
}

function warrantyEndDate(startDate: string, months: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || months <= 0) return "";
  const date = new Date(`${startDate}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

function cleanDate(value: unknown, label: string) {
  const date = text(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw badRequest(`Vui lòng nhập đúng ${label}.`);
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || parsed.getTime() > Date.now()) {
    throw badRequest(`${label[0].toUpperCase()}${label.slice(1)} không hợp lệ.`);
  }
  return date;
}
