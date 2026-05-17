"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  isSignInWithEmailLink,
  signInWithPopup,
  signInWithEmailAndPassword,
  signInAnonymously,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { get, ref, update } from "firebase/database";
import { getFirebaseAuth, getFirebaseDatabase } from "@/lib/firebase";
import { isValidPlayerDisplayName } from "@/lib/playerIdentity";

const EMAIL_LINK_EMAIL_KEY = "hootka_email_link_email";
const EMAIL_LINK_USERNAME_KEY = "hootka_email_link_username";
const EMAIL_LINK_REDIRECT_KEY = "hootka_email_link_redirect";

interface AuthProfile {
  username: string | null;
  role: "user" | "admin";
  email: string | null;
  emailVerified: boolean;
  photoURL: string | null;
  isAnonymous: boolean;
}

interface AuthContextValue {
  user: User | null;
  profile: AuthProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmailPassword?: (email: string, password: string) => Promise<void>;
  /** Sessão anônima para jogar quiz global (ranking por dispositivo). */
  signInAnonymouslyForPlay: () => Promise<void>;
  /** Nome no ranking (grava em perfil + displayName do Firebase Auth). */
  setPlayerDisplayName: (name: string) => Promise<void>;
  sendEmailLinkSignIn: (
    email: string,
    username: string,
    redirectPath?: string
  ) => Promise<void>;
  completeEmailLinkSignIn: (
    url?: string
  ) => Promise<{ redirectPath: string; completed: boolean }>;
  getIdToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInAnonymouslyForPlay: async () => {},
  setPlayerDisplayName: async () => {},
  sendEmailLinkSignIn: async () => {},
  completeEmailLinkSignIn: async () => ({
    redirectPath: "/quizzes",
    completed: false,
  }),
  getIdToken: async () => null,
  signOut: async () => {},
});

async function saveUserProfile(user: User, username?: string) {
  const db = getFirebaseDatabase();
  if (!db) return;

  const preferredUsername =
    username?.trim() || user.displayName?.trim() || user.email?.split("@")[0] || null;

  await update(ref(db, `users/${user.uid}/profile`), {
    displayName: preferredUsername,
    username: preferredUsername,
    email: user.email ?? null,
    photoURL: user.photoURL ?? null,
    emailVerified: user.emailVerified,
    isAnonymous: user.isAnonymous,
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (!user) {
        setProfile(null);
        return;
      }

      const db = getFirebaseDatabase();
      if (!db) {
        setProfile({
          username: user.displayName ?? null,
          role: "user",
          email: user.email ?? null,
          emailVerified: user.emailVerified,
          photoURL: user.photoURL ?? null,
          isAnonymous: user.isAnonymous,
        });
        return;
      }

      const snapshot = await get(ref(db, `users/${user.uid}/profile`));
      const data = snapshot.val() as Partial<AuthProfile> | null;

      if (cancelled) return;

      const resolvedUsername =
        data?.username ?? user.displayName ?? null;

      setProfile({
        username: resolvedUsername,
        role: data?.role === "admin" ? "admin" : "user",
        email: data?.email ?? user.email ?? null,
        emailVerified: data?.emailVerified ?? user.emailVerified,
        photoURL: data?.photoURL ?? user.photoURL ?? null,
        isAnonymous: user.isAnonymous,
      });
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSignInAnonymouslyForPlay = async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase não disponível");
    if (auth.currentUser) return;
    const cred = await signInAnonymously(auth);
    await saveUserProfile(cred.user);
  };

  const handleSetPlayerDisplayName = async (name: string) => {
    const auth = getFirebaseAuth();
    const u = auth?.currentUser;
    if (!auth || !u) throw new Error("Faça login ou inicie uma sessão de jogo.");
    const trimmed = name.trim();
    if (!isValidPlayerDisplayName(trimmed)) {
      throw new Error("Informe um nome de 2 a 30 caracteres.");
    }
    await updateProfile(u, { displayName: trimmed });
    await saveUserProfile(u, trimmed);
    setProfile((prev) =>
      prev
        ? { ...prev, username: trimmed }
        : {
            username: trimmed,
            role: "user",
            email: u.email ?? null,
            emailVerified: u.emailVerified,
            photoURL: u.photoURL ?? null,
            isAnonymous: u.isAnonymous,
          }
    );
  };

  const handleSignInWithEmailPassword = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase não disponível");
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const handleSignInWithGoogle = async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      return;
    }

    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await saveUserProfile(result.user);
    } catch (error) {
      throw error;
    }
  };

  const handleSendEmailLinkSignIn = async (
    email: string,
    username: string,
    redirectPath = "/quizzes"
  ) => {
    const auth = getFirebaseAuth();
    if (!auth || typeof window === "undefined") {
      throw new Error("Firebase não está disponível");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();

    if (!normalizedEmail || !normalizedUsername) {
      throw new Error("Informe seu e-mail e nome de usuário");
    }

    const url = new URL("/auth/email-link", window.location.origin);
    url.searchParams.set("redirect", redirectPath);

    await sendSignInLinkToEmail(auth, normalizedEmail, {
      url: url.toString(),
      handleCodeInApp: true,
    });

    localStorage.setItem(EMAIL_LINK_EMAIL_KEY, normalizedEmail);
    localStorage.setItem(EMAIL_LINK_USERNAME_KEY, normalizedUsername);
    localStorage.setItem(EMAIL_LINK_REDIRECT_KEY, redirectPath);
  };

  const handleCompleteEmailLinkSignIn = async (url = window.location.href) => {
    const auth = getFirebaseAuth();
    if (!auth || typeof window === "undefined") {
      throw new Error("Firebase não está disponível");
    }

    if (!isSignInWithEmailLink(auth, url)) {
      return { redirectPath: "/quizzes", completed: false };
    }

    const email = localStorage.getItem(EMAIL_LINK_EMAIL_KEY);
    const username = localStorage.getItem(EMAIL_LINK_USERNAME_KEY) ?? "";
    const redirectPath =
      localStorage.getItem(EMAIL_LINK_REDIRECT_KEY) || "/quizzes";

    if (!email) {
      throw new Error(
        "Não foi possível concluir o login. Solicite um novo link de acesso."
      );
    }

    const result = await signInWithEmailLink(auth, email, url);

    const nextUsername =
      username.trim() ||
      result.user.displayName?.trim() ||
      result.user.email?.split("@")[0] ||
      "Usuário";

    if (result.user.displayName !== nextUsername) {
      await updateProfile(result.user, {
        displayName: nextUsername,
      });
    }

    await saveUserProfile(auth.currentUser ?? result.user, nextUsername);

    localStorage.removeItem(EMAIL_LINK_EMAIL_KEY);
    localStorage.removeItem(EMAIL_LINK_USERNAME_KEY);
    localStorage.removeItem(EMAIL_LINK_REDIRECT_KEY);

    return { redirectPath, completed: true };
  };

  const handleGetIdToken = async () => {
    const auth = getFirebaseAuth();
    const currentUser = auth?.currentUser;
    if (!currentUser) return null;
    return currentUser.getIdToken();
  };

  const handleSignOut = async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle: handleSignInWithGoogle,
        signInWithEmailPassword:
          process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true"
            ? handleSignInWithEmailPassword
            : undefined,
        signInAnonymouslyForPlay: handleSignInAnonymouslyForPlay,
        setPlayerDisplayName: handleSetPlayerDisplayName,
        sendEmailLinkSignIn: handleSendEmailLinkSignIn,
        completeEmailLinkSignIn: handleCompleteEmailLinkSignIn,
        getIdToken: handleGetIdToken,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
