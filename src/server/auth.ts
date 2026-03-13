import { type NextRequest } from "next/server";
import { getFirebaseAdminAuth, getFirebaseAdminDatabase } from "@/lib/firebaseAdmin";

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  username: string | null;
  role: "user" | "admin";
}

export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  const auth = getFirebaseAdminAuth();
  if (!auth) return null;

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length);
  const decoded = await auth.verifyIdToken(token);
  const db = getFirebaseAdminDatabase();
  const profileSnapshot = db
    ? await db.ref(`users/${decoded.uid}/profile`).get()
    : null;
  const profile = profileSnapshot?.val() as
    | { username?: string; role?: "user" | "admin" }
    | null;

  return {
    uid: decoded.uid,
    email: decoded.email ?? null,
    emailVerified: decoded.email_verified ?? false,
    username: profile?.username ?? decoded.name ?? null,
    role: profile?.role === "admin" ? "admin" : "user",
  };
}

export async function requireAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new Error("AUTH_REQUIRED");
  }
  return user;
}

export function requireVerifiedEmail(user: AuthenticatedUser): void {
  if (!user.emailVerified) {
    throw new Error("EMAIL_NOT_VERIFIED");
  }
}

export function requireAdmin(user: AuthenticatedUser): void {
  if (user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
}
