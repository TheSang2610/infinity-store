import type { ChatIntent } from "@/src/constants/portal/chatbot-knowledge";
import type { AdvisorState, ChatSuggestion } from "@/src/lib/chatbot/advisor";
import type { BranchRow, PriceRow } from "@/src/lib/chatbot/consult";

export type ChatProduct = {
  slug: string;
  name: string;
  brand: string;
  price: string;
  tagline: string;
  stock?: number;
  active?: boolean;
};

export type ChatContext = {
  productSlug?: string;
  productName?: string;
  orderCode?: string;
  lastIntent?: ChatIntent;
  advisor?: AdvisorState;
};

export type BotReply = {
  intent: ChatIntent;
  confidence: number;
  text: string;
  context: ChatContext;
  link?: { href: string; label: string };
  showQuickReplies?: boolean;
  quickReplies?: string[];
  orderCode?: string;
  /** Khi có trường này, giao diện gọi API gợi ý sản phẩm theo tiêu chí đã thu thập. */
  recommend?: AdvisorState;
  /** Slug sản phẩm cần tư vấn chi tiết (giá theo phiên bản, chi nhánh còn hàng). */
  consult?: string;
  /** Phần cần trả lời: toàn bộ, chỉ giá hoặc chỉ chi nhánh còn hàng. */
  consultFocus?: "all" | "price" | "availability";
};

export type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
  createdAt: number;
  intent?: ChatIntent;
  confidence?: number;
  link?: { href: string; label: string };
  products?: ChatSuggestion[];
  quickReplies?: string[];
  prices?: PriceRow[];
  branches?: BranchRow[];
};
