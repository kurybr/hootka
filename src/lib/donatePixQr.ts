import { createStaticPix, hasError } from "pix-utils";

export interface DonatePixQrInput {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  infoAdicional?: string;
}

export function buildDonatePixBrCode(input: DonatePixQrInput): string {
  const pix = createStaticPix({
    merchantName: input.merchantName,
    merchantCity: input.merchantCity,
    pixKey: input.pixKey,
    infoAdicional: input.infoAdicional ?? "Apoio Hootka",
    transactionAmount: 0,
  });

  if (hasError(pix)) {
    throw new Error("Não foi possível gerar o Pix.");
  }

  return pix.toBRCode();
}

export async function buildDonatePixQrImage(
  input: DonatePixQrInput
): Promise<string> {
  const pix = createStaticPix({
    merchantName: input.merchantName,
    merchantCity: input.merchantCity,
    pixKey: input.pixKey,
    infoAdicional: input.infoAdicional ?? "Apoio Hootka",
    transactionAmount: 0,
  });

  if (hasError(pix)) {
    throw new Error("Não foi possível gerar o QR Code Pix.");
  }

  return pix.toImage();
}
