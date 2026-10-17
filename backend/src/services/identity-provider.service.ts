import { env } from "../config/env";
import { badRequest, HttpError } from "../utils/http";

// Ket noi dich vu ngoai: dang nhap Google (OAuth) va gui ma OTP qua Twilio Verify.

export function googleOAuthConfig(redirectUri: string) {
  if (!env.googleClientId || !env.googleClientSecret) throw new HttpError(503, "Đăng nhập Google chưa được cấu hình.");
  return {
    clientId: env.googleClientId,
    clientSecret: env.googleClientSecret,
    redirectUri: env.googleRedirectUri || redirectUri,
  };
}

export async function fetchGoogleProfile(code: string, config: ReturnType<typeof googleOAuthConfig>) {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokens = await tokenResponse.json() as { access_token?: string; error_description?: string };
  if (!tokenResponse.ok || !tokens.access_token) throw badRequest(tokens.error_description || "Google không trả về access token.");

  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileResponse.ok) throw badRequest("Không thể đọc hồ sơ Google.");
  return await profileResponse.json() as { sub?: string; email?: string; email_verified?: boolean; name?: string };
}

export async function startOtpVerification(destinationInput: string, channel: "email" | "sms") {
  const destination = channel === "sms" ? vietnamPhone(destinationInput) : destinationInput.trim().toLowerCase();
  const response = await twilioVerifyRequest("Verifications", { To: destination, Channel: channel });
  if (response.status !== "pending") throw badRequest("Không thể gửi mã xác minh lúc này.");
  return destination;
}

export async function checkOtpVerification(destinationInput: string, code: string) {
  const destination = destinationInput.includes("@") ? destinationInput : vietnamPhone(destinationInput);
  const response = await twilioVerifyRequest("VerificationCheck", { To: destination, Code: code });
  return response.status === "approved";
}

async function twilioVerifyRequest(resource: "Verifications" | "VerificationCheck", values: Record<string, string>) {
  if (!env.twilioAccountSid || !env.twilioAuthToken || !env.twilioVerifyServiceSid) {
    throw new HttpError(503, "Dịch vụ xác minh email/SMS chưa được cấu hình.");
  }
  const response = await fetch(`https://verify.twilio.com/v2/Services/${encodeURIComponent(env.twilioVerifyServiceSid)}/${resource}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.twilioAccountSid}:${env.twilioAuthToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(values),
  });
  const result = await response.json() as { status?: string; message?: string };
  if (!response.ok) throw new HttpError(502, result.message || "Dịch vụ xác minh đang tạm gián đoạn.");
  return result;
}

function vietnamPhone(value: string) {
  const phone = value.replace(/[^\d+]/g, "");
  if (/^0\d{9,10}$/.test(phone)) return `+84${phone.slice(1)}`;
  if (/^84\d{9,10}$/.test(phone)) return `+${phone}`;
  if (/^\+\d{10,15}$/.test(phone)) return phone;
  throw badRequest("Số điện thoại phải đúng định dạng để nhận SMS.");
}
