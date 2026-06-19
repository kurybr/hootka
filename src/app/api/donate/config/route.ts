import { NextResponse } from "next/server";
import { getDonateConfig } from "@/lib/donateConfig";

export async function GET() {
  try {
    const config = getDonateConfig();
    return NextResponse.json({ config });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a configuração de doação.",
      },
      { status: 500 }
    );
  }
}
