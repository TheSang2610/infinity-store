// Ban sao cua frontend/app/chatbot/advisor.ts (giao dien cung dung). Sua mot ben thi sua ca hai.
// Bộ tư vấn chọn máy chạy hoàn toàn nội bộ (không dùng dịch vụ AI bên ngoài).
// 1) parseAdvisorMessage: đọc ngân sách, mục đích, loại máy, hãng từ câu khách nhắn.
// 2) recommendProducts: chấm điểm catalog và trả về tối đa 3 gợi ý kèm lý do.

export type AdvisorCategory = "phone" | "laptop" | "tablet" | "desktop" | "watch" | "audio" | "camera";
export type AdvisorPurpose =
  | "gaming"
  | "camera"
  | "battery"
  | "study"
  | "creative"
  | "coding"
  | "basic"
  | "compact"
  | "gift"
  | "general";

export type AdvisorState = {
  category?: AdvisorCategory;
  brand?: string;
  min?: number;
  max?: number;
  purpose?: AdvisorPurpose;
  shownMin?: number;
  shownMax?: number;
  awaiting?: "category" | "budget" | "purpose";
  /** Dòng máy khách đang xem, loại khỏi danh sách gợi ý so sánh. */
  exclude?: string;
  /** Tên mẫu máy đang xem, để câu gợi ý nói "cùng tầm giá iPhone 17" thay vì nhắc ngân sách. */
  anchor?: string;
};

export type AdvisorParse = {
  category?: AdvisorCategory;
  brand?: string;
  min?: number;
  max?: number;
  hasBudget: boolean;
  purpose?: AdvisorPurpose;
  cue: boolean;
  cheaper: boolean;
  pricier: boolean;
  reset: boolean;
};

export type AdvisorProduct = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: string;
  image?: string;
  stock?: number;
  active?: boolean;
  status?: string;
  condition?: string;
  conditionLabel?: string;
};

export type ChatSuggestion = { slug: string; name: string; price: string; image: string; reason: string };

export type AdvisorResult = {
  text: string;
  products: ChatSuggestion[];
  shownMin?: number;
  shownMax?: number;
  quickReplies: string[];
};

const MILLION = 1_000_000;

export const CATEGORY_LABELS: Record<AdvisorCategory, string> = {
  phone: "điện thoại",
  laptop: "laptop",
  tablet: "máy tính bảng",
  desktop: "máy Mac để bàn",
  watch: "đồng hồ thông minh",
  audio: "tai nghe",
  camera: "máy ảnh",
};

export const PURPOSE_LABELS: Record<AdvisorPurpose, string> = {
  gaming: "chơi game",
  camera: "chụp ảnh, quay video",
  battery: "dùng lâu, pin trâu",
  study: "học tập, làm việc văn phòng",
  creative: "đồ họa, dựng video",
  coding: "lập trình",
  basic: "nghe gọi, dùng cơ bản",
  compact: "có máy nhỏ gọn, dễ cầm",
  gift: "làm quà tặng",
  general: "dùng đa năng",
};

const CATEGORY_GROUPS: Record<AdvisorCategory, string[]> = {
  phone: ["iphone", "android"],
  laptop: ["macbook", "macbook-air", "macbook-pro", "laptop", "laptop-cu"],
  tablet: ["ipad", "tablet"],
  desktop: ["mac-mini-studio", "imac"],
  watch: ["smartwatch", "phu-kien"],
  audio: ["audio", "phu-kien"],
  camera: ["may-anh"],
};

// Tai nghe, đồng hồ đang nằm chung danh mục phụ kiện nên lọc thêm theo tên.
const CATEGORY_NAME_FILTER: Partial<Record<AdvisorCategory, RegExp>> = {
  audio: /\b(tai nghe|airpods|earpods|headphone|earbuds|buds|loa)\b/,
  watch: /\b(watch|dong ho)\b/,
};

