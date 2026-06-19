export interface DonateConfig {
  enabled: boolean;
  pixKey: string;
  merchantName: string;
  merchantCity: string;
}

function parseEnvBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === "") return defaultValue;
  return value === "true" || value === "1";
}

export function readDonateEnvConfig(): DonateConfig {
  const pixKey = (process.env.NEXT_PUBLIC_DONATE_PIX_KEY ?? "").trim();
  const explicitlyEnabled = process.env.NEXT_PUBLIC_DONATE_ENABLED;
  const enabled =
    explicitlyEnabled !== undefined && explicitlyEnabled !== ""
      ? parseEnvBool(explicitlyEnabled, false)
      : pixKey.length > 0;

  return {
    enabled: enabled && pixKey.length > 0,
    pixKey,
    merchantName: (process.env.NEXT_PUBLIC_DONATE_MERCHANT_NAME ?? "Hootka").trim(),
    merchantCity: (process.env.NEXT_PUBLIC_DONATE_MERCHANT_CITY ?? "Sao Paulo").trim(),
  };
}

export function getDonateConfig(): DonateConfig {
  return readDonateEnvConfig();
}
