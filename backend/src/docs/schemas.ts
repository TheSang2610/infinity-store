/**
 * Cac kieu du lieu dung chung trong tai lieu API.
 *
 * Viet tay chu khong sinh tu schema Drizzle: bang co nhieu cot noi bo (bam mat khau, gia von,
 * khoa ma hoa ho so) khong nen phoi ra tai lieu, va nguoi goi API can HINH DANG JSON tra ve
 * chu khong phai dinh nghia luu tru.
 */

const ROLES = ["owner", "manager", "sales", "consultant", "warranty", "repair", "inventory"];

export const schemas = {
  Error: {
    type: "object",
    properties: {
      ok: { type: "boolean", example: false },
      message: { type: "string", example: "Vui lòng đăng nhập trang quản lý." },
    },
  },

  Product: {
    type: "object",
    properties: {
      id: { type: "string" },
      slug: { type: "string", example: "iphone-17-pro" },
      name: { type: "string", example: "iPhone 17 Pro" },
      brand: { type: "string", example: "Apple" },
      category: { type: "string", example: "iphone" },
      image: { type: "string", example: "/products/iphone-17-pro.webp" },
      badge: { type: "string" },
      tagline: { type: "string" },
      price: { type: "string", example: "30.990.000đ" },
      condition: { type: "string", enum: ["new", "like-new"] },
      variants: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            color: { type: "string", example: "Đen" },
            storage: { type: "string", example: "256GB" },
            ram: { type: "string" },
            price: { type: "string" },
            stock: { type: "integer" },
          },
        },
      },
    },
  },

  OrderInput: {
    type: "object",
    required: ["customerName", "phone", "deliveryMethod", "paymentMethod"],
    properties: {
      customerName: { type: "string", example: "Nguyễn Văn A" },
      phone: { type: "string", example: "0901234567" },
      email: { type: "string" },
      deliveryMethod: { type: "string", example: "Giao hàng tận nơi" },
      address: { type: "string", example: "12 Lê Lợi, Quận 1", description: "Bắt buộc khi giao tận nơi" },
      branchId: { type: "string", description: "Chi nhánh nhận hàng khi lấy tại cửa hàng" },
      paymentMethod: { type: "string", example: "Chuyển khoản BIDV 24/7 - 1810408755" },
      voucherCode: { type: "string" },
      note: { type: "string" },
      productSlug: { type: "string", example: "iphone-17", description: "Đặt một sản phẩm (không dùng items)" },
      storage: { type: "string", example: "256GB" },
      color: { type: "string", example: "Đen" },
      ram: { type: "string" },
      quantity: { type: "integer", example: 1 },
      items: {
        type: "array",
        description: "Đặt cả giỏ hàng: mỗi phần tử có productSlug, storage, color, ram, quantity",
        items: { type: "object" },
      },
    },
  },

  OrderResult: {
    type: "object",
    properties: {
      ok: { type: "boolean", example: true },
      id: { type: "string" },
      orderCode: { type: "string", example: "HAA1B2C3D4E5" },
      status: { type: "string", example: "Chờ xác nhận" },
      paymentStatus: { type: "string", example: "Chờ thanh toán" },
      total: { type: "integer", example: 22990000 },
      discount: { type: "integer", example: 0 },
    },
  },

  Customer: {
    type: "object",
    properties: {
      id: { type: "string" },
      username: { type: "string", example: "nguyenvana" },
      name: { type: "string", example: "Nguyễn Văn A" },
      email: { type: "string" },
      phone: { type: "string" },
      avatarUrl: { type: "string" },
      provider: { type: "string", enum: ["password", "google"] },
      verified: { type: "boolean" },
      createdAt: { type: "integer", description: "Unix ms" },
    },
  },

  AdminUser: {
    type: "object",
    properties: {
      id: { type: "string" },
      username: { type: "string", example: "admin" },
      name: { type: "string", example: "Giám đốc" },
      role: { type: "string", enum: ROLES },
      branch: { type: "string", example: "Chi nhánh Quận 1" },
      branchId: { type: "string" },
      active: { type: "boolean" },
      createdAt: { type: "integer", description: "Unix ms" },
    },
  },

  BranchInput: {
    type: "object",
    required: ["code", "name"],
    properties: {
      code: { type: "string", example: "Q1" },
      name: { type: "string", example: "Chi nhánh Quận 1" },
      address: { type: "string", example: "1 Nguyễn Huệ, Quận 1" },
      phone: { type: "string" },
      hours: { type: "string", example: "8:00 - 21:00" },
    },
  },

  CassoWebhook: {
    type: "object",
    properties: {
      error: { type: "integer", example: 0 },
      data: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "integer" },
            tid: { type: "string" },
            amount: { type: "integer", example: 22990000 },
            description: { type: "string", example: "HAA1B2C3D4E5 thanh toan" },
            accountNumber: { type: "string" },
          },
        },
      },
    },
  },
};
