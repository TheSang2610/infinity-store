import type { Request, Response } from "express";
import {
  generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse,
  type AuthenticationResponseJSON, type AuthenticatorTransportFuture, type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { env } from "../config/env";
import { badRequest, forbidden, HttpError, notFound } from "../utils/http";
import { employeeCheck } from "../repositories/hr.repository";
import {
  consumeAttendanceChallenge, createAttendanceChallenge, getAttendancePasskeys, revokeAttendancePasskeys,
  saveAttendancePasskey, updateAttendancePasskeyCounter,
} from "../repositories/passkey.repository";

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };

function flowOf(value: unknown) {
  if (value === "registration" || value === "authentication") return value;
  throw badRequest("Yêu cầu xác thực không hợp lệ.");
}

export async function listPasskeys(req: Request, res: Response) {
  const passkeys = await getAttendancePasskeys(req.admin!.id);
  res.set(NO_STORE).json({ passkeys: passkeys.map(({ id, deviceType, backedUp, createdAt, lastUsedAt }) => ({ id, deviceType, backedUp, createdAt, lastUsedAt })) });
}

export async function revokePasskeys(req: Request, res: Response) {
  await revokeAttendancePasskeys(req.admin!.id);
  res.set(NO_STORE).json({ ok: true });
}

export async function createPasskeyOptions(req: Request, res: Response) {
  const user = req.admin!;
  const flow = flowOf(req.body?.flow);
  const passkeys = await getAttendancePasskeys(user.id);
  if (flow === "authentication" && !passkeys.length) throw new HttpError(409, "Bạn chưa đăng ký Face ID/sinh trắc học trên thiết bị.");
  const credentials = passkeys.map((item) => ({ id: item.id, transports: item.transports as AuthenticatorTransportFuture[] }));

  const options = flow === "registration"
    ? await generateRegistrationOptions({
      rpName: "Infinity Company Attendance",
      rpID: env.passkeyRpId,
      userID: new TextEncoder().encode(user.id),
      userName: user.username,
      userDisplayName: user.name,
      attestationType: "none",
      timeout: 60_000,
      excludeCredentials: credentials,
      authenticatorSelection: { authenticatorAttachment: "platform", residentKey: "discouraged", userVerification: "required" },
      preferredAuthenticatorType: "localDevice",
    })
    : await generateAuthenticationOptions({ rpID: env.passkeyRpId, timeout: 60_000, userVerification: "required", allowCredentials: credentials });

  const challengeId = await createAttendanceChallenge(user.id, flow, options.challenge);
  res.set(NO_STORE).json({ options, challengeId });
}

export async function verifyPasskey(req: Request, res: Response) {
  const user = req.admin!;
  const flow = flowOf(req.body?.flow);
  const challengeId = typeof req.body?.challengeId === "string" ? req.body.challengeId : "";
  if (!challengeId || !req.body?.response) throw badRequest("Phiên xác thực không hợp lệ.");
  const expectedChallenge = await consumeAttendanceChallenge(challengeId, user.id, flow);
  if (!expectedChallenge) throw new HttpError(410, "Phiên xác thực đã hết hạn. Vui lòng thử lại.");
  const expected = { expectedChallenge, expectedOrigin: env.passkeyOrigins, expectedRPID: env.passkeyRpId };

  if (flow === "registration") {
    const verification = await verifyRegistrationResponse({
      ...expected,
      response: req.body.response as RegistrationResponseJSON,
      requireUserPresence: true,
      requireUserVerification: true,
    }).catch(() => undefined);
    if (!verification?.verified || !verification.registrationInfo.userVerified) throw badRequest("Thiết bị chưa xác nhận được chủ nhân.");
    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
    await saveAttendancePasskey({
      id: credential.id,
      adminUserId: user.id,
      publicKey: isoBase64URL.fromBuffer(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports ?? [],
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
    });
    res.set(NO_STORE).json({ ok: true, message: "Đã đăng ký thiết bị sinh trắc học." });
    return;
  }

  const mode = req.body?.mode === "out" ? "out" : req.body?.mode === "in" ? "in" : "";
  if (!mode) throw badRequest("Loại chấm công không hợp lệ.");
  const response = req.body.response as AuthenticationResponseJSON;
  const passkey = (await getAttendancePasskeys(user.id)).find((item) => item.id === response.id);
  if (!passkey) throw notFound("Thiết bị này chưa được đăng ký cho tài khoản.");
  const verification = await verifyAuthenticationResponse({
    ...expected,
    response,
    credential: {
      id: passkey.id,
      publicKey: isoBase64URL.toBuffer(passkey.publicKey),
      counter: passkey.counter,
      transports: passkey.transports as AuthenticatorTransportFuture[],
    },
    requireUserVerification: true,
  }).catch(() => undefined);
  if (!verification?.verified || !verification.authenticationInfo.userVerified) throw forbidden("Xác thực khuôn mặt/sinh trắc học chưa thành công.");
  await updateAttendancePasskeyCounter(passkey.id, user.id, verification.authenticationInfo.newCounter);
  await employeeCheck(user.id, mode, `${user.name} · sinh trắc học thiết bị`);
  res.set(NO_STORE).json({ ok: true, status: mode === "in" ? "checked-in" : "checked-out" });
}
