// Chu hien thi va tieu de SEO cua cac trang cua hang (app/(portal)/*).

export const MEMBER_INVOICE_PAGE = {
  buyer: "Người mua",
  date: "Ngày",
  end: "Hết hạn",
  invoiceNumber: "Số hóa đơn",
  lineTotal: "Thành tiền",
  lookupLink: "Tra cứu bảo hành bằng mã đơn →",
  metaTitle: "Hóa đơn & bảo hành member",
  months: "tháng",
  notIssued: "Chưa phát hành",
  notIssuedNote: "Cửa hàng chưa phát hành hóa đơn. Thông tin đơn mua và bảo hành vẫn được lưu trong tài khoản của bạn.",
  notUpdated: "Chưa cập nhật",
  orderCode: "Mã đơn",
  privacyNote: "Hóa đơn và bảo hành này chỉ hiển thị cho tài khoản member sở hữu đơn hàng.",
  product: "Sản phẩm",
  seller: "Bên bán",
  serviceLocation: "Nơi tiếp nhận",
  start: "Bắt đầu",
  storePickup: "Nhận tại cửa hàng",
  subtitle: "Thông tin điện tử được lưu theo tài khoản member",
  title: "Hóa đơn mua hàng",
  total: "Tổng thanh toán",
  unitPrice: "Đơn giá",
  unknown: "Chưa xác định",
  warrantyActive: "Đã ghi nhận bảo hành",
  warrantyPending: "Chờ cửa hàng kích hoạt",
  warrantyTerms: "Sản phẩm được bảo hành theo chính sách nhà sản xuất hoặc nhà cung cấp. Vui lòng mang theo sản phẩm và mã đơn hàng khi cần hỗ trợ.",
  warrantyTitle: "Bảo hành điện tử",
} as const;

export const HOME_PAGE = {
  all: "Tất cả",
  askAdvice: "Nhờ tư vấn ",
  consult: "Tư vấn chọn máy ",
  creativeEyebrow: "Thiết bị sáng tạo",
  creativeTitle: "Bắt trọn từng khoảnh khắc",
  curatedEyebrow: "Sản phẩm tuyển chọn",
  curatedTitle: "Sản phẩm và ưu đãi mới",
  exploreLabel: "Khám phá cửa hàng",
  featuredLabel: "Sản phẩm nổi bật tại Infinity Store",
  servicesLabel: "Dịch vụ hỗ trợ mua sắm",
  tagline: "Công nghệ bạn yêu. Trải nghiệm bạn xứng đáng.",
  tradeInCta: "Định giá máy ngay",
  tradeInEyebrow: "ĐỔI MÁY DỄ DÀNG",
  tradeInText: "Định giá thiết bị trong 5 phút, thủ tục gọn và hỗ trợ nhiều dòng iPhone, iPad, MacBook.",
  tradeInTitle: "Thu cũ đổi mới, lên đời trợ giá đến 95%",
} as const;

export const SEARCH_PAGE = {
  resultsFor: (query: string) => `Kết quả cho “${query}”`,
  breadcrumb: "Đường dẫn",
  emptyText: "Thử tên model ngắn hơn hoặc xem theo danh mục sản phẩm.",
  emptyTitle: "Chưa tìm thấy sản phẩm",
  exploreFeatured: "Khám phá sản phẩm nổi bật",
  eyebrow: "TÌM SẢN PHẨM INFINITY STORE",
  foundPrefix: "Tìm thấy ",
  foundSuffix: "sản phẩm phù hợp.",
  home: "Trang chủ",
  metaDescription: "Tìm điện thoại, máy tính và phụ kiện tại Infinity Store.",
  metaTitle: "Tìm kiếm sản phẩm",
  placeholder: "iPhone, MacBook, laptop, máy ảnh...",
  results: "Kết quả tìm kiếm",
  search: "Tìm kiếm",
  title: "Bạn đang tìm sản phẩm nào?",
} as const;

export const ORDER_PAGE = {
  eyebrow: "ĐƠN HÀNG CỦA BẠN",
  metaDescription: "Kiểm tra sản phẩm, khuyến mãi và tổng tiền trước khi thanh toán tại Infinity Store.",
  metaTitle: "Kiểm tra đơn hàng",
  text: "Xác nhận đúng phiên bản, số lượng và ưu đãi trước khi chuyển sang thanh toán.",
  title: "Kiểm tra sản phẩm và giá tiền",
} as const;

export const LAPTOP_PAGE = {
  intro: "Kho laptop hơn 680+ mẫu mã đa dạng từ Dell Latitude/Precision/XPS, HP EliteBook/ZBook, Lenovo ThinkPad, ASUS, Acer, MSI... Đầy đủ thông số chi tiết CPU, VGA, RAM, SSD, màn hình và bảo hành 12 tháng uy tín.",
  eyebrow: "LAPTOP CHÍNH HÃNG & LIKE NEW",
  metaDescription: "Hơn 680+ mẫu laptop văn phòng, đồ họa, gaming và trạm Dell, HP, ThinkPad, ASUS từ phổ thông đến cao cấp tại Infinity Store.",
  metaTitle: "Laptop Chính Hãng & Like New Tuyển Chọn",
  title: "Laptop từ 12–200 triệu — Văn Phòng, Gaming & Máy Trạm Đồ Họa Chuyên Nghiệp",
} as const;

