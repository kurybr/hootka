/** Convites de doação aparecem apenas em rotas de host. */
export function isDonateHostContext(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === "/host" || pathname.startsWith("/host/");
}
