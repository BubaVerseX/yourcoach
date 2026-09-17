export const PREMIUM_ANNUAL_PRICE = { amount: 10, currency: "GEL" } as const;

export function isIpayConfigured(): boolean {
  return Boolean(process.env.IPAY_CLIENT_ID && process.env.IPAY_SECRET_KEY);
}
