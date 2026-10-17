import {
  CHATBOT_KNOWLEDGE,
  CHATBOT_SHIPPING_KNOWLEDGE,
  CHATBOT_SYNONYMS,
  CHATBOT_UNKNOWN,
  type ChatIntent,
} from "@/src/constants/portal/chatbot-knowledge";
import type { BotReply, ChatContext, ChatProduct } from "@/src/lib/chatbot/types";
import {
  CATEGORY_LABELS,
  PURPOSE_LABELS,
  formatBudget,
  parseAdvisorMessage,
  suggestCategory,
  type AdvisorCategory,
  type AdvisorState,
} from "@/src/lib/chatbot/advisor";

const CONFIDENCE_THRESHOLD = 0.43;
const PRODUCT_THRESHOLD = 0.58;
const ORDER_CODE_PATTERN = /\bHA[A-Z0-9]{10}\b/i;
const STOP_WORDS = new Set(["cho", "toi", "mình", "minh", "cua", "với", "voi", "là", "la", "co", "khong", "ơi", "oi"]);

export function normalizeChatText(value: string) {
  let normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const [source, target] of Object.entries(CHATBOT_SYNONYMS)) {
    const plainSource = normalizeWithoutSynonyms(source);
    if (normalized === plainSource || normalized.includes(` ${plainSource} `) || normalized.startsWith(`${plainSource} `) || normalized.endsWith(` ${plainSource}`)) {
      normalized = normalized.replace(new RegExp(`\\b${escapeRegExp(plainSource)}\\b`, "g"), normalizeWithoutSynonyms(target));
    }
  }
  return normalized;
}

export function createBotReply(message: string, products: ChatProduct[], context: ChatContext = {}): BotReply {
  const cleanMessage = message.trim().slice(0, 300);
  const normalized = normalizeChatText(cleanMessage);
  const orderCode = cleanMessage.match(ORDER_CODE_PATTERN)?.[0]?.toUpperCase();
  const intentResult = detectIntent(normalized);
  const productResult = findProduct(normalized, products);
  const contextProduct = context.productSlug ? products.find((product) => product.slug === context.productSlug) : undefined;

  const shippingFollowUp = context.lastIntent === "shipping" && isShippingFollowUp(normalized);
  if ((intentResult.intent === "shipping" && intentResult.confidence >= CONFIDENCE_THRESHOLD) || shippingFollowUp) {
    return {
      intent: "shipping",
      confidence: shippingFollowUp ? Math.max(intentResult.confidence, 0.82) : intentResult.confidence,
      text: findShippingResponse(normalized),
      context: { ...context, lastIntent: "shipping" },
    };
  }

  if (orderCode && (intentResult.intent === "order_status" || normalized === normalizeChatText(orderCode))) {
    return {
      intent: "order_status",
      confidence: 1,
      text: `Mình đang kiểm tra mã đơn ${orderCode} trên hệ thống nội bộ.`,
      context: { ...context, orderCode, lastIntent: "order_status" },
      orderCode,
    };
  }

  // Hỏi tiếp về sản phẩm đang tư vấn: "chi nhánh nào còn hàng?", "ở đâu có sẵn?"
  if (contextProduct && !productResult && isAvailabilityQuestion(normalizeWithoutSynonyms(cleanMessage))) {
    return consultReply(contextProduct, context, 0.9, "availability");
  }

  const otherTopic = intentResult.confidence >= 0.6 && !["products", "product_price", "product_search", "greeting", "advisor", "unknown"].includes(intentResult.intent);
  const advisorResult = advisorReply(cleanMessage, context, Boolean(productResult && productResult.confidence >= 0.75), otherTopic || ["product_price", "product_search"].includes(intentResult.intent));
  if (advisorResult) return advisorResult;

  if (productResult && shouldUseProductResult(intentResult.intent, normalized, productResult.confidence)) {
    return consultReply(productResult.product, context, Math.max(intentResult.confidence, productResult.confidence));
  }

  if (intentResult.intent === "product_price" && contextProduct) {
    return consultReply(contextProduct, context, intentResult.confidence, "price");
  }

  if (intentResult.intent === "warranty" && contextProduct) {
    return {
      intent: "warranty",
      confidence: intentResult.confidence,
      text: `Với ${contextProduct.name}, thời hạn và điều kiện bảo hành cần được xác nhận theo phiên bản, tình trạng máy và nhà cung cấp. Cửa hàng sẽ ghi rõ thông tin này trước khi giao máy.`,
      context: { ...context, lastIntent: "warranty" },
      link: { href: `/san-pham/${contextProduct.slug}`, label: "Xem lại sản phẩm" },
    };
  }

  if (intentResult.confidence < CONFIDENCE_THRESHOLD || intentResult.intent === "unknown") {
    return { intent: "unknown", confidence: intentResult.confidence, text: CHATBOT_UNKNOWN, context: { ...context, lastIntent: "unknown" }, showQuickReplies: true };
  }

  return {
    intent: intentResult.intent,
    confidence: intentResult.confidence,
    text: CHATBOT_KNOWLEDGE[intentResult.intent].response,
    context: { ...context, lastIntent: intentResult.intent },
    showQuickReplies: intentResult.intent === "products",
  };
}