const CATEGORY_WORDS: Array<[AdvisorCategory, RegExp]> = [
  ["tablet", /\b(ipad|may tinh bang|tablet|galaxy tab|xiaomi pad|redmi pad)\b/],
  ["laptop", /\b(laptop|lap top|may tinh xach tay|notebook|macbook|ultrabook)\b/],
  ["desktop", /\b(mac mini|mac studio|imac|may tinh ban|may ban)\b/],
  ["watch", /\b(dong ho|apple watch|smartwatch|smart watch|galaxy watch)\b/],
  ["audio", /\b(tai nghe|airpods|headphone|earbuds|loa)\b/],
  ["camera", /\b(may anh|mirrorless|dslr)\b/],
  ["phone", /\b(dien thoai|dt|smartphone|iphone|android|galaxy [saz]\d*|redmi|poco|oppo|vivo|realme|honor|pixel)\b/],
];

const BRAND_WORDS: Array<[string, RegExp]> = [
  ["apple", /\b(apple|iphone|ipad|macbook|mac|airpods)\b/],
  ["samsung", /\b(samsung|galaxy|ss)\b/],
  ["xiaomi", /\b(xiaomi|redmi|poco|mi)\b/],
  ["oppo", /\boppo\b/],
  ["vivo", /\bvivo\b/],
  ["realme", /\brealme\b/],
  ["honor", /\bhonor\b/],
  ["google", /\b(google|pixel)\b/],
  ["asus", /\b(asus|rog|tuf|zenbook|vivobook)\b/],
  ["acer", /\b(acer|nitro|predator|aspire|swift)\b/],
  ["dell", /\b(dell|xps|inspiron|latitude|vostro|alienware)\b/],
  ["hp", /\b(hp|pavilion|victus|omen|envy|elitebook|probook)\b/],
  ["lenovo", /\b(lenovo|thinkpad|legion|ideapad|yoga|loq)\b/],
  ["msi", /\bmsi\b/],
  ["lg", /\b(lg|gram)\b/],
  ["gigabyte", /\b(gigabyte|aorus)\b/],
  ["sony", /\bsony\b/],
  ["canon", /\bcanon\b/],
  ["fujifilm", /\b(fujifilm|fuji)\b/],
];

const PURPOSE_WORDS: Array<[AdvisorPurpose, RegExp]> = [
  ["creative", /\b(do hoa|thiet ke|photoshop|illustrator|premiere|after effect|dung phim|dung video|edit video|render|kien truc|autocad|3d|blender)\b/],
  ["coding", /\b(lap trinh|code|coding|developer|dev|hoc it|cong nghe thong tin)\b/],
  ["gaming", /\b(choi game|game|gaming|lien quan|lqmb|pubg|free fire|genshin|valorant|lol|fifa|esport|fps)\b/],
  ["camera", /\b(chup anh|chup hinh|chup dep|quay video|quay phim|selfie|song ao|tiktok|livestream|live stream|vlog|camera dep|camera tot)\b/],
  ["battery", /\b(pin trau|pin khoe|pin lau|pin tot|pin ben|it sac|dung lau|pin)\b/],
  ["study", /\b(hoc tap|hoc online|sinh vien|hoc sinh|di hoc|van phong|lam viec|cong viec|word|excel|ke toan|giao vien|hoc)\b/],
  ["basic", /\b(nguoi gia|nguoi lon tuoi|bo me|ba me|ong ba|cha me|nghe goi|co ban|don gian|luot web|luot facebook|zalo)\b/],
  ["compact", /\b(nho gon|cam 1 tay|cam mot tay|mot tay|man hinh nho|gon nhe|nho nhan)\b/],
  ["gift", /\b(qua tang|lam qua|tang ban gai|tang nguoi yeu|tang vo|tang chong|tang me|tang bo|sinh nhat)\b/],
  ["general", /\b(sao cung duoc|gi cung duoc|khong quan trong|bat ky|da nang|da dung|tong hop|binh thuong|dung chung|xem phim|giai tri|nghe nhac|mang xa hoi)\b/],
];

