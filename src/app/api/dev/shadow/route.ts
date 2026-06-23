import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebaseAdmin";
import {
  isShadowLoginEnabledServer,
  isValidShadowEmail,
  normalizeShadowEmail,
} from "@/lib/shadowLogin";
import {
  requireAdmin,
  requireAuthenticatedUser,
} from "@/server/auth";

export async function POST(request: NextRequest) {
  if (!isShadowLoginEnabledServer()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const adminUser = await requireAuthenticatedUser(request);
    requireAdmin(adminUser);
  } catch (error) {
    const code = error instanceof Error ? error.message : "ERRO_DESCONHECIDO";
    if (code === "AUTH_REQUIRED") {
      return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
    }
    if (code === "FORBIDDEN") {
      return NextResponse.json({ error: "Apenas administradores." }, { status: 403 });
    }
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const auth = getFirebaseAdminAuth();
  if (!auth) {
    return NextResponse.json(
      { error: "Firebase Admin não configurado." },
      { status: 503 }
    );
  }

  let email: string;
  try {
    const body = (await request.json()) as { email?: string };
    if (!body.email || typeof body.email !== "string") {
      return NextResponse.json({ error: "E-mail é obrigatório." }, { status: 400 });
    }
    email = normalizeShadowEmail(body.email);
    if (!isValidShadowEmail(email)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  try {
    const targetUser = await auth.getUserByEmail(email);
    const token = await auth.createCustomToken(targetUser.uid);

    return NextResponse.json({
      token,
      uid: targetUser.uid,
      email: targetUser.email ?? email,
      displayName: targetUser.displayName ?? null,
    });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code)
        : "";

    if (code === "auth/user-not-found") {
      return NextResponse.json(
        { error: "Usuário não encontrado com esse e-mail." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Não foi possível iniciar o modo shadow." },
      { status: 500 }
    );
  }
}