const BUDGET_REPLIES = ["Dưới 10 triệu", "10 - 20 triệu", "20 - 30 triệu", "Trên 30 triệu"];
const CATEGORY_REPLIES = ["Điện thoại", "Laptop", "Máy tính bảng", "Tai nghe"];
const PURPOSE_REPLIES: Partial<Record<AdvisorCategory, string[]>> = {
  phone: ["Chụp ảnh, quay video", "Chơi game", "Pin trâu", "Cho bố mẹ", "Nhỏ gọn", "Dùng đa năng"],
  laptop: ["Học tập, văn phòng", "Chơi game", "Đồ họa, dựng video", "Lập trình", "Dùng đa năng"],
  tablet: ["Học tập", "Vẽ, thiết kế", "Chơi game", "Dùng đa năng"],
};

// Thu thập dần 3 tiêu chí: loại máy → ngân sách → mục đích, rồi yêu cầu giao diện lấy gợi ý.
function advisorReply(message: string, context: ChatContext, exactProductMentioned: boolean, otherTopic: boolean): BotReply | undefined {
  const previous = context.advisor ?? {};
  const inFlow = context.lastIntent === "advisor";
  const parsed = parseAdvisorMessage(message, inFlow && previous.awaiting === "budget");
  const normalized = normalizeWithoutSynonyms(message);
  const startsFlow = parsed.cue || parsed.hasBudget || parsed.reset || normalized === "tu van chon may";
  // Đang hỏi mục đích mà khách trả lời tự do (không phải câu hỏi chủ đề khác) -> coi như dùng đa năng.
  if (inFlow && previous.awaiting === "purpose" && !parsed.purpose && !otherTopic && normalized.split(" ").length <= 8) {
    parsed.purpose = "general";
  }
  const continuesFlow = inFlow && !otherTopic && (parsed.category || parsed.brand || parsed.purpose || parsed.cheaper || parsed.pricier || parsed.reset);

  if (!startsFlow && !continuesFlow && !(parsed.purpose && parsed.category)) return undefined;
  // Khách hỏi đúng một model cụ thể mà không nêu ngân sách/nhu cầu -> để luồng tra cứu sản phẩm trả lời.
  if (exactProductMentioned && !parsed.hasBudget && !parsed.purpose && !parsed.reset) return undefined;

  let state: AdvisorState = parsed.reset ? {} : { ...previous };
  if (parsed.category) state.category = parsed.category;
  if (parsed.brand) state.brand = parsed.brand;
  if (parsed.purpose) state.purpose = parsed.purpose;
  if (parsed.hasBudget) {
    state.min = parsed.min;
    state.max = parsed.max;
    // Khách tự nêu ngân sách mới -> không còn so sánh quanh mẫu máy đang xem.
    state.anchor = undefined;
    state.exclude = undefined;
  }
  if (!parsed.hasBudget && parsed.cheaper && state.shownMin) {
    state = { ...state, min: undefined, max: state.shownMin - 1 };
  }
  if (!parsed.hasBudget && parsed.pricier && state.shownMax) {
    state = { ...state, min: state.shownMax + 1, max: Math.round(state.shownMax * 1.5) };
  }
  if (!state.category && state.purpose) state.category = suggestCategory(state.purpose);
  if (!state.category && state.brand && ["asus", "acer", "dell", "hp", "lenovo", "msi", "lg", "gigabyte"].includes(state.brand)) state.category = "laptop";

  const reply = (text: string, awaiting: AdvisorState["awaiting"], quickReplies: string[]): BotReply => ({
    intent: "advisor",
    confidence: 0.95,
    text,
    context: { ...context, lastIntent: "advisor", advisor: { ...state, awaiting } },
    quickReplies,
  });

  const known = [
    state.category && CATEGORY_LABELS[state.category],
    (state.min || state.max) && `ngân sách ${formatBudget(state.min, state.max)}`,
    state.purpose && state.purpose !== "general" && PURPOSE_LABELS[state.purpose],
  ].filter(Boolean).join(", ");
  const ack = known ? `Mình đã ghi nhận: ${known}. ` : "";

  if (!state.category) {
    return reply(`${ack}Bạn đang tìm loại máy nào ạ?`, "category", CATEGORY_REPLIES);
  }
  if (!state.min && !state.max) {
    return reply(`${ack}Ngân sách của bạn khoảng bao nhiêu? Bạn có thể nhắn "tầm 15 triệu" hoặc "10 - 20tr".`, "budget", BUDGET_REPLIES);
  }
  if (!state.purpose && ["phone", "laptop", "tablet"].includes(state.category)) {
    return reply(`${ack}Bạn dùng máy chủ yếu để làm gì?`, "purpose", PURPOSE_REPLIES[state.category] ?? ["Dùng đa năng"]);
  }

  return {
    intent: "advisor",
    confidence: 0.97,
    text: "Mình đang lọc máy phù hợp...",
    context: { ...context, lastIntent: "advisor", advisor: { ...state, awaiting: undefined } },
    recommend: { ...state, awaiting: undefined },
  };
}

