// Doc bien moi truong mot cho duy nhat. Cac module khac khong doc process.env truc tiep.

function optional(name: string) {
  return process.env[name]?.trim() ?? "";
}

export const env = {
  get nodeEnv() {
    return optional("NODE_ENV") || "development";
  },
  get isProduction() {
    return this.nodeEnv === "production";
  },
  get port() {
    return Number(optional("PORT")) || 4000;
  },
  get databaseUrl() {
    return optional("DATABASE_URL");
  },
  /** Dia chi frontend, dung de chuyen huong sau dang nhap Google. */
  get frontendUrl() {
    return optional("FRONTEND_URL") || "http://localhost:3000";
  },

  // Tai khoan chu cua hang tao luc seed (khong con mat khau mac dinh trong code).
  get ownerUsername() {
    return optional("OWNER_USERNAME") || "admin";
  },
  get ownerPassword() {
    return optional("OWNER_PASSWORD");
  },

  get cassoWebhookSecret() {
    return optional("CASSO_WEBHOOK_SECRET");
  },

  get googleClientId() {
    return optional("GOOGLE_CLIENT_ID");
  },
  get googleClientSecret() {
    return optional("GOOGLE_CLIENT_SECRET");
  },
  get googleRedirectUri() {
    return optional("GOOGLE_REDIRECT_URI");
  },

  get twilioAccountSid() {
    return optional("TWILIO_ACCOUNT_SID");
  },
  get twilioAuthToken() {
    return optional("TWILIO_AUTH_TOKEN");
  },
  get twilioVerifyServiceSid() {
    return optional("TWILIO_VERIFY_SERVICE_SID");
  },

  /** "local" luu anh vao o dia (dev), "blob" luu len Vercel Blob (production). */
  get storageDriver(): "local" | "blob" {
    return optional("STORAGE_DRIVER") === "blob" ? "blob" : "local";
  },
  get uploadDir() {
    return optional("UPLOAD_DIR") || "uploads";
  },
  get blobToken() {
    return optional("BLOB_READ_WRITE_TOKEN");
  },

  /** Khoa ma hoa ho so nhan su - PHAI giong ban cu de doc duoc du lieu da chuyen sang. */
  get hrDataKey() {
    return optional("HR_DATA_KEY");
  },

  // Passkey cham cong (WebAuthn): ten mien va dia chi trang web nhan vien mo.
  get passkeyRpId() {
    return optional("PASSKEY_RP_ID") || new URL(this.frontendUrl).hostname;
  },
  get passkeyOrigins() {
    return (optional("PASSKEY_ORIGINS") || this.frontendUrl).split(",").map((item) => item.trim()).filter(Boolean);
  },

  /** Khoa bi mat chung giua frontend va backend (frontend gui kem IP that cua khach). */
  get internalApiSecret() {
    return optional("INTERNAL_API_SECRET");
  },

  /** May chu nhan dien khuon mat (Python DeepFace). De trong = tat tinh nang cham cong khuon mat. */
  get faceApiUrl() {
    return optional("FACE_API_URL");
  },
  get faceApiKey() {
    return optional("FACE_API_KEY");
  },
  /**
   * Tu bat may chu khuon mat (python-ai/.venv) khi co nguoi can cham cong, chi khi FACE_API_URL tro ve may nay.
   * Mac dinh bat o dev, tat o production (Vercel khong chay duoc Python ben canh backend).
   */
  get faceAutostart() {
    const value = optional("FACE_AUTOSTART").toLowerCase();
    return value ? value === "true" : !this.isProduction;
  },
  /** Khong ai dung bao nhieu phut thi tat may chu khuon mat da tu bat (TensorFlow ton ~1,5 GB RAM). 0 = khong tat. */
  get faceIdleMinutes() {
    const value = optional("FACE_IDLE_MINUTES");
    return value === "" ? 15 : Math.max(0, Number(value) || 0);
  },
  /** Thu muc python-ai (mac dinh ../python-ai tinh tu backend/). */
  get faceServerDir() {
    return optional("FACE_SERVER_DIR");
  },
};
