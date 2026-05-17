/**
 * Rotas onde o AdSense pode exibir anúncios (conteúdo editorial do editor).
 * Evita violação "anúncios em telas sem conteúdo do editor" (login, lobby, jogo, etc.).
 */

const BLOCKED_PREFIXES = [
  "/host",
  "/play",
  "/join",
  "/auth",
  "/admin",
  "/community",
] as const;

/** Página de detalhe do quiz: /quizzes/[slug] — não inclui /play nem /ranking */
const QUIZ_DETAIL_PATTERN = /^\/quizzes\/[^/]+$/;

export function isAdsenseContentRoute(pathname: string): boolean {
  if (BLOCKED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return false;
  }
  if (pathname.includes("/play") || pathname.endsWith("/ranking")) {
    return false;
  }
  if (pathname === "/" || pathname === "/about") {
    return true;
  }
  if (pathname === "/quizzes" || QUIZ_DETAIL_PATTERN.test(pathname)) {
    return true;
  }
  return false;
}