export const CAMERA_PAGE = {
  intro: "Khám phá các dòng máy ảnh danh tiếng từ FUJIFILM, SONY, CANON và thiết bị chống rung, flycam DJI. Cam kết 100% chính hãng, bảo hành 12 - 24 tháng, hỗ trợ trả góp 0% lãi suất.",
  eyebrow: "Máy ảnh & Thiết bị ghi hình",
  metaDescription: "Máy ảnh Mirrorless FUJIFILM, SONY, CANON và Gimbal Flycam DJI chính hãng tại Infinity Store. Trả góp 0%, giao nhanh 2 giờ.",
  metaTitle: "Máy ảnh Mirrorless & Thiết bị quay phim chính hãng",
  title: "Máy ảnh Mirrorless & Quay phim chuyên nghiệp.",
} as const;

export const ACCESSORIES_PAGE = {
  intro: "Apple Watch, âm thanh, sạc, màn hình iPhone, pin, camera và linh kiện sửa chữa được gom trong một danh mục dễ tìm. Giá linh kiện được xác nhận lại sau khi kỹ thuật viên kiểm tra máy.",
  eyebrow: "Phụ kiện & linh kiện sửa chữa",
  metaDescription: "Phụ kiện, màn hình iPhone, pin, camera và linh kiện sửa chữa tại Infinity Store.",
  metaTitle: "Phụ kiện & linh kiện Apple",
  title: "Từ phụ kiện sử dụng đến linh kiện kỹ thuật.",
} as const;

export const PRODUCT_PAGE = {
  adminMode: "Chế độ quản trị",
  adminToolsLabel: "Công cụ quản trị sản phẩm",
  editProduct: "✎ Sửa sản phẩm này",
  metaFallbackTitle: "Sản phẩm",
  productList: "Danh sách sản phẩm",
} as const;

export const PREORDER_PAGE = {
  metaDescription: "Trải nghiệm và đặt trước iPhone 18 Pro, iPhone 18 Pro Max mới nhất tại Infinity Store. Khẩu độ biến thiên 4 bước ƒ/1.48–ƒ/4.0, chip A20 Pro 2nm. Giữ suất 0đ tiền cọc, nhận máy kiểm tra mới thanh toán.",
  metaTitle: "iPhone 18 Pro & Pro Max - Đặt trước chính hãng Apple | Infinity Store",
  ogDescription: "Khẩu độ biến thiên cơ học 4 bước ƒ/1.48–ƒ/4.0. Chip A20 Pro 2nm thế hệ mới. Đặt trước không cần cọc tại Infinity Store.",
  ogTitle: "iPhone 18 Pro - Một nâng cấp quan trọng. Bứt phá mọi chuẩn mực Pro.",
} as const;

export const MACBOOK_PAGE = {
  promoChips: "Apple M5 / M4 Pro / M4 Max · Chính Hãng",
  promoCta: "Khám phá & Đặt trước 0đ",
  promoHeadline: "MacBook Pro Mới: Đỉnh cao hiệu năng. Bứt phá mọi giới hạn.",
  promoTitle: "MacBook Pro mới",
} as const;

export const INSTALLMENT_PAGE = {
  metaDescription: "Công cụ Mô phỏng tài chính trả góp 0% lãi suất. Không thu CCCD tại bước mô phỏng. Tra cứu toàn bộ iPhone, MacBook, iPad, Laptop và Máy ảnh theo Hãng và Tên máy.",
  metaTitle: "Mô phỏng tài chính trả góp 0% - Dự toán khoản vay chính hãng | Infinity Store",
  ogDescription: "Chủ động ngân sách - Trả trước từ 0đ - Không thu CCCD.",
  ogTitle: "Mô phỏng tài chính trả góp 0% chính hãng | Infinity Store",
} as const;

export const MACBOOK_AIR_PAGE = {
  intro: "Danh sách toàn bộ các dòng MacBook Air M5, M4, M3, M2, M1 mới 100% nguyên seal và Like New 99% nguyên bản tại Infinity Store. Bảo hành chính hãng, trả góp 0%, giao nhanh hỏa tốc 2 giờ.",
  eyebrow: "CHÍNH HÃNG APPLE",
  title: "Apple MacBook Air Chính Hãng & Like New",
} as const;

export const ANDROID_PAGE = {
  metaDescription: "Xiaomi, OPPO và điện thoại Android tại Infinity Store.",
  metaTitle: "Android khác",
} as const;

export const WARRANTY_PAGE = {
  metaDescription: "Tra cứu thời hạn, ngày kích hoạt và serial bảo hành sản phẩm đã mua tại Infinity Store.",
  metaTitle: "Tra cứu bảo hành",
} as const;

export const IPAD_PAGE = {
  intro: "Chọn iPad theo kích thước màn hình, dung lượng và nhu cầu sử dụng thực tế.",
  tagline: "iPad sáng tạo kỹ năng",
} as const;

export const IPHONE_PAGE = {
  metaDescription: "Khám phá các đời iPhone chính hãng VN/A tại Infinity Store. iPhone 18 Pro đã chính thức mở bán với camera khẩu độ cơ học, chip A20 Pro và bốn màu mới.",
  metaTitle: "iPhone Chính Hãng Apple - iPhone 18 Pro & Pro Max | Infinity Store",
} as const;

export const CART_PAGE = {
  metaTitle: "Giỏ hàng | Infinity Store",
} as const;

export const IMAC_PAGE = {
  metaDescription: "iMac 24 inch nhiều màu với cấu hình RAM, SSD và giá theo từng phiên bản tại Infinity Store.",
} as const;

export const MAC_DESKTOP_PAGE = {
  metaDescription: "Mac mini và Mac Studio với cấu hình RAM, SSD và giá theo từng phiên bản tại Infinity Store.",
} as const;
