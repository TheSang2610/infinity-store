// Kieu du lieu dung chung cua backend (frontend chep sang lib/types.ts).

export type ProductColor = { name: string; hex: string };
export type ProductMediaLink = { label: string; url: string };

export type Product = {
  id?: string;
  slug: string;
  name: string;
  brand: string;
  category: "iphone" | "android" | "ipad" | "tablet" | "macbook" | "macbook-air" | "macbook-pro" | "mac-mini-studio" | "imac" | "laptop" | "laptop-cu" | "smartwatch" | "audio" | "phu-kien" | "may-anh";
  image: string;
  images?: string[];
  badge: string;
  tagline: string;
  price: string;
  sku?: string;
  description?: string;
  condition?: "new" | "like-new";
  conditionLabel?: string;
  costPrice?: string;
  sellingPrice?: string;
  salePrice?: string;
  oldPrice?: string;
  stock?: number;
  status?: "draft" | "active" | "inactive";
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  variants?: ProductVariant[];
  colors: string[];
  colorOptions?: ProductColor[];
  storageOptions?: string[];
  mediaLinks?: ProductMediaLink[];
  /** Thu tu trong trang danh muc (nho dung truoc). */
  sortOrder?: number;
  specs: string[];
  featured?: boolean;
  active?: boolean;
  source: string;
};

export type ProductVariant = {
  id: string;
  name: string;
  color?: string;
  colorHex?: string;
  size?: string;
  ram?: string;
  storage?: string;
  version?: string;
  sku?: string;
  barcode?: string;
  costPrice?: string;
  price?: string;
  salePrice?: string;
  stock?: number;
  status?: "active" | "inactive";
  serials?: string[];
  image?: string;
};

export type ProductCategory = Product["category"];
export type ProductStatus = NonNullable<Product["status"]>;

/** San pham da luu trong CSDL. */
export type ManagedProduct = Product & {
  id: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
};

export type OrderItem = {
  productSlug: string;
  productName: string;
  ram: string;
  storage: string;
  color: string;
  quantity: number;
  unitPrice: number;
  image: string;
};

/** Tien tra ve dang chuoi chu so ("23890000", rong = chua co) giong ban cu de giao dien khong phai doi. */
export type ManagedOrder = {
  id: string;
  orderCode: string;
  customerName: string;
  phone: string;
  email: string;
  productSlug: string;
  productName: string;
  color: string;
  storage: string;
  quantity: number;
  deliveryMethod: string;
  address: string;
  paymentMethod: string;
  contactTime: string;
  note: string;
  status: string;
  paymentStatus: string;
  total: string;
  shippingFee: string;
  discount: string;
  financeCompany: string;
  installmentName: string;
  installmentPhone: string;
  dateOfBirth: string;
  citizenId: string;
  citizenIdIssueDate: string;
  citizenIdIssuePlace: string;
  downPaymentPercent: number;
  downPaymentAmount: string;
  financedAmount: string;
  installmentTerm: number;
  monthlyPayment: string;
  estimatedInterest: string;
  customerId: string;
  voucherCode: string;
  items: OrderItem[];
  invoiceStatus: string;
  invoiceNumber: string;
  invoiceTemplateCode: string;
  invoiceSeries: string;
  invoiceDate: string;
  invoiceBuyerType: string;
  invoiceBuyerName: string;
  invoiceCompanyName: string;
  invoiceTaxCode: string;
  invoiceAddress: string;
  invoiceEmail: string;
  invoiceSellerName: string;
  invoiceSellerTaxCode: string;
  invoiceSellerAddress: string;
  invoiceSellerPhone: string;
  invoiceTaxRate: number;
  invoiceTaxIncluded: boolean;
  invoiceNote: string;
  warrantyMonths: number;
  warrantyStartDate: string;
  warrantySerials: string;
  warrantyPolicy: string;
  branchId: string;
  branchName: string;
  assignedAdminId: string;
  assignedAdminName: string;
  createdAt: number;
};

export type OrderInvoiceField =
  | "invoiceStatus" | "invoiceNumber" | "invoiceTemplateCode" | "invoiceSeries"
  | "invoiceDate" | "invoiceBuyerType" | "invoiceBuyerName" | "invoiceCompanyName"
  | "invoiceTaxCode" | "invoiceAddress" | "invoiceEmail" | "invoiceSellerName"
  | "invoiceSellerTaxCode" | "invoiceSellerAddress" | "invoiceSellerPhone"
  | "invoiceTaxRate" | "invoiceTaxIncluded" | "invoiceNote" | "warrantyMonths"
  | "warrantyStartDate" | "warrantySerials" | "warrantyPolicy";

export type OrderInvoiceInput = Pick<ManagedOrder, OrderInvoiceField>;
export type OrderInput = Omit<ManagedOrder,
  "id" | "status" | "paymentStatus" | "shippingFee" | "createdAt" | OrderInvoiceField | "assignedAdminId" | "assignedAdminName">;

export type Customer = {
  id: string;
  username: string;
  avatarUrl: string;
  name: string;
  email: string;
  phone: string;
  provider: "password" | "google";
  verified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  profileComplete: boolean;
  verificationChannel: "email" | "sms";
  createdAt: number;
};

