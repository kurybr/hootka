export function getGitHubRepoUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_GITHUB_REPO_URL?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : "https://github.com/kurybr/hootka";
}
