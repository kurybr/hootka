"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { ref, set } from "firebase/database";
import { getFirebaseApp, getFirebaseDatabase } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

async function saveUserProfile(user: User) {
  const db = getFirebaseDatabase();
  if (!db) return;
  await set(ref(db, `users/${user.uid}/profile`), {
    displayName: user.displayName ?? null,
    email: user.email ?? null,
    photoURL: user.photoURL ?? null,
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const app = getFirebaseApp();
    if (!app) {
      setLoading(false);
      return;
    }

    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleSignInWithGoogle = async () => {
    console.log("[Auth] Iniciando signInWithGoogle");
    const app = getFirebaseApp();
    if (!app) {
      console.error("[Auth] getFirebaseApp() retornou null/undefined");
      return;
    }

    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    console.log("[Auth] Chamando signInWithPopup");
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("[Auth] signInWithPopup resolvido", {
        uid: result.user.uid,
        email: result.user.email,
      });
      await saveUserProfile(result.user);
      console.log("[Auth] Perfil salvo com sucesso no Realtime Database");
    } catch (error) {
      console.error("[Auth] Erro em signInWithGoogle", error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    const app = getFirebaseApp();
    if (!app) return;

    const auth = getAuth(app);
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle: handleSignInWithGoogle,
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
