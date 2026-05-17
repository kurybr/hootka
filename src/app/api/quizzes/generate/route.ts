import { NextRequest, NextResponse } from "next/server";
import { validateQuestions } from "@/lib/questionUtils";
import { getFirebaseAdminDatabase } from "@/lib/firebaseAdmin";
import { getAuthenticatedUser, requireCreatorUser } from "@/server/auth";
import type { Question } from "@/types/quiz";
import {
  getMaxQuizAiGenerationsPerUser,
  getQuizAiGenerationCount,
  refundQuizAiGeneration,
  tryReserveQuizAiGeneration,
} from "@/lib/quizAiUsage";

export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(_request);
    if (!user) {
      return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    }
    requireCreatorUser(user);
    if (!getFirebaseAdminDatabase()) {
      return NextResponse.json(
        { error: "Firebase Admin não configurado.", used: 0, limit: 10, remaining: 10 },
        { status: 503 }
      );
    }
    const used = await getQuizAiGenerationCount(user.uid);
    const limit = getMaxQuizAiGenerationsPerUser();
    return NextResponse.json({
      used,
      limit,
      remaining: Math.max(0, limit - used),
    });
  } catch {
    return NextResponse.json(
      { error: "Você não tem permissão para ver o uso de IA." },
      { status: 403 }
    );
  }
}

export async function POST(request: NextRequest) {
  let uid: string;
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    }
    requireCreatorUser(user);
    uid = user.uid;
  } catch {
    return NextResponse.json(
      { error: "Você não tem permissão para usar a geração por IA." },
      { status: 403 }
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY não configurada no servidor." },
      { status: 503 }
    );
  }

  let body: { topic?: string; prompt?: string; count?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const topic = String(body?.topic ?? "").trim();
  const authorPrompt = String(body?.prompt ?? "").trim();
  const count = Math.min(12, Math.max(1, Math.floor(Number(body?.count) || 5)));

  const useFullQuiz = authorPrompt.length >= 8;
  if (!useFullQuiz && topic.length < 3) {
    return NextResponse.json(
      {
        error: authorPrompt.length > 0
          ? "Para gerar o quiz completo, use pelo menos 8 caracteres no pedido."
          : "Informe um tema com pelo menos 3 caracteres ou um pedido mais longo para o quiz completo.",
      },
      { status: 400 }
    );
  }

  if (!getFirebaseAdminDatabase()) {
    return NextResponse.json(
      { error: "Firebase Admin não configurado." },
      { status: 503 }
    );
  }

  const reserved = await tryReserveQuizAiGeneration(uid);
  if (!reserved) {
    const limit = getMaxQuizAiGenerationsPerUser();
    const used = await getQuizAiGenerationCount(uid);
    return NextResponse.json(
      {
        error: `Limite de ${limit} gerações com IA por usuário foi atingido.`,
        code: "QUIZ_AI_LIMIT",
        used,
        limit,
        remaining: 0,
      },
      { status: 429 }
    );
  }

  let success = false;
  try {
      const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
      const referer =
        process.env.NEXT_PUBLIC_APP_URL ||
        request.headers.get("origin") ||
        "http://localhost:3000";

      const prompt = useFullQuiz
        ? `Com base no pedido do autor abaixo, monte um quiz em português do Brasil para publicação online.

Pedido do autor:
"""${authorPrompt}"""

Responda APENAS com um objeto JSON válido, sem markdown, sem texto antes ou depois. Formato exato:
{
  "title": string (título curto e atrativo do quiz),
  "topic": string (etiqueta curta, ex.: área ou módulo),
  "description": string (2 a 4 frases explicando o quiz para o jogador),
  "questions": [ ... exatamente ${count} elementos ... ]
}

Cada elemento de "questions" deve ser:
{"text": string (enunciado), "options": array de exatamente 4 strings (alternativas), "correctOptionIndex": inteiro de 0 a 3}.`
        : `Gere exatamente ${count} perguntas de múltipla escolha em português do Brasil sobre: "${topic}".
Responda APENAS com um array JSON válido, sem markdown, sem texto extra.
Cada elemento do array deve ser um objeto:
{"text": string (enunciado), "options": array de 4 strings (alternativas), "correctOptionIndex": número inteiro 0 a 3}.`;

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": referer,
          "X-Title": "Hootka",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.65,
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        return NextResponse.json(
          { error: "Falha ao gerar perguntas (OpenRouter).", detail: t.slice(0, 300) },
          { status: 502 }
        );
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content || typeof content !== "string") {
        return NextResponse.json({ error: "Resposta vazia do modelo." }, { status: 502 });
      }

      let parsed: unknown;
      const trimmed = content.trim();
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        const objectMatch = trimmed.match(/\{[\s\S]*\}/);
        const arrayMatch = trimmed.match(/\[[\s\S]*\]/);
        const fragment = useFullQuiz ? objectMatch?.[0] : arrayMatch?.[0] ?? objectMatch?.[0];
        if (fragment) {
          try {
            parsed = JSON.parse(fragment);
          } catch {
            return NextResponse.json(
              { error: "Não foi possível interpretar o JSON da IA." },
              { status: 502 }
            );
          }
        } else {
          return NextResponse.json(
            { error: "Não foi possível interpretar o JSON da IA." },
            { status: 502 }
          );
        }
      }

      if (useFullQuiz) {
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          return NextResponse.json(
            { error: "A IA não retornou um objeto de quiz válido." },
            { status: 502 }
          );
        }
        const obj = parsed as Record<string, unknown>;
        const title = String(obj.title ?? "").trim();
        const topicLabel = String(obj.topic ?? "").trim();
        const description = String(obj.description ?? "").trim();
        const rawQuestions = obj.questions;

        if (!title) {
          return NextResponse.json(
            { error: "A IA não retornou um título válido." },
            { status: 502 }
          );
        }

        if (!Array.isArray(rawQuestions)) {
          return NextResponse.json(
            { error: "A IA não retornou a lista de perguntas." },
            { status: 502 }
          );
        }

        const questions = rawQuestions as Question[];
        const validationError = validateQuestions(questions);
        if (validationError) {
          return NextResponse.json({ error: validationError }, { status: 502 });
        }

        success = true;
        const used = await getQuizAiGenerationCount(uid);
        const limit = getMaxQuizAiGenerationsPerUser();
        return NextResponse.json({
          title,
          topic: topicLabel || title,
          description,
          questions,
          usage: { used, limit, remaining: Math.max(0, limit - used) },
        });
      }

      if (!Array.isArray(parsed)) {
        return NextResponse.json(
          { error: "A IA não retornou uma lista de perguntas." },
          { status: 502 }
        );
      }

      const questions = parsed as Question[];
      const validationError = validateQuestions(questions);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 502 });
      }

      success = true;
      const used = await getQuizAiGenerationCount(uid);
      const limit = getMaxQuizAiGenerationsPerUser();
      return NextResponse.json({
        questions,
        usage: { used, limit, remaining: Math.max(0, limit - used) },
      });
  } finally {
    if (!success) {
      await refundQuizAiGeneration(uid);
    }
  }
}
