// Chu hien thi cua header cua hang (StorefrontHeader).

export const HEADER = {
  promisesLabel: "Cam kết của cửa hàng",
  promises: [
    { icon: "badge", text: "Chính hãng · Xuất VAT đầy đủ" },
    { icon: "truck", text: "Giao nhanh 2h · Miễn phí từ 300k" },
    { icon: "card", text: "Trả góp 0% · Duyệt nhanh" },
  ],
  quickLinksLabel: "Liên kết nhanh",
  warrantyLookup: "Tra cứu bảo hành",
  logoLabel: "IF TECHSHOP - Trang chủ",
  logoAlt: "IF TECHSHOP",
  categories: "Danh mục",
  searchLabel: "Tìm kiếm sản phẩm",
  searchPlaceholder: "Tìm iPhone, MacBook, máy ảnh…",
  searchSubmit: "Tìm",
  popularSearches: "Tìm kiếm phổ biến",
  accountAndCart: "Tài khoản và giỏ hàng",
  orders: "Đơn hàng",
  cart: "Giỏ hàng",
  cartWithCount: (count: number) => `Giỏ hàng, ${count} sản phẩm`,
  accountOf: (name: string) => `Tài khoản của ${name}`,
  memberLogin: "Đăng nhập Infinity Member",
  login: "Đăng nhập",
} as const;

/** Goi y tim kiem nhanh trong o tim kiem. */
export const QUICK_SEARCH_TAGS = ["MacBook Pro", "MacBook Air", "iPhone 17 Pro", "OPPO Find X8", "Fujifilm X-T5", "Sony A7 IV", "Laptop Gaming"];

/** Menu "Danh muc" tren header. */
export const HEADER_CATEGORIES = [
  { label: "Đặt trước Apple mới", href: "/dat-truoc", icon: "✨", sub: "iPhone 18, MacBook mới, iPad mới · Không thu cọc" },
  { label: "Điện thoại, iPhone", href: "/iphone", icon: "📱", sub: "Apple Titan, Pro Max, VN/A" },
  { label: "MacBook Apple", href: "/macbook", icon: "💻", sub: "Pro M5/M4, Air, New & Like New" },
  { label: "Laptop Windows, AI", href: "/laptop", icon: "🖥️", sub: "ASUS, Dell, Gaming RTX 50" },
  { label: "Máy ảnh, Flycam", href: "/may-anh", icon: "📷", sub: "FUJIFILM, SONY, CANON, DJI" },
  { label: "Máy tính bảng, iPad", href: "/ipad", icon: "📟", sub: "iPad Pro M4, Air, mini" },
  { label: "iMac, Mac mini, Studio", href: "/mac-mini-studio", icon: "🖥️", sub: "Apple Desktop M4" },
  { label: "Âm thanh, Tai nghe", href: "/audio", icon: "🎧", sub: "AirPods, Marshall, Sony" },
  { label: "Đồng hồ thông minh", href: "/smartwatch", icon: "⌚", sub: "Apple Watch, Ultra 2" },
  { label: "Phụ kiện công nghệ", href: "/phu-kien", icon: "🔌", sub: "Cáp sạc, sạc nhanh, ốp lưng" },
  { label: "Android, Xiaomi, OPPO", href: "/android", icon: "🤖", sub: "Flagship Leica, Hasselblad" },
  { label: "Laptop cũ giá rẻ", href: "/laptop-cu", icon: "🔄", sub: "Nguyên bản, bảo hành 12T" },
];
