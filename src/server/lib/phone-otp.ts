import { createHash, randomInt, timingSafeEqual } from "node:crypto";

import { env } from "~/env";

export const OTP_EXPIRY_SECONDS = 5 * 60;

export const normalizePhone = (phone: string) => phone.replace(/\s+/g, "").trim();

export const generateOtpCode = () => randomInt(100000, 999999).toString();

export const hashOtpCode = (code: string, phone: string) => {
  const normalizedPhone = normalizePhone(phone);
  return createHash("sha256")
    .update(`${normalizedPhone}:${code}:${env.AUTH_SECRET ?? "dev-secret"}`)
    .digest("hex");
};

export const verifyOtpCode = (
  code: string,
  phone: string,
  storedHash: string,
) => {
  const givenHash = hashOtpCode(code, phone);
  const safeGiven = Buffer.from(givenHash);
  const safeStored = Buffer.from(storedHash);

  if (safeGiven.length !== safeStored.length) {
    return false;
  }

  return timingSafeEqual(safeGiven, safeStored);
};
