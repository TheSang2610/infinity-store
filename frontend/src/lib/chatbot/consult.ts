// Tư vấn một sản phẩm cụ thể: báo giá theo phiên bản, chi nhánh còn hàng, điểm mạnh và hỏi thêm nhu cầu.
import type { AdvisorCategory, AdvisorState } from "./advisor";

export type ConsultVariant = { storage?: string; ram?: string; color?: string; price?: string; salePrice?: string; status?: string };
export type ConsultProduct = {
  slug: string;
  name: string;
  category: string;
  price: string;
  oldPrice?: string;
  storageOptions?: string[];
  colorOptions?: Array<{ name: string }>;
  variants?: ConsultVariant[];
};
export type ConsultBranch = { name: string; address: string; phone: string; hours: string; quantity: number; variants: string[] };

export type PriceRow = { label: string; price: string; oldPrice?: string };
export type BranchRow = { name: string; address: string; phone: string; detail: string };

export type ConsultResult = {
  text: string;
  prices: PriceRow[];
  branches: BranchRow[];
  availability: string;
  advice: string;
  quickReplies: string[];
  link: { href: string; label: string };
  advisor: AdvisorState;
};

const CATEGORY_MAP: Record<string, AdvisorCategory> = {
  iphone: "phone",
  android: "phone",
  ipad: "tablet",
  tablet: "tablet",
  macbook: "laptop",
  "macbook-air": "laptop",
  "macbook-pro": "laptop",
  laptop: "laptop",
  "laptop-cu": "laptop",
  "mac-mini-studio": "desktop",
  imac: "desktop",
  smartwatch: "watch",
  audio: "audio",
  "may-anh": "camera",
};

// Điểm mạnh theo dòng máy, dùng để tư vấn "máy này hợp với ai".
const STRENGTHS: Array<{ pattern: RegExp; text: string }> = [
  { pattern: /\b(pro max|ultra)\b/, text: "Bản cao cấp nhất: camera zoom quang học xa, pin lớn nhất dòng, màn hình to. Hợp với người chụp ảnh, quay video và dùng máy cường độ cao." },
  { pattern: /\bpro\b/, text: "Camera nhiều ống kính, màn hình ProMotion mượt, thân máy vừa tay. Hợp với người thích chụp ảnh nhưng không muốn máy quá to." },
  { pattern: /\b(plus|max)\b/, text: "Màn hình lớn và pin lâu với giá mềm hơn bản Pro. Hợp với người xem phim, đọc nhiều và cần pin trâu." },
  { pattern: /\bair\b/, text: "Thiết kế mỏng nhẹ, đủ mạnh cho công việc hằng ngày. Hợp với người hay di chuyển." },
  { pattern: /\b(mini|se|\d+e)\b/, text: "Nhỏ gọn, giá dễ tiếp cận nhất dòng. Hợp với người dùng cơ bản hoặc thích máy cầm một tay." },
  { pattern: /\b(rog|tuf|nitro|predator|legion|loq|omen|victus|katana|rtx)\b/, text: "Dòng gaming có card đồ họa rời, tản nhiệt tốt. Hợp với chơi game và làm đồ họa nhẹ." },
  { pattern: /\b(note|redmi|galaxy a)\b/, text: "Cấu hình cân bằng, pin tốt, giá dễ chịu. Hợp với học sinh, sinh viên và người dùng phổ thông." },
];

const DEFAULT_STRENGTH: Record<AdvisorCategory, string> = {
  phone: "Máy cân bằng tốt giữa hiệu năng, camera và thời lượng pin, phù hợp đa số nhu cầu hằng ngày.",
  laptop: "Cấu hình ổn định cho học tập, làm việc văn phòng và giải trí.",
  tablet: "Màn hình lớn, tiện cho học tập, ghi chú và giải trí.",
  desktop: "Hiệu năng mạnh, chạy êm, phù hợp làm việc lâu dài tại bàn.",
  watch: "Theo dõi sức khỏe, luyện tập và nhận thông báo tiện lợi.",
  audio: "Âm thanh hay, kết nối nhanh với điện thoại và máy tính.",
  camera: "Chất lượng ảnh vượt trội, phù hợp chụp ảnh nghiêm túc và quay vlog.",
};

export type ContactBranch = { name: string; address: string; phone: string; hours: string };

