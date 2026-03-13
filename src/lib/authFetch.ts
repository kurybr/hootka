import { getFirebaseAuth } from "@/lib/firebase";

export async function getAuthHeaders(
  headers: HeadersInit = {}
): Promise<HeadersInit> {
  const auth = getFirebaseAuth();
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;

  return token
    ? {
        ...headers,
        Authorization: `Bearer ${token}`,
      }
    : headers;
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const headers = await getAuthHeaders(init.headers);
  return fetch(input, {
    ...init,
    headers,
  });
}
