import { createStaticPix, hasError } from "pix-utils";

export interface DonatePixQrInput {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  infoAdicional?: string;
  transactionAmount?: number;
}

function createDonatePix(input: DonatePixQrInput) {
  const pix = createStaticPix({
    merchantName: input.merchantName,
    merchantCity: input.merchantCity,
    pixKey: input.pixKey,
    infoAdicional: input.infoAdicional ?? "Apoio Hootka",
    transactionAmount: input.transactionAmount ?? 0,
  });

  if (hasError(pix)) {
    throw new Error("Não foi possível gerar o Pix.");
  }

  return pix;
}

export function buildDonatePixBrCode(input: DonatePixQrInput): string {
  return createDonatePix(input).toBRCode();
}

export async function buildDonatePixQrImage(
  input: DonatePixQrInput
): Promise<string> {
  return createDonatePix(input).toImage();
}