export const ADMIN_ROLES = ["owner", "manager", "sales", "consultant", "warranty", "repair", "inventory"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export type AdminUser = {
  id: string;
  username: string;
  name: string;
  role: AdminRole;
  branch: string;
  branchId: string;
  active: boolean;
  createdAt: number;
};

export type VoucherType = "percent" | "fixed";
export type Voucher = {
  id: string;
  code: string;
  type: VoucherType;
  value: number;
  minOrder: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  startsAt: number;
  expiresAt: number;
  active: boolean;
  createdAt: number;
};

export type Branch = {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  active: boolean;
  createdAt: number;
  staffCount: number;
};

export type StudentVerificationStatus = "pending" | "approved" | "rejected";
export type StudentVerification = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  school: string;
  studentCode: string;
  graduationYear: string;
  faculty: string;
  documentKey: string;
  documentName: string;
  documentType: string;
  status: StudentVerificationStatus;
  reviewNote: string;
  reviewedBy: string;
  reviewedByName: string;
  createdAt: number;
  updatedAt: number;
  reviewedAt: number;
};

export type InventoryOperation = "receive" | "issue" | "count";
export type BranchInventoryItem = { product: ManagedProduct; quantity: number; updatedAt: number };
export type InventoryMovement = {
  id: string;
  branchId: string;
  productId: string;
  productName: string;
  operation: InventoryOperation;
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  note: string;
  actorId: string;
  actorName: string;
  createdAt: number;
};
export type BranchAvailability = {
  branchId: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  quantity: number;
  variants: string[];
};

export type EmployeeProfile = {
  adminUserId: string;
  name: string;
  username: string;
  role: AdminRole;
  branchId: string;
  branch: string;
  active: boolean;
  dateOfBirth: string;
  joinedDate: string;
  citizenId: string;
  permanentAddress: string;
  temporaryAddress: string;
  photoKey: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  monthlySalary: number;
  updatedAt: number;
};

export type EmployeeDirectoryEntry = EmployeeProfile & {
  profileScore: number;
  todayStatus: string;
  todayCheckIn: string;
  citizenIdMasked: string;
  bankAccountMasked: string;
};

export type AttendanceRecord = {
  id: string;
  adminUserId: string;
  employeeName: string;
  branch: string;
  workDate: string;
  checkIn: string;
  checkOut: string;
  status: string;
  note: string;
  recordedBy: string;
  createdAt: number;
  updatedAt: number;
};

export type PayrollEmployee = Pick<EmployeeProfile, "adminUserId" | "name" | "role" | "branchId" | "branch" | "monthlySalary" | "bankName"> & {
  bankAccountMasked: string;
  hasBankAccount: boolean;
};

export type PayrollStatus = "draft" | "paid";
export type PayrollRecord = {
  id: string;
  adminUserId: string;
  payrollMonth: string;
  baseSalary: number;
  bonusAmount: number;
  socialInsuranceAmount: number;
  personalIncomeTaxAmount: number;
  payableAmount: number;
  workDays: number;
  status: PayrollStatus;
  paidAt: number;
  note: string;
  updatedAt: number;
};

export type WorkTask = {
  id: string;
  title: string;
  description: string;
  priority: string;
  dueDate: string;
  status: string;
  branchId: string;
  branchName: string;
  assignedTo: string;
  assignedName: string;
  createdBy: string;
  createdByName: string;
  attachmentKey: string;
  attachmentName: string;
  attachmentType: string;
  createdAt: number;
  updatedAt: number;
};

export type WorkReport = {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  message: string;
  progress: number;
  attachmentKey: string;
  attachmentName: string;
  attachmentType: string;
  createdAt: number;
};

export type Camera = {
  id: string;
  branchId: string;
  branchName: string;
  name: string;
  location: string;
  streamUrl: string;
  streamType: string;
  active: boolean;
  createdAt: number;
};

export type CameraPermission = {
  id: string;
  adminUserId: string;
  branchId: string;
  userName: string;
  branchName: string;
  createdAt: number;
};

export type LiveConversation = {
  id: string;
  customerName: string;
  phone: string;
  token: string;
  status: string;
  assignedAdmin: string;
  branchId: string;
  branchName: string;
  createdAt: number;
  updatedAt: number;
  lastMessage?: string;
  unread?: number;
};

export type LiveMessage = {
  id: string;
  conversationId: string;
  sender: string;
  senderName: string;
  text: string;
  createdAt: number;
};

export type AttendancePasskey = {
  id: string;
  adminUserId: string;
  publicKey: string;
  counter: number;
  transports: string[];
  deviceType: string;
  backedUp: boolean;
  createdAt: number;
  lastUsedAt: number;
};

/** Thong tin cua hang chu cua hang sua trong trang quan tri (bang store_settings). */
export type StoreSettings = {
  storeName: string;
  companyName: string;
  /** Dong giay phep kinh doanh o chan trang. */
  businessLicense: string;
  officeAddress: string;
  email: string;
  hotline: string;
  hotlineHours: string;
  supportHotline: string;
  supportHours: string;
  complaintHotline: string;
  complaintHours: string;
  /** So tu van hien o trang chi tiet san pham. */
  consultPhone: string;
  zaloPhone: string;
  showrooms: Array<{ name: string; address: string }>;
  socialLinks: Array<{ label: string; url: string }>;
  /** code: ma ngan hang theo VietQR (vd "techcombank") de tao ma QR chuyen khoan. */
  bank: { code: string; name: string; accountNumber: string; accountName: string };
  momo: { phone: string; accountName: string };
  invoiceSeller: { name: string; taxCode: string; address: string; phone: string };
};

/** Ten phuong thuc thanh toan luu trong don hang (tao tu thong tin cua hang). */
export type PaymentMethodLabels = { bankTransfer: string; momo: string; applePay: string; installment: string };

export type PublicStoreSettings = StoreSettings & { paymentMethods: PaymentMethodLabels };