export function buildProductConsultation(product: ConsultProduct, branches: ConsultBranch[], contactBranches: ContactBranch[] = []): ConsultResult {
  const category = CATEGORY_MAP[product.category] ?? "phone";
  const prices = priceRows(product);
  const numericPrices = prices.map((row) => money(row.price)).filter((value) => value > 0);
  const lowest = numericPrices.length ? Math.min(...numericPrices) : money(product.price);
  const highest = numericPrices.length ? Math.max(...numericPrices) : lowest;
  const plainName = plain(product.name);

  const priceLine = prices.length > 1
    ? `${product.name} có giá từ ${formatMoney(lowest)} đến ${formatMoney(highest)} tùy phiên bản:`
    : `${product.name} hiện có giá ${prices[0]?.price || product.price}.`;
  const colors = (product.colorOptions ?? []).map((color) => color.name).filter((name) => name && !/theo ảnh|mặc định|default/i.test(name));
  const colorLine = colors.length ? `Màu đang bán: ${colors.slice(0, 6).join(", ")}.` : "";

  const inStock: BranchRow[] = branches.slice(0, 4).map((branch) => ({
    name: branch.name,
    address: branch.address,
    phone: branch.phone,
    detail: `Còn ${branch.quantity} máy${branch.variants.length ? ` · ${branch.variants.join(", ")}` : ""} · ${branch.hours}`,
  }));
  // Chưa có tồn kho theo chi nhánh: liệt kê chi nhánh đang mở để khách gọi kiểm tra.
  const contactRows: BranchRow[] = contactBranches
    .filter((branch) => !/bảo hành|sửa chữa|linh kiện|phụ kiện/i.test(branch.name))
    .slice(0, 3)
    .map((branch) => ({
    name: branch.name,
    address: branch.address,
    phone: branch.phone,
    detail: `Gọi để giữ máy · ${branch.hours}`,
  }));
  const branchRows = inStock.length ? inStock : contactRows;
  const availabilityLine = inStock.length
    ? `✅ Đang có sẵn tại ${inStock.length} chi nhánh:`
    : `Hệ thống chưa cập nhật chi nhánh còn sẵn ${product.name}. Bạn vẫn đặt online được, cửa hàng sẽ gọi xác nhận hàng trước khi giao.${contactRows.length ? " Hoặc gọi chi nhánh gần bạn để giữ máy:" : ""}`;

  const strength = STRENGTHS.find((item) => item.pattern.test(plainName))?.text ?? DEFAULT_STRENGTH[category];
  const followUp = category === "laptop"
    ? "Bạn dùng máy chủ yếu để học, làm văn phòng, chơi game hay làm đồ họa? Mình sẽ so sánh thêm vài mẫu cùng tầm giá cho bạn."
    : "Bạn ưu tiên điều gì nhất: chụp ảnh, chơi game, pin trâu hay giá tốt hơn? Mình sẽ gợi ý thêm máy cùng tầm giá để bạn so sánh.";

  const quickReplies = category === "laptop"
    ? ["Học tập, văn phòng", "Chơi game", "Đồ họa, dựng video", "Rẻ hơn"]
    : ["Chụp ảnh đẹp hơn", "Chơi game mượt hơn", "Pin trâu hơn", "Rẻ hơn", "Có trả góp không?"];

  return {
    text: [priceLine, colorLine].filter(Boolean).join("\n"),
    prices: prices.length > 1 ? prices : [],
    branches: branchRows,
    availability: availabilityLine,
    advice: `💡 ${strength}\n\n${followUp}`,
    quickReplies,
    link: { href: `/san-pham/${product.slug}`, label: "Xem chi tiết & đặt hàng" },
    advisor: {
      category,
      min: Math.round(lowest * 0.8),
      max: Math.round(lowest * 1.3),
      shownMin: lowest,
      shownMax: highest,
      awaiting: "purpose",
    },
  };
}

function priceRows(product: ConsultProduct): PriceRow[] {
  const variants = (product.variants ?? []).filter((variant) => variant.status !== "inactive");
  const byStorage = new Map<string, { price: number; old: number }>();
  for (const variant of variants) {
    const label = [variant.ram && `${variant.ram} RAM`, variant.storage].filter(Boolean).join(" · ");
    if (!label) continue;
    const sale = money(variant.salePrice || variant.price);
    const regular = money(variant.price);
    if (!sale) continue;
    const current = byStorage.get(label);
    if (!current || sale < current.price) byStorage.set(label, { price: sale, old: regular > sale ? regular : 0 });
  }
  return [...byStorage.entries()]
    .sort((left, right) => left[1].price - right[1].price)
    .slice(0, 6)
    .map(([label, value]) => ({ label, price: formatMoney(value.price), oldPrice: value.old ? formatMoney(value.old) : undefined }));
}

function money(value?: string) {
  return Number(String(value || "").replace(/[^\d]/g, "")) || 0;
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

function plain(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ");
}
