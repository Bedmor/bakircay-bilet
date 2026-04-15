import twilio from "twilio";

import { env } from "~/env";

export const sendOtpSms = async (phone: string, code: string) => {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_PHONE) {
    if (env.NODE_ENV !== "production") {
      console.info(`[DEV OTP] ${phone} -> ${code}`);
      return;
    }

    throw new Error("Twilio ortam degiskenleri eksik.");
  }

  const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    body: `Bakircay Bilet giris kodunuz: ${code}`,
    from: env.TWILIO_FROM_PHONE,
    to: phone,
  });
};
