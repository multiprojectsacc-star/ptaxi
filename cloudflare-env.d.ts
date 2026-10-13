declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    DEMO_MODE?: string;
    SERVICE_RADIUS_KM?: string;
    TOMTOM_API_KEY?: string;
    APP_URL?: string;
    P24_MERCHANT_ID?: string;
    P24_POS_ID?: string;
    P24_API_KEY?: string;
    P24_CRC?: string;
    P24_SANDBOX?: string;
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
    OPERATIONS_EMAIL?: string;
    CRON_SECRET?: string;
  }
}
