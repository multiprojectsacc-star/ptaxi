import { env } from "cloudflare:workers";
import { ApiError } from "./rules";

export function config() {
  const mode = env.DEMO_MODE === "false" ? "live" as const : "demo" as const;
  const radius = Number(env.SERVICE_RADIUS_KM || 0);
  return {
    mode,
    radiusKm: Number.isFinite(radius) && radius >= 0 && radius <= 1000 ? radius : 0,
    tomtomKey: env.TOMTOM_API_KEY,
    appUrl: env.APP_URL?.replace(/\/$/, ""),
    merchantId: Number(env.P24_MERCHANT_ID),
    posId: Number(env.P24_POS_ID || env.P24_MERCHANT_ID),
    p24Key: env.P24_API_KEY,
    p24Crc: env.P24_CRC,
    p24Base: env.P24_SANDBOX === "true" ? "https://sandbox.przelewy24.pl" : "https://secure.przelewy24.pl",
    resendKey: env.RESEND_API_KEY,
    emailFrom: env.EMAIL_FROM,
    operationsEmail: env.OPERATIONS_EMAIL,
    cronSecret: env.CRON_SECRET,
  };
}
export type Config = ReturnType<typeof config>;

export function requireLiveConfig(c: Config) {
  if (!c.tomtomKey || !c.appUrl?.startsWith("https://") || !Number.isSafeInteger(c.merchantId) || c.merchantId < 1 || !Number.isSafeInteger(c.posId) || c.posId < 1 || !c.p24Key || !c.p24Crc || !c.resendKey || !c.emailFrom || !c.operationsEmail || !c.cronSecret || c.cronSecret.length < 32) {
    throw new ApiError(503, "LIVE_NOT_CONFIGURED", "Rezerwacje online są chwilowo niedostępne. Skontaktuj się z nami telefonicznie.");
  }
}