const ADVISOR_CUES = /\b(tu van (may|dien thoai|laptop|mua|chon|giup)|goi y|nen mua|nen chon|nen lay|chon may|chon giup|muon mua|can mua|dinh mua|tinh mua|can tim|tim may|may nao|dien thoai nao|laptop nao|loai nao|con nao|dong nao|phu hop|hop voi)\b/;

export function plainText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

function wordsOnly(value: string) {
  return plainText(value).replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function parseAdvisorMessage(message: string, awaitingBudget = false): AdvisorParse {
  const words = wordsOnly(message);
  const budget = parseBudget(message, awaitingBudget);
  const category = CATEGORY_WORDS.find(([, pattern]) => pattern.test(words))?.[0];
  const brand = BRAND_WORDS.find(([, pattern]) => pattern.test(words))?.[0];
  const purpose = PURPOSE_WORDS.find(([, pattern]) => pattern.test(words))?.[0];
  return {
    category,
    brand,
    ...budget,
    purpose,
    cue: ADVISOR_CUES.test(words),
    cheaper: /\b(re hon|thap hon|tiet kiem hon|mem hon|bot tien)\b/.test(words),
    pricier: /\b(cao cap hon|xin hon|tot hon|manh hon|dat hon|cao hon|nang cap)\b/.test(words),
    reset: /\b(tu van lai|chon lai|lam lai|bat dau lai)\b/.test(words),
  };
}

// ---------------------------------------------------------------------------
// Budget parsing: "tầm 15 triệu", "10-15tr", "dưới 20 củ", "12tr5", "8 triệu rưỡi", "15.000.000đ"
// ---------------------------------------------------------------------------
type Amount = { value: number; hasUnit: boolean; start: number; end: number };

function parseBudget(message: string, awaitingBudget: boolean): { min?: number; max?: number; hasBudget: boolean } {
  const text = plainText(message).replace(/[^a-z0-9.,\-~\s]/g, " ").replace(/\s+/g, " ");
  const pattern = /(\d+(?:[.,]\d+)*)\s*(trieu|tr|cu|m|k|nghin|ngan|ty|ti|d|vnd|dong)?(?:\s*(ruoi|\d{1,3}))?(?![a-z0-9])/g;
  const amounts: Amount[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    const [raw, numberText, unit, tail] = match;
    let value = readNumber(numberText);
    if (!Number.isFinite(value) || value <= 0) continue;
    const before = text.slice(Math.max(0, match.index - 18), match.index);
    const millionUnit = unit === "trieu" || unit === "tr" || unit === "cu" || unit === "m";

    if (millionUnit) {
      if (tail === "ruoi") value += 0.5;
      else if (tail && /^\d+$/.test(tail)) value += Number(tail) / 10 ** tail.length;
      value *= MILLION;
    } else if (unit === "k" || unit === "nghin" || unit === "ngan") {
      value *= 1000;
    } else if (unit === "ty" || unit === "ti") {
      value *= 1000 * MILLION;
    } else if (value < 100_000) {
      // Số trần không có đơn vị: chỉ hiểu là "triệu" khi có từ chỉ ngân sách hoặc đang chờ khách báo ngân sách.
      const after = text.slice(match.index + raw.length);
      const rangeFollows = /^\s*(-|~|den|toi)\s*\d+(?:[.,]\d+)?\s*(trieu|tr|cu|m)(?![a-z])/.test(after);
      const cue = rangeFollows || /(duoi|toi da|khong qua|max|tam|khoang|tren|hon|tu|ngan sach|budget|chi co|co|gia|den|toi|~|-)\s*$/.test(before);
      const bareAnswer = awaitingBudget && /^\s*[\d.,\s\-~]+\s*$/.test(text);
      if (!(cue || bareAnswer) || value > 300 || tail) continue;
      value *= MILLION;
    }
    amounts.push({ value: Math.round(value), hasUnit: Boolean(unit), start: match.index, end: match.index + raw.length });
  }

  const usable = amounts.filter((amount) => amount.value >= 200_000 && amount.value <= 500 * MILLION);
  if (!usable.length) return { hasBudget: false };

  if (usable.length >= 2) {
    const [first, second] = usable;
    const low = Math.min(first.value, second.value);
    const high = Math.max(first.value, second.value);
    return { min: low, max: high, hasBudget: true };
  }

  const [amount] = usable;
  const before = text.slice(Math.max(0, amount.start - 22), amount.start);
  const after = text.slice(amount.end, amount.end + 16);
  if (/(duoi|toi da|khong qua|max|nho hon|it hon|khong den|chua toi|chi co|re hon)\s*$/.test(before) || /^\s*(tro xuong|do xuong|do lai|tro lai|doi lai|thoi|la toi da)/.test(after)) {
    return { max: amount.value, hasBudget: true };
  }
  if (/(tren|hon|it nhat|toi thieu|tu)\s*$/.test(before) || /^\s*(tro len|do len|tro di)/.test(after)) {
    return { min: amount.value, max: Math.round(amount.value * 1.6), hasBudget: true };
  }
  return { min: Math.round(amount.value * 0.8), max: Math.round(amount.value * 1.08), hasBudget: true };
}

function readNumber(numberText: string) {
  if (/^\d{1,3}([.,]\d{3})+$/.test(numberText)) return Number(numberText.replace(/[.,]/g, ""));
  return Number(numberText.replace(",", "."));
}

export function formatBudget(min?: number, max?: number) {
  if (min && max) return `${formatMillion(min)} – ${formatMillion(max)}`;
  if (max) return `dưới ${formatMillion(max)}`;
  if (min) return `từ ${formatMillion(min)}`;
  return "chưa rõ";
}

export function formatMillion(value: number) {
  if (value >= MILLION) {
    const millions = Math.round((value / MILLION) * 10) / 10;
    return `${millions.toLocaleString("vi-VN")} triệu`;
  }
  return `${Math.round(value / 1000).toLocaleString("vi-VN")} nghìn`;
}

// ---------------------------------------------------------------------------
// Recommendation scoring
// ---------------------------------------------------------------------------
type Signal = { pattern: RegExp; weight: number; reason: string };

const PROFILES: Partial<Record<AdvisorPurpose, Partial<Record<AdvisorCategory, Signal[]>>>> = {
  gaming: {
    laptop: [
      { pattern: /\b(rog|strix|tuf|nitro|predator|helios|legion|loq|omen|victus|katana|sword|cyborg|alienware|aorus|g15|g16|rtx|gtx|gaming)\b/, weight: 2.4, reason: "Dòng laptop gaming, card đồ họa rời chơi game mượt" },
      { pattern: /\b(macbook air|chromebook|celeron|pentium)\b/, weight: -1.6, reason: "" },
    ],
    phone: [
      { pattern: /\b(pro max|ultra|rog phone|poco f\d*|redmi k\d*|black shark|gt)\b/, weight: 1.8, reason: "Chip mạnh, màn hình tần số quét cao, tản nhiệt tốt khi chơi game lâu" },
      { pattern: /\b(pro|plus|s2\d|s1\d)\b/, weight: 1, reason: "Hiệu năng cao, chơi game nặng ổn định" },
    ],
    tablet: [{ pattern: /\b(ipad pro|ipad air|tab s\d*)\b/, weight: 1.6, reason: "Màn hình lớn, chip mạnh để chơi game" }],
  },
  camera: {
    phone: [
      { pattern: /\b(pro max|ultra)\b/, weight: 2.2, reason: "Camera zoom quang học xa, quay video chống rung tốt" },
      { pattern: /\b(pro|pixel|find x\d*|vivo x\d*|xiaomi 1\d)\b/, weight: 1.5, reason: "Cụm camera nhiều ống kính, chụp đêm và chân dung đẹp" },
    ],
    camera: [{ pattern: /./, weight: 0.5, reason: "Cảm biến lớn, chất lượng ảnh vượt xa điện thoại" }],
  },
  battery: {
    phone: [
      { pattern: /\b(pro max|plus|ultra|max|note|galaxy m\d*|power)\b/, weight: 2, reason: "Thân máy lớn, pin dung lượng cao dùng thoải mái cả ngày" },
      { pattern: /\b(mini|flip)\b/, weight: -1.2, reason: "" },
    ],
    laptop: [{ pattern: /\b(macbook|air|gram|zenbook|swift|yoga|xps)\b/, weight: 1.8, reason: "Chip tiết kiệm điện, pin làm việc cả ngày không cần sạc" }],
  },
  study: {
    laptop: [
      { pattern: /\b(macbook air|air|vivobook|zenbook|ideapad|inspiron|aspire|swift|thinkpad|latitude|vostro|pavilion|probook|expertbook|modern|gram|yoga)\b/, weight: 1.8, reason: "Mỏng nhẹ, pin tốt, đủ mạnh cho học tập và văn phòng" },
      { pattern: /\b(predator|helios|alienware|aorus|strix)\b/, weight: -1, reason: "" },
    ],
    phone: [{ pattern: /\b(plus|pro|note|galaxy a\d*|redmi)\b/, weight: 0.8, reason: "Màn hình lớn, pin tốt cho học online" }],
    tablet: [{ pattern: /\b(ipad|air|tab)\b/, weight: 1.2, reason: "Ghi chú bằng bút, đọc tài liệu và học online tiện lợi" }],
  },
  creative: {
    laptop: [
      { pattern: /\b(macbook pro|proart|studiobook|zbook|xps|creator|spectre|oled|rtx 40\d0|rtx 50\d0|m\d (pro|max))\b/, weight: 2.4, reason: "Màn hình chuẩn màu, cấu hình mạnh cho đồ họa và dựng phim" },
      { pattern: /\b(rog|legion|predator|rtx)\b/, weight: 1.2, reason: "Card đồ họa rời mạnh, render nhanh" },
    ],
    desktop: [{ pattern: /\b(mac studio|mac mini|imac)\b/, weight: 1.6, reason: "Hiệu năng cao, chạy phần mềm đồ họa chuyên nghiệp mượt" }],
    tablet: [{ pattern: /\b(ipad pro|ipad air)\b/, weight: 1.6, reason: "Vẽ bằng Apple Pencil, màn hình đẹp cho thiết kế" }],
  },
  coding: {
    laptop: [
      { pattern: /\b(macbook|thinkpad|xps|zenbook|latitude|gram|pro)\b/, weight: 1.8, reason: "Bàn phím tốt, RAM lớn, bền bỉ khi lập trình nhiều giờ" },
      { pattern: /\b(celeron|pentium)\b/, weight: -1.5, reason: "" },
    ],
  },
  basic: {
    phone: [
      { pattern: /\b(plus|max|galaxy a\d*|redmi|note|oppo a\d*)\b/, weight: 1.2, reason: "Màn hình lớn dễ nhìn, thao tác đơn giản" },
      { pattern: /\b(pro max|ultra|fold)\b/, weight: -0.8, reason: "" },
    ],
  },
  compact: {
    phone: [
      { pattern: /\b(mini|\d+e|se|flip)\b/, weight: 2, reason: "Nhỏ gọn, cầm một tay thoải mái" },
      { pattern: /\b(pro)\b(?! max)/, weight: 0.8, reason: "Kích thước vừa tay mà vẫn mạnh" },
      { pattern: /\b(max|plus|ultra|fold)\b/, weight: -1.6, reason: "" },
    ],
    laptop: [{ pattern: /\b(air|13|14|gram|swift|zenbook)\b/, weight: 1.4, reason: "Mỏng nhẹ, dễ mang theo mỗi ngày" }],
  },
  gift: {
    phone: [{ pattern: /\b(iphone|galaxy s|flip)\b/, weight: 1.2, reason: "Thiết kế đẹp, thương hiệu được ưa chuộng làm quà" }],
    audio: [{ pattern: /\b(airpods|chong on)\b/, weight: 1.2, reason: "Món quà công nghệ được yêu thích" }],
    watch: [{ pattern: /./, weight: 0.8, reason: "Món quà thời trang và tiện ích" }],
  },
};

const GENERIC_REASON: Record<AdvisorCategory, string> = {
  phone: "Cân bằng tốt giữa hiệu năng, camera và pin trong tầm giá",
  laptop: "Cấu hình ổn định, đáp ứng tốt nhu cầu hằng ngày",
  tablet: "Màn hình lớn, giải trí và học tập đều tốt",
  desktop: "Hiệu năng mạnh, chạy êm và bền",
  watch: "Theo dõi sức khỏe, nhận thông báo tiện lợi",
  audio: "Âm thanh hay, kết nối nhanh",
  camera: "Chất lượng ảnh vượt trội so với điện thoại",
};

export function suggestCategory(purpose?: AdvisorPurpose): AdvisorCategory | undefined {
  if (purpose === "creative" || purpose === "coding") return "laptop";
  if (purpose === "camera" || purpose === "battery" || purpose === "basic" || purpose === "compact") return "phone";
  return undefined;
}

export function recommendProducts(catalog: AdvisorProduct[], state: AdvisorState): AdvisorResult {
  const category = state.category ?? suggestCategory(state.purpose) ?? "phone";
  const purpose = state.purpose ?? "general";
  const allowed = new Set(CATEGORY_GROUPS[category]);
  const brand = state.brand;

  const pool = catalog
    .filter((product) => product.active !== false && product.status !== "inactive" && product.status !== "draft")
    .filter((product) => allowed.has(product.category))
    .filter((product) => !state.exclude || (product.slug !== state.exclude && !product.slug.startsWith(`${state.exclude}-`)))
    .filter((product) => !CATEGORY_NAME_FILTER[category] || CATEGORY_NAME_FILTER[category]!.test(wordsOnly(product.name)))
    .filter((product) => !brand || matchesBrand(product, brand))
    .map((product) => ({ product, price: moneyValue(product.price), name: wordsOnly(product.name) }))
    .filter((item) => item.price > 0);

  const min = state.min ?? 0;
  const max = state.max ?? Number.POSITIVE_INFINITY;
  let note = "";
  let candidates = pool.filter((item) => item.price >= min && item.price <= max);

  if (candidates.length < 3 && Number.isFinite(max)) {
    const stretched = pool.filter((item) => item.price >= min * 0.9 && item.price <= max * 1.12);
    if (stretched.length > candidates.length) {
      candidates = stretched;
      if (stretched.some((item) => item.price > max)) note = " Có máy nhỉnh hơn ngân sách một chút vì đáng tiền hơn.";
    }
  }

  if (!candidates.length) {
    const target = Number.isFinite(max) ? max : min;
    candidates = [...pool].sort((a, b) => Math.abs(a.price - target) - Math.abs(b.price - target)).slice(0, 12);
    note = candidates.length ? ` Hiện chưa có ${CATEGORY_LABELS[category]} đúng ${formatBudget(state.min, state.max)}, đây là các lựa chọn gần nhất.` : "";
  }

  const signals = PROFILES[purpose]?.[category] ?? [];
  const cheapFirst = purpose === "basic" || purpose === "compact";
  const scored = candidates.map((item) => {
    let score = 0;
    let reason = "";
    for (const signal of signals) {
      if (!signal.pattern.test(item.name)) continue;
      score += signal.weight;
      if (signal.weight > 0 && !reason) reason = signal.reason;
    }
    if (Number.isFinite(max) && max > 0) {
      const ratio = Math.min(1.15, item.price / max);
      score += cheapFirst ? (1 - ratio) * 0.9 : ratio * 1.3;
    } else if (min > 0) {
      score += Math.max(0, 1 - (item.price - min) / min) * 0.8;
    }
    if (item.product.stock && item.product.stock > 0) score += 0.25;
    if (isUsed(item.product)) score -= 0.1;
    return { ...item, score, reason: reason || GENERIC_REASON[category] };
  });

  scored.sort((a, b) => b.score - a.score || b.price - a.price);

  const picked: typeof scored = [];
  const seen = new Set<string>();
  for (const item of scored) {
    const key = modelKey(item.name);
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(item);
    if (picked.length === 3) break;
  }

  if (!picked.length) {
    return {
      text: `Hiện chưa có ${CATEGORY_LABELS[category]}${brand ? ` ${capitalize(brand)}` : ""} phù hợp trong hệ thống. Bạn thử đổi ngân sách hoặc hãng nhé.`,
      products: [],
      quickReplies: ["Tư vấn lại", "Liên hệ tư vấn"],
    };
  }

  const products: ChatSuggestion[] = picked.map((item) => ({
    slug: item.product.slug,
    name: item.product.name,
    price: item.product.price,
    image: item.product.image || "",
    reason: [item.reason, budgetNote(item.price, state), isUsed(item.product) ? "máy cũ like-new, giá tốt" : ""].filter(Boolean).join(" · "),
  }));

  const brandLabel = brand ? ` ${capitalize(brand)}` : "";
  const purposeLabel = purpose !== "general" ? ` để ${PURPOSE_LABELS[purpose]}` : "";
  const intro = state.anchor
    ? `Cùng tầm giá ${state.anchor}${purposeLabel ? `, nếu ưu tiên ${PURPOSE_LABELS[purpose]}` : ""} bạn có thể cân nhắc ${products.length} ${CATEGORY_LABELS[category]}${brandLabel} này:`
    : `Với ngân sách ${formatBudget(state.min, state.max)}${purposeLabel}, đây là ${products.length} ${CATEGORY_LABELS[category]}${brandLabel} mình thấy hợp nhất:`;
  const prices = picked.map((item) => item.price);

  return {
    text: `${intro}${note}`,
    products,
    shownMin: Math.min(...prices),
    shownMax: Math.max(...prices),
    quickReplies: ["Rẻ hơn", "Cao cấp hơn", "Tư vấn lại"],
  };
}

function budgetNote(price: number, state: AdvisorState) {
  if (state.max && price > state.max) return `nhỉnh hơn ngân sách ${formatMillion(price - state.max)}`;
  if (state.max && state.max - price >= MILLION && (state.purpose === "basic" || state.purpose === "compact" || state.max - price >= state.max * 0.15)) {
    return `tiết kiệm ${formatMillion(state.max - price)}`;
  }
  return "";
}

function matchesBrand(product: AdvisorProduct, brand: string) {
  const haystack = wordsOnly(`${product.brand} ${product.name}`);
  const pattern = BRAND_WORDS.find(([key]) => key === brand)?.[1];
  return pattern ? pattern.test(haystack) : haystack.includes(brand);
}

function isUsed(product: AdvisorProduct) {
  return product.category === "laptop-cu" || product.condition === "like-new";
}

function modelKey(name: string) {
  return name
    .replace(/\b(\d+\s?(gb|tb))\b/g, " ")
    .replace(/\b(chinh hang|vn a|like new|cu|moi|nguyen seal|dien thoai|tai nghe|laptop)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 4)
    .join(" ");
}

function moneyValue(value: string) {
  return Number(String(value || "").replace(/[^\d]/g, "")) || 0;
}

function capitalize(value: string) {
  if (value === "hp" || value === "lg" || value === "msi") return value.toUpperCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
}
