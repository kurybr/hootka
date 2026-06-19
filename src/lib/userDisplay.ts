interface UserDisplayInput {
  displayName?: string | null;
  username?: string | null;
  email?: string | null;
  isAnonymous?: boolean;
}

export function getUserDisplayName({
  displayName,
  username,
  email,
  isAnonymous,
}: UserDisplayInput): string {
  const fromProfile = username?.trim() || displayName?.trim();
  if (fromProfile) return fromProfile;
  if (isAnonymous) return "Sessão de jogo";
  const mail = email?.trim();
  if (mail) return mail.split("@")[0] ?? "Conta";
  return "Conta";
}

export function getUserProfileHeading({
  displayName,
  username,
  email,
  isAnonymous,
}: UserDisplayInput): string {
  const full = displayName?.trim() || username?.trim();
  if (full) return full;
  return getUserDisplayName({ displayName, username, email, isAnonymous });
}

export function getUserNavbarLabel(input: UserDisplayInput): string {
  const heading = getUserProfileHeading(input);
  const first = heading.split(/\s+/)[0];
  return first || heading;
}

export function truncateEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return trimmed;
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (!domain) return trimmed;
  return `${local}@${domain.charAt(0)}...`;
}
