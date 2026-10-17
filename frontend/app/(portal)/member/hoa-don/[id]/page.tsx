// Duong cu /member/hoa-don/:id dung chung trang hoa don cua /tai-khoan.
// Next.js doc `dynamic` luc build nen phai khai bao truc tiep o day, khong re-export duoc.
export { default, metadata } from "../../../tai-khoan/hoa-don/[id]/page";
export const dynamic = "force-dynamic";
