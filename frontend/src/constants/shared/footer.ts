// Chu hien thi cua footer cua hang (StorefrontFooter). So dien thoai, dia chi, mang xa hoi
// nam trong Cai dat cua hang (CSDL), khong o day.

export const FOOTER = {
  brandStripLabel: "Thương hiệu đối tác chính hãng",
  brandStripTitle: "Chuyên trang đối tác chính hãng & Đại lý ủy quyền",
  seoLabel: "Giới thiệu hệ thống Infinity Store",
  seoTitle: "HỆ THỐNG BÁN LẺ ĐIỆN THOẠI, LAPTOP & THIẾT BỊ CÔNG NGHỆ CHÍNH HÃNG",
  seoIntroBrand: "Infinity Store",
  seoIntro: " tự hào là hệ thống bán lẻ thiết bị công nghệ hàng đầu, chuyên cung cấp các dòng sản phẩm Apple iPhone, iPad, MacBook, Laptop AI, máy ảnh Mirrorless chuyên nghiệp (Fujifilm, Sony, Canon) và thiết bị bay Flycam / Gimbal DJI chính hãng 100%.",
  seoSections: [
    {
      title: "1. Cam kết sản phẩm chính hãng & Nguồn gốc minh bạch",
      body: "Tất cả sản phẩm bán ra đều là hàng chính ngạch (VN/A đối với Apple), nguyên seal hộp, đầy đủ hóa đơn VAT và được hưởng chế độ bảo hành chính hãng từ 12 đến 24 tháng tại các trung tâm bảo hành ủy quyền như Apple AASP, Sony Vietnam, Canon LBM.",
    },
    {
      title: "2. Mua hàng trả góp 0% - Xét duyệt siêu tốc",
      body: "Hỗ trợ trả góp 0% lãi suất qua thẻ tín dụng của hơn 25 ngân hàng lớn hoặc thông qua các đối tác tài chính uy tín như Kredivo, FE Credit, HD Saison, Home Credit. Hồ sơ đơn giản, duyệt online trong 5 phút.",
    },
    {
      title: "3. Thu cũ đổi mới (Trade-in) trợ giá lên tới 95%",
      body: "Chương trình thu cũ đổi mới giúp khách hàng dễ dàng nâng cấp lên các dòng máy flagship mới nhất. Định giá nhanh chóng, thủ tục gọn lẹ, mức trợ giá cao nhất thị trường.",
    },
    {
      title: "4. Dịch vụ chăm sóc & Bảo hành chuẩn quốc tế",
      body: "Đội ngũ kỹ thuật viên tay nghề cao hỗ trợ cài đặt, vệ sinh máy và chuyển đổi dữ liệu miễn phí trọn đời sản phẩm. Tiếp nhận bảo hành nhanh chóng, tận tâm.",
    },
    {
      title: "5. Giao hàng hỏa tốc trong 2 giờ & Đổi mới 30 ngày",
      body: "Giao nhanh 2 giờ tại khu vực nội thành Hà Nội và TP. Hồ Chí Minh. Chính sách 1 đổi 1 trong vòng 30 ngày đầu tiên nếu phát sinh lỗi phần cứng từ nhà sản xuất.",
    },
  ],
  seoCollapse: "Thu gọn ⌃",
  seoExpand: "Xem thêm thông tin ⌵",
  hotlineTitle: "Tổng đài hỗ trợ miễn phí",
  hotlineSales: "Gọi mua hàng",
  hotlineSupport: "Hỗ trợ kỹ thuật & bảo hành",
  hotlineComplaint: "Khiếu nại & góp ý",
  policyTitle: "Thông tin và chính sách",
  servicesTitle: "Dịch vụ và tiện ích",
  connectTitle: "Kết nối & Thanh toán",
  certified: "✓ ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG",
  officeAddress: (address: string) => `Địa chỉ văn phòng: ${address}.`,
  officePhone: (phone: string) => ` Điện thoại: ${phone}.`,
} as const;

export const FOOTER_POLICY_LINKS = [
  { href: "/tra-gop", label: "Mua hàng và thanh toán Online" },
  { href: "/tra-gop", label: "Mua hàng trả góp 0% lãi suất" },
  { href: "/bao-hanh", label: "Chính sách bảo hành & đổi mới" },
  { href: "/bao-hanh", label: "Tra cứu bảo hành điện tử" },
  { href: "/tu-van", label: "Chính sách giao hàng hỏa tốc 2h" },
  { href: "/tu-van", label: "Quy chế hoạt động & bảo mật thông tin" },
];

export const FOOTER_SERVICE_LINKS = [
  { href: "/member", label: "Khách hàng thân thiết Infinity Member" },
  { href: "/tra-gop", label: "Thu cũ đổi mới trợ giá đến 95%" },
  { href: "/tra-gop", label: "Mô phỏng trả góp 0% lãi suất" },
  { href: "/tu-van", label: "Khách hàng doanh nghiệp (B2B)" },
  { href: "/tu-van", label: "Đăng ký tư vấn chọn máy theo nhu cầu" },
  { href: "/admin-login", label: "Cổng quản trị nội bộ Infinity Store" },
];

export const FOOTER_PAYMENT_PARTNERS = [" Apple Reseller", "VNPAY-QR", "MoMo", "Kredivo", "Home Credit", "Visa / Master"];

export const FOOTER_BRAND_PARTNERS = [
  { name: "Sản phẩm Apple", href: "/iphone", tag: " Apple" },
  { name: "MacBook Apple", href: "/macbook", tag: "💻 MacBook" },
  { name: "Điện thoại OPPO", href: "/android", tag: "OPPO" },
  { name: "Sony Alpha & Audio", href: "/may-anh", tag: "SONY" },
  { name: "Thiết bị DJI", href: "/may-anh", tag: "DJI" },
  { name: "Canon Image", href: "/may-anh", tag: "Canon" },
  { name: "Fujifilm Mirrorless", href: "/may-anh", tag: "Fujifilm" },
  { name: "Điện thoại Xiaomi", href: "/android", tag: "Xiaomi" },
  { name: "ASUS ROG & Zenbook", href: "/laptop", tag: "ASUS" },
  { name: "Dell Official", href: "/laptop", tag: "Dell" },
  { name: "HP Premium", href: "/laptop", tag: "HP" },
  { name: "Lenovo ThinkPad", href: "/laptop", tag: "Lenovo" },
];
