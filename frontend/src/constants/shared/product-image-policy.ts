// Phai khop voi MAX_PRODUCT_IMAGE_MB cua backend (mac dinh 4 MB): Vercel chi nhan moi request
// toi da 4,5 MB, ban Cloudflare cu cho 20 MB.
export const MAX_PRODUCT_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_PRODUCT_IMAGE_LABEL = "4 MB";
export const RECOMMENDED_PRODUCT_IMAGE_EDGE = 1200;
