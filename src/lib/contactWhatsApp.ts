export interface ContactWhatsAppConfig {
  enabled: boolean;
  phoneNumber: string;
  creatorName: string;
}

function parseEnvBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === "") return defaultValue;
  return value === "true" || value === "1";
}

function normalizePhoneNumber(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidWhatsAppNumber(digits: string): boolean {
  return /^\d{10,15}$/.test(digits);
}

export function readContactWhatsAppEnvConfig(): ContactWhatsAppConfig {
  const phoneNumber = normalizePhoneNumber(
    process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_NUMBER ?? ""
  );
  const explicitlyEnabled = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_ENABLED;
  const enabledByDefault = phoneNumber.length > 0 && isValidWhatsAppNumber(phoneNumber);
  const enabled =
    explicitlyEnabled !== undefined && explicitlyEnabled !== ""
      ? parseEnvBool(explicitlyEnabled, false) && isValidWhatsAppNumber(phoneNumber)
      : enabledByDefault;

  return {
    enabled,
    phoneNumber,
    creatorName: (
      process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_CREATOR_NAME ?? "Jorge"
    ).trim(),
  };
}

export function buildWhatsAppPrefillMessage(creatorName: string): string {
  return `Olá, ${creatorName}!\n\nEstou usando o Hootka e queria conversar sobre:`;
}

export function buildWhatsAppUrl(
  config: ContactWhatsAppConfig = readContactWhatsAppEnvConfig()
): string | null {
  if (!config.enabled || !isValidWhatsAppNumber(config.phoneNumber)) {
    return null;
  }

  const text = encodeURIComponent(buildWhatsAppPrefillMessage(config.creatorName));
  return `https://wa.me/${config.phoneNumber}?text=${text}`;
}

export function isContactWhatsAppEnabled(
  config: ContactWhatsAppConfig = readContactWhatsAppEnvConfig()
): boolean {
  return config.enabled && isValidWhatsAppNumber(config.phoneNumber);
}
