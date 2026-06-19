import { NextResponse } from "next/server";

export function globalQuizErrorResponse(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (process.env.NODE_ENV !== "production") {
    console.error("[globalQuiz] Erro:", {
      code,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  const status =
    code === "AUTH_REQUIRED"
      ? 401
      : code === "FORBIDDEN" || code === "EMAIL_NOT_VERIFIED"
        ? 403
        : code === "QUIZ_NOT_FOUND"
          ? 404
          : code === "ATTEMPT_LIMIT_REACHED" ||
              code === "NO_ACTIVE_ATTEMPT" ||
              code === "ANSWER_ALREADY_SUBMITTED" ||
              code === "INVALID_OPTION" ||
              code === "INVALID_EXTRA_ATTEMPTS" ||
              code === "PROFILE_USERNAME_REQUIRED"
            ? 400
            : 500;

  const messageMap: Record<string, string> = {
    AUTH_REQUIRED: "Faça login para continuar.",
    EMAIL_NOT_VERIFIED: "Confirme seu e-mail para continuar.",
    PROFILE_USERNAME_REQUIRED:
      "Informe um nome de 2 a 30 caracteres para aparecer no ranking.",
    FORBIDDEN: "Você não tem permissão para realizar esta ação.",
    QUIZ_NOT_FOUND: "Desafio não encontrado.",
    ATTEMPT_LIMIT_REACHED: "Você atingiu o limite de tentativas deste desafio.",
    NO_ACTIVE_ATTEMPT: "Nenhuma tentativa ativa encontrada.",
    ANSWER_ALREADY_SUBMITTED: "Esta pergunta já foi respondida.",
    INVALID_OPTION: "Alternativa inválida.",
    INVALID_EXTRA_ATTEMPTS: "Informe um número válido de tentativas extras.",
  };

  return NextResponse.json(
    {
      error: messageMap[code] ?? code,
      code,
    },
    { status }
  );
}
