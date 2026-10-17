import { redirect } from "next/navigation";

// Trang thanh toán riêng đã gộp vào giỏ hàng; giữ đường dẫn cũ để liên kết đã lưu không bị 404.
export default function LegacyCheckoutRedirect() {
  redirect("/gio-hang");
}