// Tư vấn sản phẩm cụ thể. Văn bản dưới đây là bản dự phòng; giao diện gọi /api/chatbot/product để lấy
// bảng giá theo phiên bản, chi nhánh còn hàng và câu hỏi nhu cầu.
function consultReply(product: ChatProduct, context: ChatContext, confidence: number, focus: BotReply["consultFocus"] = "all"): BotReply {
  const stockText = typeof product.stock === "number" && product.stock > 0
    ? ` Tồn kho hệ thống: ${product.stock} sản phẩm.`
    : " Tồn kho sẽ được cửa hàng xác nhận trước khi giao.";
  return {
    intent: "product_price",
    confidence,
    text: `${product.name}: ${product.price}. ${product.tagline}${stockText}`,
    context: { ...context, productSlug: product.slug, productName: product.name, lastIntent: "advisor", advisor: { awaiting: "purpose", exclude: product.slug } },
    link: { href: `/san-pham/${product.slug}`, label: "Xem sản phẩm" },
    consult: product.slug,
    consultFocus: focus,
  };
}

function isAvailabilityQuestion(normalized: string) {
  return /\b(con hang|het hang|chi nhanh nao|cua hang nao|o dau co|san hang|co san|con may|con khong|cho nao ban|mua o dau|xem may o dau)\b/.test(normalized);
}

function findShippingResponse(normalized: string) {
  let bestResponse = CHATBOT_KNOWLEDGE.shipping.response;
  let bestScore = 0;

  for (const rule of CHATBOT_SHIPPING_KNOWLEDGE) {
    const phrases = rule.phrases.map(normalizeChatText);
    const keywords = rule.keywords.map(normalizeChatText);
    const exactPhrase = phrases.some((phrase) => hasWords(normalized, phrase)) ? 1 : 0;
    const phraseScore = Math.max(0, ...phrases.map((phrase) => textSimilarity(normalized, phrase) * 0.86));
    const keywordMatches = keywords.filter((keyword) => hasWords(normalized, keyword)).length;
    const keywordScore = keywordMatches ? Math.min(0.96, 0.58 + keywordMatches * 0.16) : 0;
    const score = Math.max(exactPhrase, phraseScore, keywordScore);
    if (score > bestScore) {
      bestScore = score;
      bestResponse = rule.response;
    }
  }

  return bestResponse;
}

// So khớp theo nguyên từ: tránh "hi" khớp nhầm trong "phí", "chi nhánh".
function hasWords(text: string, phrase: string) {
  return Boolean(phrase) && ` ${text} `.includes(` ${phrase} `);
}

