import type { DonateConfig } from "@/lib/donateConfig";

let cachedConfig: DonateConfig | null = null;

export async function fetchDonateConfig(): Promise<DonateConfig> {
  if (cachedConfig) return cachedConfig;

  const response = await fetch("/api/donate/config");
  if (!response.ok) {
    throw new Error("Não foi possível carregar a configuração de doação.");
  }

  const data = (await response.json()) as { config: DonateConfig };
  cachedConfig = data.config;
  return data.config;
}