function isShippingFollowUp(normalized: string) {
  return [
    "bao lau", "bao ngay", "may ngay", "khi nao", "phi bao nhieu", "mat phi", "hoa toc",
    "don vi nao", "hang nao", "viettel", "j t", "spx", "tinh", "hinh thuc nao", "cach nao",
  ].some((phrase) => normalized.includes(phrase));
}

function detectIntent(normalized: string): { intent: ChatIntent; confidence: number } {
  if (!normalized) return { intent: "unknown", confidence: 0 };
  let best: { intent: ChatIntent; confidence: number } = { intent: "unknown", confidence: 0 };

  for (const [intent, knowledge] of Object.entries(CHATBOT_KNOWLEDGE) as Array<[ChatIntent, (typeof CHATBOT_KNOWLEDGE)[ChatIntent]]>) {
    if (intent === "unknown") continue;
    const phraseScore = Math.max(0, ...knowledge.phrases.map((phrase) => textSimilarity(normalized, normalizeChatText(phrase))));
    const normalizedKeywords = knowledge.keywords.map(normalizeChatText);
    const matchedKeywords = normalizedKeywords.filter((keyword) => hasWords(normalized, keyword));
    const keywordScore = matchedKeywords.length ? Math.min(1, 0.46 + matchedKeywords.length * 0.2) : 0;
    // Cụm dài khớp nguyên văn được ưu tiên hơn cụm ngắn ("giá sản phẩm" thắng "sản phẩm").
    const exactLength = Math.max(0, ...knowledge.phrases.map(normalizeChatText).filter((phrase) => hasWords(normalized, phrase)).map((phrase) => phrase.length));
    const exactPhrase = exactLength ? 0.9 + Math.min(0.08, exactLength / 250) : 0;
    const confidence = Math.max(phraseScore * 0.82, keywordScore, exactPhrase);
    if (confidence > best.confidence) best = { intent, confidence };
  }
  return best;
}

function findProduct(query: string, products: ChatProduct[]) {
  const queryTokens = usefulTokens(query);
  let best: { product: ChatProduct; confidence: number } | undefined;
  for (const product of products) {
    if (product.active === false) continue;
    const name = normalizeChatText(product.name);
    const nameTokens = usefulTokens(name);
    // Tên lõi bỏ phần "| Chính hãng", dung lượng... để "iPhone 15 Pro Max" không bị nhầm thành "iPhone 15".
    const core = normalizeChatText(product.name.split("|")[0]).replace(/\b\d+\s?(gb|tb)\b/g, " ").replace(/\b(chinh hang|dien thoai)\b/g, " ").replace(/\s+/g, " ").trim();
    const direct = core.length >= 4 && query.includes(core)
      ? 0.9 + Math.min(0.09, core.length / 250)
      : query.includes(name) || name.includes(query) ? 0.98 : 0;
    const overlap = tokenOverlap(queryTokens, nameTokens);
    const compactQuery = queryTokens.join(" ");
    const compactName = nameTokens.join(" ");
    const fuzzy = compactQuery.length >= 4 ? textSimilarity(compactQuery, compactName) : 0;
    const confidence = Math.max(direct, overlap * 0.9, fuzzy * 0.78);
    if (!best || confidence > best.confidence) best = { product, confidence };
  }
  return best && best.confidence >= PRODUCT_THRESHOLD ? best : undefined;
}

function shouldUseProductResult(intent: ChatIntent, query: string, confidence: number) {
  if (confidence < PRODUCT_THRESHOLD) return false;
  if (["warranty", "shipping", "payment", "store_information", "contact", "promotion", "order_status", "thanks", "goodbye"].includes(intent)) return false;
  return intent === "product_price" || intent === "product_search" || intent === "products" || query.split(" ").length <= 7;
}

function textSimilarity(left: string, right: string) {
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return Math.min(0.92, Math.min(left.length, right.length) / Math.max(left.length, right.length) + 0.35);
  const distance = levenshtein(left, right);
  return Math.max(0, 1 - distance / Math.max(left.length, right.length));
}

function tokenOverlap(left: string[], right: string[]) {
  if (!left.length || !right.length) return 0;
  const rightSet = new Set(right);
  const matches = left.filter((token) => rightSet.has(token)).length;
  return matches / Math.max(1, Math.min(left.length, right.length));
}

function usefulTokens(value: string) {
  return value.split(" ").filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function levenshtein(left: string, right: string) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (left[i - 1] === right[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[right.length];
}

function normalizeWithoutSynonyms(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
